from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import math

SCALE = 4
CELL = 512
FRAMES = 8
OUT = Path('assets/art/game-scene/tools/moon/pour-sheet.png')


def sc(v: float) -> int:
    return int(round(v * SCALE))


def smoothstep(t: float) -> float:
    t = max(0.0, min(1.0, t))
    return t * t * (3.0 - 2.0 * t)


def bezier(p0, p1, p2, p3, steps=80):
    pts = []
    for i in range(steps + 1):
        t = i / steps
        u = 1.0 - t
        x = u**3*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t**3*p3[0]
        y = u**3*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t**3*p3[1]
        pts.append((sc(x), sc(y)))
    return pts


def ellipse_mask(size, box, blur=0):
    mask = Image.new('L', size, 0)
    d = ImageDraw.Draw(mask)
    d.ellipse(tuple(sc(v) for v in box), fill=255)
    if blur:
        mask = mask.filter(ImageFilter.GaussianBlur(sc(blur)))
    return mask


def make_master() -> Image.Image:
    size = (sc(CELL), sc(CELL))
    img = Image.new('RGBA', size, (0, 0, 0, 0))

    handle_pts = bezier((309, 246), (347, 196), (387, 152), (430, 132))
    d = ImageDraw.Draw(img)
    d.line(handle_pts, fill=(3, 7, 22, 255), width=sc(38), joint='curve')
    d.line(handle_pts, fill=(7, 13, 39, 255), width=sc(31), joint='curve')
    hi_pts = bezier((307, 240), (347, 189), (385, 151), (426, 135))
    d.line(hi_pts, fill=(76, 96, 150, 235), width=sc(7), joint='curve')
    d.line(hi_pts, fill=(167, 184, 226, 150), width=sc(2.2), joint='curve')
    d.ellipse((sc(412), sc(119), sc(446), sc(146)), fill=(3, 7, 23, 255))
    d.arc((sc(412), sc(119), sc(446), sc(146)), 205, 345, fill=(110, 132, 187, 220), width=sc(2))

    body_box = (112, 218, 325, 369)
    body_mask = ellipse_mask(size, body_box)
    trim = Image.new('L', size, 0)
    td = ImageDraw.Draw(trim)
    td.rectangle((0, sc(257), size[0], size[1]), fill=255)
    td.ellipse((sc(112), sc(205), sc(325), sc(332)), fill=255)
    body_mask = Image.composite(body_mask, Image.new('L', size, 0), trim)

    grad = Image.new('RGBA', size, (0, 0, 0, 0))
    gp = grad.load()
    for y in range(sc(205), sc(380)):
        fy = y / SCALE
        for x in range(sc(100), sc(338)):
            fx = x / SCALE
            dx = (fx - 205) / 125
            dy = (fy - 292) / 90
            r = math.sqrt(dx*dx + dy*dy)
            edge = smoothstep(1.0 - r)
            upper = smoothstep((350 - fy) / 145)
            moon = math.exp(-(((fx - 148)/52)**2 + ((fy - 252)/42)**2))
            rim_reflect = math.exp(-(((fx - 254)/84)**2 + ((fy - 274)/66)**2))
            b = int(15 + 25*upper + 36*moon + 12*rim_reflect)
            g = int(8 + 13*upper + 19*moon + 7*rim_reflect)
            rr = int(3 + 5*upper + 8*moon)
            a = int(255 * min(1.0, max(0.0, edge*2.4)))
            gp[x, y] = (rr, g, b, a)
    img.alpha_composite(Image.composite(grad, Image.new('RGBA', size), body_mask))

    d = ImageDraw.Draw(img)
    d.arc(tuple(sc(v) for v in body_box), 0, 360, fill=(2, 4, 15, 255), width=sc(5))
    d.arc((sc(123), sc(232), sc(315), sc(363)), 16, 170, fill=(44, 61, 108, 210), width=sc(3))
    d.arc((sc(134), sc(258), sc(304), sc(363)), 20, 155, fill=(20, 31, 71, 180), width=sc(2))

    opening_box = (117, 205, 320, 295)
    inner = Image.new('RGBA', size, (0, 0, 0, 0))
    ip = inner.load()
    mask = ellipse_mask(size, opening_box)
    ma = mask.load()
    for y in range(sc(197), sc(304)):
        fy = y / SCALE
        for x in range(sc(108), sc(330)):
            if ma[x, y] == 0:
                continue
            fx = x / SCALE
            moon = math.exp(-(((fx - 145)/56)**2 + ((fy - 223)/27)**2))
            depth = smoothstep((fy - 204)/82)
            ip[x, y] = (1 + int(4*moon), 3 + int(9*moon), 12 + int(26*moon) - int(5*depth), 255)
    img.alpha_composite(inner)
    d = ImageDraw.Draw(img)
    d.ellipse(tuple(sc(v) for v in opening_box), outline=(3, 5, 17, 255), width=sc(9))
    d.arc(tuple(sc(v) for v in opening_box), 180, 356, fill=(182, 195, 229, 245), width=sc(5))
    d.arc((sc(123), sc(212), sc(314), sc(287)), 184, 354, fill=(76, 94, 145, 220), width=sc(2))
    d.arc(tuple(sc(v) for v in opening_box), 8, 172, fill=(17, 25, 59, 245), width=sc(5))
    d.arc((sc(130), sc(235), sc(287), sc(348)), 115, 185, fill=(98, 118, 174, 150), width=sc(2))
    d.arc((sc(143), sc(240), sc(272), sc(328)), 126, 176, fill=(191, 203, 236, 95), width=sc(1))
    return img


def transform_frame(master: Image.Image, angle: float, dx: float, dy: float) -> Image.Image:
    pivot = (sc(302), sc(247))
    layer = Image.new('RGBA', master.size, (0, 0, 0, 0))
    layer.alpha_composite(master)
    rotated = layer.rotate(-angle, resample=Image.Resampling.BICUBIC, center=pivot, expand=False, fillcolor=(0, 0, 0, 0))
    out = Image.new('RGBA', master.size, (0, 0, 0, 0))
    out.alpha_composite(rotated, (sc(dx), sc(dy)))
    return out


def main() -> None:
    poses = [
        (0.0, 0.0, 0.0),
        (-1.2, 0.0, -1.5),
        (-4.5, 1.0, -8.0),
        (-10.5, 4.0, -24.0),
        (11.0, 5.0, -13.0),
        (34.0, 14.0, -2.0),
        (5.0, 3.0, -4.0),
        (-8.0, -2.0, 15.0),
    ]
    master = make_master()
    sheet_hi = Image.new('RGBA', (sc(CELL * FRAMES), sc(CELL)), (0, 0, 0, 0))
    for i, (angle, dx, dy) in enumerate(poses):
        frame = transform_frame(master, angle, dx, dy)
        sheet_hi.alpha_composite(frame, (sc(i * CELL), 0))

    sheet = sheet_hi.resize((CELL * FRAMES, CELL), Image.Resampling.LANCZOS)
    px = sheet.load()
    for y in range(sheet.height):
        for x in range(sheet.width):
            r, g, b, a = px[x, y]
            if a == 0:
                px[x, y] = (0, 0, 0, 0)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(OUT, format='PNG', compress_level=9, optimize=False)
    print(f'generated {OUT} {sheet.size} {sheet.mode}')


if __name__ == '__main__':
    main()
