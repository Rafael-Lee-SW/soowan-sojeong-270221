"""
푸터 리본 글씨가 리본 출렁임을 따라가도록 곡선을 맞춘다

  python tools/ribbon-path.py

assets/illust/ribbon.png 의 가운데 띠에서 열마다 위·아래 윤곽선을 찾아 중심선을 구하고,
그 곡선을 index.html 의 <path id="ribbonPath" d="..."> 에 써 넣는다 (SVG 좌표 = 리본 그림 px).
글씨는 <textPath> 로 이 곡선 위에 놓인다. 리본 그림을 바꾸면 이것만 다시 실행하면 된다.
"""
import re
from pathlib import Path
from PIL import Image
import numpy as np

root = Path(__file__).resolve().parent.parent
im = np.asarray(Image.open(root / "assets" / "illust" / "ribbon.png").convert("RGBA")).astype(float)
a, lum = im[..., 3] / 255, im[..., :3].mean(-1)
dark = (a > 0.5) & (lum < 110)
H, W = a.shape


def runs(col):
    ys = np.where(col)[0]
    if not len(ys): return []
    cut = np.where(np.diff(ys) > 1)[0]
    return [(s, e) for s, e in zip(np.r_[ys[0], ys[cut + 1]], np.r_[ys[cut], ys[-1]])]


# 가운데 띠 = 윤곽선이 위·아래 딱 두 줄인 열 (양 끝 접힌 부분은 줄이 3~4개)
xs, top, bot = [], [], []
for x in range(W):
    r = runs(dark[:, x])
    if len(r) == 2 and 25 < r[1][0] - r[0][1] < H * 0.6:
        xs.append(x); top.append(r[0][1]); bot.append(r[1][0])
xs, top, bot = map(np.array, (xs, top, bot))
# 가장 긴 연속 구간만 (띠 밖 잡음 제외)
cut = np.where(np.diff(xs) > 3)[0]
seg = np.split(np.arange(len(xs)), cut + 1)
k = max(seg, key=len)
xs, top, bot = xs[k], top[k], bot[k]
mid, band = (top + bot) / 2, float(np.median(bot - top))

# 중심선을 매끈한 곡선으로 (4차) → 글자 기준선은 중심에서 글자 높이의 1/3 만큼 아래
FONT = round(band * 0.7)
coef = np.polyfit(xs, mid, 4)
x0, x1 = xs[0] + 4, xs[-1] - 4
pts = [(x, np.polyval(coef, x) + FONT * 0.33) for x in np.linspace(x0, x1, 9)]
d = f"M{pts[0][0]:.1f},{pts[0][1]:.1f}"
for p0, p1, p2, p3 in zip([pts[0]] + pts[:-2], pts[:-1], pts[1:], pts[2:] + [pts[-1]]):   # Catmull-Rom → 3차 베지어
    c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
    c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
    d += f" C{c1[0]:.1f},{c1[1]:.1f} {c2[0]:.1f},{c2[1]:.1f} {p2[0]:.1f},{p2[1]:.1f}"

html = root / "index.html"
s = html.read_text(encoding="utf-8")
s, n = re.subn(r'(<path id="ribbonPath" d=")[^"]*(")', rf"\g<1>{d}\g<2>", s)
s = re.sub(r'(class="footer__ribbon-text" viewBox=")[^"]*(")', rf"\g<1>0 0 {W} {H}\g<2>", s)
s = re.sub(r'(<text class="footer__ribbon-word" font-size=")[^"]*(")', rf"\g<1>{FONT}\g<2>", s)
html.write_text(s, encoding="utf-8")
print(f"ribbon {W}x{H}, band x {xs[0]}~{xs[-1]}, height {band:.0f}px, font {FONT}px, path updated: {n}")
print(d)
