"""
갤러리 사진 준비 스크립트

  originals/  (git 제외, DSLR 원본)  →  assets/photos/  (웹용 1600px + 600px 썸네일)  +  js/photos.js 갱신

사용:  python tools/resize-photos.py
순서:  originals/ 안의 파일명 정렬 순서가 갤러리 순서가 된다. (001_xxx.jpg 처럼 번호를 붙이면 편함)
"""
from pathlib import Path
from PIL import Image, ImageOps
import json

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "originals"
DST = ROOT / "assets" / "photos"
OUT = ROOT / "js" / "photos.js"
FULL, THUMB = 1600, 600

DST.mkdir(parents=True, exist_ok=True)
for old in DST.glob("*.jpg"):
    old.unlink()

entries = []
files = sorted(p for p in SRC.iterdir() if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".heic", ".webp"})
for i, p in enumerate(files, 1):
    try:
        im = ImageOps.exif_transpose(Image.open(p)).convert("RGB")
    except Exception as e:  # HEIC 는 pillow-heif 필요
        print(f"skip {p.name}: {e}")
        continue
    name = f"{i:03d}"
    full = im.copy(); full.thumbnail((FULL, FULL))
    full.save(DST / f"{name}.jpg", quality=86, optimize=True, progressive=True)
    th = im.copy(); th.thumbnail((THUMB, THUMB))
    th.save(DST / f"{name}@600.jpg", quality=82, optimize=True)
    entries.append({"src": f"assets/photos/{name}.jpg", "thumb": f"assets/photos/{name}@600.jpg", "w": full.width, "h": full.height})
    print(f"{p.name} → {name}.jpg ({full.width}x{full.height})")

OUT.write_text(
    "// 갤러리 사진 목록 — tools/resize-photos.py 가 자동 생성합니다. 직접 수정하지 마세요.\n"
    "window.PHOTOS = " + json.dumps(entries, ensure_ascii=False, indent=2) + ";\n",
    encoding="utf-8",
)
print(f"\n{len(entries)}장 → {OUT.relative_to(ROOT)}")
