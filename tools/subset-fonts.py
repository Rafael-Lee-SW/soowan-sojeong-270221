"""
font/ 에 받아둔 TTF 를 웹용 woff2 로 줄여 assets/fonts/ 에 넣는다 (글꼴 비교용).

  python tools/subset-fonts.py

포함 글자: KS X 1001 한글 2350자 + 페이지(index.html, js/config.js, js/photos.js)에 실제 쓰인 글자
          + ASCII·라틴 보충·문장부호·화살표·기호·한글 자모.
원본 TTF(8~22MB)는 git 에 올리지 않고(.gitignore font/), 결과 woff2 만 올린다.
"""
import pathlib, shutil, subprocess, sys, tempfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC = ROOT / "font"
OUT = ROOT / "assets" / "fonts"
OUT.mkdir(parents=True, exist_ok=True)

JOBS = [
    ("KOPUBWORLD_TTF_FONTS2026/KoPubWorld Batang Medium.ttf", "KoPubWorldBatang-500.woff2"),
    ("KOPUBWORLD_TTF_FONTS2026/KoPubWorld Batang Bold.ttf",   "KoPubWorldBatang-700.woff2"),
    ("KOPUBWORLD_TTF_FONTS2026/KoPubWorld Dotum Light.ttf",   "KoPubWorldDotum-300.woff2"),
    ("KOPUBWORLD_TTF_FONTS2026/KoPubWorld Dotum Medium.ttf",  "KoPubWorldDotum-500.woff2"),
]
COPY = []   # (서브셋 없이 그대로 복사할 것 — 지금은 없음)
UNICODES = "U+0020-007E,U+00A0-00FF,U+2000-206F,U+20A9,U+2190-21FF,U+2600-27BF,U+3000-303F,U+3131-318E,U+FF01-FF60"

def ksx1001():
    out = []
    for c in range(0xAC00, 0xD7A4):
        try:
            chr(c).encode("euc-kr"); out.append(chr(c))
        except UnicodeEncodeError:
            pass
    return "".join(out)

def main():
    text = ksx1001()
    for f in ("index.html", "js/config.js", "js/photos.js"):
        p = ROOT / f
        if p.exists():
            text += p.read_text(encoding="utf-8")
    with tempfile.TemporaryDirectory() as td:
        tf = pathlib.Path(td) / "chars.txt"
        tf.write_text(text, encoding="utf-8")
        for src, dst in JOBS:
            s, d = SRC / src, OUT / dst
            if not s.exists():
                print("없음:", s); continue
            cmd = [sys.executable, "-m", "fontTools.subset", str(s), f"--output-file={d}", "--flavor=woff2",
                   f"--text-file={tf}", f"--unicodes={UNICODES}", "--layout-features=*", "--no-hinting", "--desubroutinize"]
            subprocess.run(cmd, check=True)
            print(f"{dst:30s} {s.stat().st_size/1e6:5.1f}MB → {d.stat().st_size/1e3:6.0f}KB")
    for src, dst in COPY:
        s, d = SRC / src, OUT / dst
        if s.exists():
            shutil.copyfile(s, d); print(f"{dst:30s} 복사 {d.stat().st_size/1e3:6.0f}KB")

if __name__ == "__main__":
    main()
