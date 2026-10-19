"""
종이(크림색·질감) 배경 그림 → 투명 PNG/WebP   (흰 배경은 cut-illust.py)

  python tools/cut-paper.py "원본.jpg" 이름 [최대폭] [옵션]
  → assets/illust/이름.png, 이름.webp

옵션
  --box L,T,R,B        원본 픽셀 기준으로 먼저 잘라낼 영역
  --drop-above Y       윗변이 Y(원본 px)보다 위에 있는 덩어리는 버림 (손글씨 제거용)
  --drop-below Y       윗변이 Y(원본 px)보다 아래에 있는 덩어리는 버림 (손글씨만 남길 때)
  --min-area N         N px 미만 덩어리는 버림 (기본 0 — 종이 티는 2) 에서, 옅은 잔물결은 문턱에서 이미 사라진다)
  --floor F            이보다 옅은 알파는 0 으로 (기본 0.006, 짝이 없는 그림은 배경 잡음의 1.5배). 종이 잔여가 보이면 올리고, 베일이 사라지면 내린다
  --boost M            옅은 면(알파 0.2 미만)만 최대 M 배 진하게 (기본 2.5, 1 = 원본 그대로).
                       종이 위에서는 베이지와의 색 대비로 보이던 연분홍 베일·드레스가 흰 바탕에서는 거의 흰색이 되므로 보정한다.
                       선·진한 색은 그대로
  --pad N              여백 px (기본 24, 리사이즈 전 기준)

방식 (종이 나누기):
  assets/source 의 실물 원본(3508×2480)들은 같은 종이 질감 레이어를 쓴다 — 섬유 티까지 픽셀 단위로 같다.
  1) 같은 크기 원본을 모두 겹쳐, 픽셀마다 가장 밝은 값들(그 자리에 그림이 없는 장)로 "종이 지도"를 만든다
  2) 원본 ÷ 종이 지도 → 종이는 정확히 흰색, 그림은 흰 종이에 그린 색이 되고 질감·섬유 티는 사라진다
  3) 흰색을 투명으로 분리(color-to-alpha): 알파 = 흰색에서 가장 먼 채널의 거리, 색은 알파로 되돌린다
  → 흰 바탕에 올리면 2)와 픽셀 단위로 같다. "어디까지가 그림인가"를 판정하지 않으므로
    종이 덩어리·베이지 테두리·보풀이 생기지 않는다. 선 안쪽의 빈 종이(수레 다리 사이 등)는 투명,
    종이와 비슷한 연분홍 드레스·베일·피부는 흰 종이 위의 연한 색으로 남는다.
  흰 바탕(--bg #fff) 전용이다. 어두운 바탕에 올리면 옅은 면이 비친다.
  같은 크기 원본이 없는 그림(ChatGPT 흰 배경 그림 등)은 가장자리 배경색 하나로 나눈다 — 같은 톤으로 맞추려면 새 그림도 이 도구로.
"""
import sys
from pathlib import Path
from PIL import Image
import numpy as np
from scipy import ndimage

args = sys.argv[1:]
opt, pos, i = {}, [], 0
while i < len(args):
    if args[i].startswith("--"):
        opt[args[i][2:]] = args[i + 1]; i += 2
    else:
        pos.append(args[i]); i += 1
src, name = Path(pos[0]), pos[1]
maxw = int(pos[2]) if len(pos) > 2 else 1000
root = Path(__file__).resolve().parent.parent
dst = root / "assets" / "illust"

im = Image.open(src).convert("RGB")
full = np.asarray(im).astype(np.float32)

# 1) 종이 지도: 같은 크기 원본들 중 픽셀마다 가장 밝은 장들(밝기 차 6 이내)의 평균
sources = [p for p in (root / "assets" / "source").glob("*.jpg") if Image.open(p).size == im.size]
if src.resolve() not in [p.resolve() for p in sources]:
    sources.append(src)
edge = np.concatenate([full[:60].reshape(-1, 3), full[-60:].reshape(-1, 3), full[:, :60].reshape(-1, 3), full[:, -60:].reshape(-1, 3)])
P = np.median(edge, 0)
if len(sources) >= 2:
    stack = np.stack([np.asarray(Image.open(p).convert("RGB")).astype(np.float32) for p in sources])
    lum = stack.mean(-1)
    top = lum.max(0)
    agree = lum >= top - 6
    paper = (stack * agree[..., None]).sum(0) / agree.sum(0)[..., None]
    # 모든 장에 그림이 있는 자리(가장 밝은 값도 섬유 티보다 어두움)는 평균 종이색으로
    w = np.clip((top - 175) / 15, 0, 1)[..., None]
    paper = w * paper + (1 - w) * P
    del stack, lum, agree
    noise_floor = 0.006                                     # 질감을 나눠 없앴으므로 JPEG 잡음만 남는다
else:                                                       # 짝이 없는 그림(ChatGPT 흰 배경 등) — 가장자리 배경색 하나로 나눈다
    paper = np.broadcast_to(P, full.shape)
    # 배경 잡음은 나눠 없앨 수 없으니 문턱을 잡음 위로 (안 그러면 --boost 가 잡음까지 키워 그림 둘레에 띠가 생긴다)
    edge_a = (np.maximum(P - edge, 0) / np.maximum(P, 1)).max(-1)
    noise_floor = max(0.006, 1.5 * float(np.percentile(edge_a, 99.9)))

ox = oy = 0
if "box" in opt:
    L, T, R, B = map(int, opt["box"].split(","))
    full, paper = full[T:B, L:R], paper[T:B, L:R]; ox, oy = L, T
h, w_ = full.shape[:2]

# 2) 종이 나누기 → 3) 흰색을 투명으로
white = np.clip(full / np.maximum(paper, 1) * 255, 0, 255)
alpha = ((255 - white) / 255).max(-1)
FLOOR = float(opt.get("floor", noise_floor))
alpha = alpha * np.clip((alpha - FLOOR) / FLOOR, 0, 1)      # FLOOR 아래는 0, 2×FLOOR 부터 그대로 (부드러운 문턱)
# 진한 곳과 이어지지 않은 옅은 점(JPEG 잔물결)만 지운다 — 선에 붙은 베일 같은 옅은 면은 남는다
lab, n = ndimage.label(alpha > 0, structure=np.ones((3, 3)))
alpha = np.where((ndimage.maximum(alpha, lab, index=np.arange(n + 1)) >= 0.08)[lab], alpha, 0)
# 주변 3px 안에 아무것도 없는 작은 점(남은 섬유 티)도 지운다 — 면 안쪽 질감은 큰 덩어리에 묶여 안전
lab, n = ndimage.label(ndimage.binary_dilation(alpha > 0.03, iterations=3), structure=np.ones((3, 3)))
dots = ndimage.sum(alpha > 0.03, lab, index=np.arange(n + 1)) < 12; dots[0] = False
alpha = np.where(dots[lab], 0, alpha)

# 덩어리 단위 정리 (손글씨 분리·작은 티)
min_area = int(opt.get("min-area", 0))
drop_above = int(opt["drop-above"]) - oy if "drop-above" in opt else None
drop_below = int(opt["drop-below"]) - oy if "drop-below" in opt else None
if min_area or drop_above is not None or drop_below is not None:
    lab, n = ndimage.label(ndimage.binary_dilation(alpha > 0.04, iterations=2), structure=np.ones((3, 3)))
    areas = ndimage.sum(alpha > 0.04, lab, index=np.arange(n + 1))
    keep = np.zeros(n + 1, bool)
    for k, sl in enumerate(ndimage.find_objects(lab), start=1):
        if sl is None or areas[k] < min_area: continue
        if drop_above is not None and sl[0].start < drop_above: continue
        if drop_below is not None and sl[0].start > drop_below: continue
        keep[k] = True
    alpha = np.where(keep[lab], alpha, 0)

a3 = np.maximum(alpha, 1e-4)[..., None]
ink = np.clip((white - (1 - a3) * 255) / a3, 0, 255)        # white = a·ink + (1-a)·255
BOOST = float(opt.get("boost", 2.5))
if BOOST != 1:                                              # 옅은 면만 진하게: 알파 0 근처는 ×BOOST, 0.2 부터는 그대로 (단조 증가)
    alpha = alpha * (1 + (BOOST - 1) * np.clip(1 - alpha / 0.2, 0, 1) ** 2)
out = Image.fromarray(np.dstack([ink, alpha * 255]).round().astype(np.uint8), "RGBA")

pad = int(opt.get("pad", 24))
b = Image.fromarray((alpha > 0.1).astype(np.uint8) * 255).getbbox()
out = out.crop((max(0, b[0] - pad), max(0, b[1] - pad), min(w_, b[2] + pad), min(h, b[3] + pad)))
if out.width > maxw or out.height > maxw:                   # 알파를 곱한 상태로 줄여야 가장자리가 어두워지지 않는다
    s = maxw / max(out.size)
    out = out.convert("RGBa").resize((round(out.width * s), round(out.height * s)), Image.LANCZOS).convert("RGBA")
    o = np.asarray(out).copy()                              # 축소 링잉으로 생긴 외딴 1~3px 점 정리
    lab, n = ndimage.label(ndimage.binary_dilation(o[..., 3] > 8, iterations=2), structure=np.ones((3, 3)))
    dots = ndimage.sum(o[..., 3] > 8, lab, index=np.arange(n + 1)) < 6; dots[0] = False
    o[dots[lab], 3] = 0
    out = Image.fromarray(o, "RGBA")
out.save(dst / f"{name}.png", optimize=True)
out.save(dst / f"{name}.webp", quality=92, method=6, alpha_quality=100)
print(name, out.size, f"paper={P.astype(int).tolist()} layers={len(sources)} floor={FLOOR:.4f}")
