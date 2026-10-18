"""
종이(크림색·질감) 배경 그림 → 투명 PNG/WebP   (흰 배경은 cut-illust.py)

  python tools/cut-paper.py "원본.jpg" 이름 [최대폭] [옵션]
  → assets/illust/이름.png, 이름.webp

옵션
  --box L,T,R,B        원본 픽셀 기준으로 먼저 잘라낼 영역
  --drop-above Y       윗변이 Y(원본 px)보다 위에 있는 덩어리는 버림 (손글씨 제거용)
  --drop-below Y       윗변이 Y(원본 px)보다 아래에 있는 덩어리는 버림 (손글씨만 남길 때)
  --min-area N         N px 미만 덩어리는 종이 얼룩으로 보고 버림 (기본 400)
  --paper T            "종이색" 판정 거리 (기본 5.5). 연분홍 드레스·피부가 빠지면 낮추고, 종이가 남으면 높인다
  --pad N              여백 px (기본 24, 리사이즈 전 기준)

방식 (스티커 컷):
  1) 종이 질감 노이즈를 흐려서 없앤 뒤, 가장자리 종이색(중앙값)과의 색 거리가 T 미만인 픽셀을 "종이 후보"로 본다
  2) 종이 후보 중 그림 바깥 테두리와 이어진 덩어리만 배경으로 지운다
     → 선 안쪽에 있는 연분홍 드레스·피부·베일·흰 셔츠처럼 종이와 색이 비슷한 영역은 그대로 남는다
  3) 선 바깥에 남는 2~3px 종이색 띠(흐림 때문에 생김)는 테두리 띠에서만 걷어낸다
  4) 가장자리 1px 는 알파로 부드럽게, 색은 알파로 되돌려(un-premultiply) 어느 배경에 올려도 테두리가 뜨지 않게 한다
"""
import sys
from pathlib import Path
from PIL import Image, ImageFilter
import numpy as np
from scipy import ndimage

args = sys.argv[1:]
opt, pos, i = {}, [], 0
while i < len(args):
    if args[i].startswith("--"):
        opt[args[i][2:]] = args[i + 1]; i += 2
    else:
        pos.append(args[i]); i += 1
src, name = pos[0], pos[1]
maxw = int(pos[2]) if len(pos) > 2 else 1000
dst = Path(__file__).resolve().parent.parent / "assets" / "illust"

im = Image.open(src).convert("RGB")
full = np.asarray(im).astype(np.float32)
edge = np.concatenate([full[:60].reshape(-1, 3), full[-60:].reshape(-1, 3), full[:, :60].reshape(-1, 3), full[:, -60:].reshape(-1, 3)])
bg = np.median(edge, 0)

oy = 0
if "box" in opt:
    L, T, R, B = map(int, opt["box"].split(","))
    im = im.crop((L, T, R, B)); oy = T
rgb = np.asarray(im).astype(np.float32)
h, w = rgb.shape[:2]

T_PAPER = float(opt.get("paper", 5.5))
d_smooth = np.sqrt(((np.asarray(im.filter(ImageFilter.GaussianBlur(2.5))).astype(np.float32) - bg) ** 2).sum(-1))
d_fine   = np.sqrt(((np.asarray(im.filter(ImageFilter.GaussianBlur(1.0))).astype(np.float32) - bg) ** 2).sum(-1))

# 1) 종이 후보 → 2) 테두리와 이어진 덩어리만 배경
paper = d_smooth < T_PAPER
lab, n = ndimage.label(paper)
border_ids = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
border_ids = border_ids[border_ids > 0]
background = np.isin(lab, border_ids)
fg = ~background

# 3) 선 바깥 종이색 띠 제거: 전경 가장자리 4px 띠 안에서, 미세 거리로도 종이색이면 배경으로
band = fg & ~ndimage.binary_erosion(fg, iterations=4)
fg = fg & ~(band & (d_fine < T_PAPER + 1.5))
fg = ndimage.binary_opening(fg, iterations=1) | ndimage.binary_erosion(fg, iterations=1)   # 1px 돌기 정리

# 덩어리 필터: 작은 것(min-area) · 종이 섬유 얼룩(평균 색 거리가 낮은 것) 제거, 손글씨 분리
lab, n = ndimage.label(fg)
idx = np.arange(n + 1)
areas = ndimage.sum(np.ones_like(lab), lab, index=idx)
meand = ndimage.mean(d_fine, lab, index=idx)
keep = np.zeros(n + 1, bool)
min_area = int(opt.get("min-area", 400))
PAPER_BLOB = 14.0                                            # 평균 거리가 이보다 낮은 덩어리 = 종이 얼룩 (드레스 ~11 은 선과 붙어 있어 평균이 훨씬 높다)
drop_above = int(opt["drop-above"]) - oy if "drop-above" in opt else None
drop_below = int(opt["drop-below"]) - oy if "drop-below" in opt else None
for k, sl in enumerate(ndimage.find_objects(lab), start=1):
    if sl is None or areas[k] < min_area or meand[k] < PAPER_BLOB: continue
    if drop_above is not None and sl[0].start < drop_above: continue
    if drop_below is not None and sl[0].start > drop_below: continue
    keep[k] = True
fg = keep[lab]

# 4) 가장자리: 바깥 4px 띠는 색 거리로 알파를 매겨(종이와 선의 혼합 픽셀 → 반투명) 베이지 테두리를 없애고, 안쪽은 불투명
band = fg & ~ndimage.binary_erosion(fg, iterations=4)
alpha = fg.astype(np.float32)
alpha[band] = np.clip((d_fine[band] - 5.0) / 30.0, 0.0, 1.0)
alpha = np.where(fg, alpha, 0.0)
alpha = ndimage.gaussian_filter(alpha, 0.6)
alpha = np.where(fg, alpha, np.minimum(alpha, 0.5)).astype(np.float32)   # 바깥으로 번진 것은 약하게만
alpha = np.clip(alpha, 0, 1).astype(np.float32)
a3 = np.clip(alpha, 0.15, 1)[..., None]
ink = (rgb - (1 - a3) * bg) / a3                              # orig = a*ink + (1-a)*bg
ink = np.where(alpha[..., None] > 0, ink, rgb)
out = Image.fromarray(np.dstack([np.clip(ink, 0, 255), alpha * 255]).astype(np.uint8), "RGBA")

pad = int(opt.get("pad", 24))
b = Image.fromarray((alpha > 0.3).astype(np.uint8) * 255).getbbox()
out = out.crop((max(0, b[0] - pad), max(0, b[1] - pad), min(w, b[2] + pad), min(h, b[3] + pad)))
out.thumbnail((maxw, maxw), Image.LANCZOS)
out.save(dst / f"{name}.png", optimize=True); out.save(dst / f"{name}.webp", quality=92, method=6)
print(name, out.size, f"bg={bg.astype(int).tolist()} paper<{T_PAPER} components kept {keep.sum()}/{n}")
