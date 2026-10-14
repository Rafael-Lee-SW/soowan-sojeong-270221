"""
종이(크림색·질감) 배경 그림 → 투명 PNG/WebP   (흰 배경은 cut-illust.py)

  python tools/cut-paper.py "원본.jpg" 이름 [최대폭] [옵션]
  → assets/illust/이름.png, 이름.webp

옵션
  --box L,T,R,B        원본 픽셀 기준으로 먼저 잘라낼 영역
  --drop-above Y       윗변이 Y(원본 px)보다 위에 있는 덩어리는 버림 (손글씨 제거용)
  --min-area N         N px 미만 덩어리는 종이 얼룩으로 보고 버림 (기본 400)
  --pad N              여백 px (기본 24, 리사이즈 전 기준)

배경색은 가장자리 중앙값으로 잡고, 색 거리에 따라 알파를 매긴 뒤
알파로 되돌려(un-premultiply) 선 색을 복원하므로 어느 배경에 올려도 테두리가 뜨지 않는다.
"""
import sys
from pathlib import Path
from PIL import Image, ImageFilter
import numpy as np
from scipy import ndimage

args = sys.argv[1:]
opt = {}
pos = []
i = 0
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

if "box" in opt:
    L, T, R, B = map(int, opt["box"].split(","))
    im = im.crop((L, T, R, B)); oy = T
else:
    oy = 0
rgb = np.asarray(im).astype(np.float32)
blur = np.asarray(im.filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32)
dist = np.sqrt(((blur - bg) ** 2).sum(-1))
LO, HI = 38.0, 110.0                       # 종이 노이즈 상한 ~64, 선 ~300
alpha = np.clip((dist - LO) / (HI - LO), 0, 1)

lab, n = ndimage.label(alpha > 0.35)
keep = np.zeros(n + 1, bool)
min_area = int(opt.get("min-area", 400))
drop_above = int(opt["drop-above"]) - oy if "drop-above" in opt else None
objs = ndimage.find_objects(lab)
areas = ndimage.sum(np.ones_like(lab), lab, index=np.arange(n + 1))
for k, sl in enumerate(objs, start=1):
    if sl is None: continue
    if areas[k] < min_area: continue
    if drop_above is not None and sl[0].start < drop_above: continue
    keep[k] = True
mask = keep[lab]
mask = ndimage.binary_dilation(mask, iterations=3)   # 램프 가장자리까지 살림
alpha = np.where(mask, alpha, 0).astype(np.float32)

# 색 복원: orig = a*ink + (1-a)*bg  →  ink = (orig - (1-a)*bg) / a
a3 = np.clip(alpha, 0.08, 1)[..., None]
ink = (rgb - (1 - a3) * bg) / a3
ink = np.where(alpha[..., None] > 0, ink, rgb)
out = Image.fromarray(np.dstack([np.clip(ink, 0, 255), alpha * 255]).astype(np.uint8), "RGBA")

pad = int(opt.get("pad", 24))
b = Image.fromarray((alpha > 0.3).astype(np.uint8) * 255).getbbox()
w, h = out.size
out = out.crop((max(0, b[0] - pad), max(0, b[1] - pad), min(w, b[2] + pad), min(h, b[3] + pad)))
out.thumbnail((maxw, maxw), Image.LANCZOS)
out.save(dst / f"{name}.png", optimize=True); out.save(dst / f"{name}.webp", quality=90, method=6)
print(name, out.size, f"bg={bg.astype(int).tolist()} components kept {keep.sum()}/{n}")
