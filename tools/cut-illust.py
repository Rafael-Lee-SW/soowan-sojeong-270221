"""
흰 배경 그림 → 투명 PNG/WebP

  python tools/cut-illust.py "assets/source/파일.png" 이름 [최대폭]
  → assets/illust/이름.png, 이름.webp (+ 최대폭 지정 시 그 폭으로 축소)

가장자리에서 이어진 흰 영역만 지우므로, 선으로 둘러싸인 흰색(드레스 등)은 남는다.
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

src, name = sys.argv[1], sys.argv[2]
maxw = int(sys.argv[3]) if len(sys.argv) > 3 else 1000
dst = Path(__file__).resolve().parent.parent / "assets" / "illust"

im = Image.open(src).convert("RGB")
f = im.copy(); w, h = f.size
for seed in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, 0), (w // 2, h - 1), (0, h // 2), (w - 1, h // 2)]:
    ImageDraw.floodfill(f, seed, (255, 0, 255), thresh=40)
a = np.asarray(f); bg = (a[..., 0] == 255) & (a[..., 1] == 0) & (a[..., 2] == 255)
rgb = np.asarray(im).astype(np.float32)
soft = np.clip((np.sqrt(((rgb - 255) ** 2).sum(-1)) - 8) / 30, 0, 1)
alpha = np.where(bg, 0, 1).astype(np.float32)
edge = (np.asarray(Image.fromarray((bg * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))) > 0) & ~bg
alpha = np.where(edge, soft, alpha)
out = Image.fromarray(np.dstack([rgb, alpha * 255]).astype(np.uint8), "RGBA")
b = Image.fromarray(((alpha > 0.5) * 255).astype(np.uint8)).getbbox(); pad = 24
out = out.crop((max(0, b[0] - pad), max(0, b[1] - pad), min(w, b[2] + pad), min(h, b[3] + pad)))
out.thumbnail((maxw, maxw))
out.save(dst / f"{name}.png", optimize=True); out.save(dst / f"{name}.webp", quality=90, method=6)
print(name, out.size)
