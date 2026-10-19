"""
카카오톡·링크 미리보기 이미지 (assets/illust/og.jpg, 1200×630)

  python tools/make-og.py

names(손글씨) + running(달리는 신랑신부)을 흰 바탕에 올린다. 두 그림을 다시 만들면 이것도 다시 실행하고
developers.kakao.com/tool/clear/og 에서 캐시를 지운다.
"""
from pathlib import Path
from PIL import Image

d = Path(__file__).resolve().parent.parent / "assets" / "illust"


def place(canvas, name, width, xy):
    im = Image.open(d / f"{name}.png").convert("RGBA")
    im = im.convert("RGBa").resize((width, round(im.height * width / im.width)), Image.LANCZOS).convert("RGBA")
    canvas.alpha_composite(im, xy)


og = Image.new("RGBA", (1200, 630), (255, 255, 255, 255))
place(og, "running", 700, (258, 228))
place(og, "names", 610, (330, 36))
og.convert("RGB").save(d / "og.jpg", quality=90, optimize=True, progressive=True)
print("og.jpg", og.size)
