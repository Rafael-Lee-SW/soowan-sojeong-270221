"""
갤러리 사진 준비 스크립트

  originals/studio/  DSLR 사진   →  assets/photos/studio/  (1600px + 600px 썸네일)
  originals/film/    아이폰4 사진 →  assets/photos/film/    (900px, 폴라로이드용)
  → js/photos.js 갱신

사용:  python tools/resize-photos.py
순서:  각 폴더 안의 파일명 정렬 순서가 갤러리 순서. (01_xxx.jpg 처럼 번호를 붙이면 편함)
HEIC 는 pillow-heif 가 필요:  pip install pillow-heif
"""
from pathlib import Path
from PIL import Image, ImageOps
import json

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "originals"
DST = ROOT / "assets" / "photos"
OUT = ROOT / "js" / "photos.js"
EXT = {".jpg", ".jpeg", ".png", ".heic", ".webp"}
SETS = {"studio": (1600, 600), "film": (900, 0)}

try:
    import pillow_heif; pillow_heif.register_heif_opener()
except ImportError:
    pass

result = {}
for name, (full_w, thumb_w) in SETS.items():
    src = SRC / name
    dst = DST / name
    dst.mkdir(parents=True, exist_ok=True)
    for old in dst.glob("*.jpg"):
        old.unlink()
    entries = []
    files = sorted(p for p in src.iterdir() if p.suffix.lower() in EXT) if src.exists() else []
    for i, p in enumerate(files, 1):
        try:
            im = ImageOps.exif_transpose(Image.open(p)).convert("RGB")
        except Exception as e:
            print(f"skip {p.name}: {e}")
            continue
        base = f"{i:02d}"
        full = im.copy(); full.thumbnail((full_w, full_w))
        full.save(dst / f"{base}.jpg", quality=86, optimize=True, progressive=True)
        entry = {"src": f"assets/photos/{name}/{base}.jpg", "w": full.width, "h": full.height}
        if thumb_w:
            th = im.copy(); th.thumbnail((thumb_w, thumb_w))
            th.save(dst / f"{base}@{thumb_w}.jpg", quality=82, optimize=True)
            entry["thumb"] = f"assets/photos/{name}/{base}@{thumb_w}.jpg"
        entries.append(entry)
        print(f"{name}/{p.name} → {base}.jpg ({full.width}x{full.height})")
    result[name] = entries

OUT.write_text(
    "// 갤러리 사진 목록 — tools/resize-photos.py 가 자동 생성합니다. 직접 수정하지 마세요.\n"
    "window.PHOTOS = " + json.dumps(result, ensure_ascii=False, indent=2) + ";\n",
    encoding="utf-8",
)
print(f"\nstudio {len(result['studio'])}장, film {len(result['film'])}장 → {OUT.relative_to(ROOT)}")
