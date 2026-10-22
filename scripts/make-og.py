#!/usr/bin/env python3
"""Create the English 1200×630 social preview in the Atelier DV visual style."""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
WIDTH, HEIGHT = 1200, 630
BLUE_TOP = (31, 78, 156)
BLUE_BOTTOM = (20, 58, 117)
AMBER = (242, 169, 0)
WHITE = (255, 255, 255)
PALE = (220, 231, 250)


def font(size, bold=False):
    filename = "segoeuib.ttf" if bold else "segoeui.ttf"
    path = Path("C:/Windows/Fonts") / filename
    if path.exists():
        return ImageFont.truetype(str(path), size)
    return ImageFont.truetype("arialbd.ttf" if bold else "arial.ttf", size)


def make_image():
    image = Image.new("RGB", (WIDTH, HEIGHT))
    pixels = image.load()
    for y in range(HEIGHT):
        for x in range(WIDTH):
            ratio = (x / WIDTH + y / HEIGHT) / 2
            pixels[x, y] = tuple(
                round(start + (end - start) * ratio)
                for start, end in zip(BLUE_TOP, BLUE_BOTTOM)
            )

    draw = ImageDraw.Draw(image)
    tile = (90, 150, 340, 400)
    draw.rounded_rectangle(tile, radius=44, fill=(25, 67, 137))
    draw.ellipse((141, 201, 289, 349), outline=WHITE, width=10)
    draw.polygon(
        [(215, 216), (250, 274), (215, 334), (181, 274)],
        fill=AMBER,
    )
    draw.ellipse((204, 263, 226, 285), fill=WHITE)

    draw.text((385, 158), "Atelier DV", font=font(96, bold=True), fill=WHITE)
    draw.text(
        (385, 275),
        "Prepare your DV Lottery entry with confidence",
        font=font(36),
        fill=PALE,
    )
    draw.text(
        (385, 352),
        "Photo · Passport · Spouse & children · Checklist",
        font=font(29),
        fill=AMBER,
    )
    draw.text((90, 556), "Free tool · By Remy A.", font=font(27), fill=PALE)
    return image


if __name__ == "__main__":
    make_image().save(ROOT / "og-image-en.png", format="PNG", optimize=True)
