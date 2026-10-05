"""Generate the "استاذ حلمي القمص يعقوب" logo: a simplified Coptic Yota cross
(صليب اليوطا) badge centred above a two-tier Arabic wordmark, as layered PSD files + PNG
previews in three variants: palette, mono, dark.

Requires: pip install skia-python uharfbuzz psd-tools pillow numpy
"""
import os
import time

import numpy as np
import skia
import uharfbuzz as hb
from PIL import Image
from psd_tools import PSDImage
from psd_tools.api.layers import PixelLayer

HERE = os.path.dirname(os.path.abspath(__file__))
# IBM Plex Sans Arabic (Google Fonts, OFL)
FONT_BOLD = os.path.join(HERE, "fonts", "IBMPlexSansArabic-Bold.ttf")
TITLE = "استاذ"
NAME = "حلمي القمص يعقوب"

MARGIN = 220
BADGE = 640
GAP = 120                        # space between badge and title
NAME_SIZE = 210
TITLE_SIZE = 130
LINE_GAP = 40                    # vertical space between title and name

# Palette: https://colorhunt.co/palette/31aaa9f8e0a4a820206c1a1a
TEAL, CREAM, RED, MAROON = "#31AAA9", "#F8E0A4", "#A82020", "#6C1A1A"

VARIANTS = {
    "palette": dict(
        bg=CREAM,
        badge=MAROON,
        cross=CREAM,
        accent=TEAL,                   # teal inner crosses
        title=RED,
        text=MAROON,
    ),
    "mono": dict(
        bg="#FFFFFF",
        badge="#000000",
        cross="#FFFFFF",
        accent=None,                   # inner crosses knocked out to the badge
        title="#000000",
        text="#000000",
    ),
    "dark": dict(
        bg=MAROON,
        badge=RED,
        cross=CREAM,
        accent=None,
        title=TEAL,
        text=CREAM,
        badge_stroke=CREAM,
    ),
}


def color(hexstr, alpha=255):
    h = hexstr.lstrip("#")
    return skia.Color(int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), alpha)


def text_path(text, size, font_file):
    blob = hb.Blob.from_file_path(font_file)
    face = hb.Face(blob)
    font = hb.Font(face)
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(font, buf, {})
    sk_font = skia.Font(skia.Typeface.MakeFromFile(font_file), size)
    scale = size / face.upem
    path, x = skia.Path(), 0.0
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        gp = sk_font.getPath(info.codepoint)
        if gp:
            gp.offset(x + pos.x_offset * scale, -pos.y_offset * scale)
            path.addPath(gp)
        x += pos.x_advance * scale
    return path


# ---- layout: badge centred on top, title + name centred underneath ---------
_name = text_path(NAME, NAME_SIZE, FONT_BOLD)
_title = text_path(TITLE, TITLE_SIZE, FONT_BOLD)   # same font + weight as the name
_nb, _tb = _name.computeTightBounds(), _title.computeTightBounds()
W = int(max(_nb.width(), BADGE) + 2 * MARGIN)
_block_h = BADGE + GAP + _tb.height() + LINE_GAP + _nb.height()
H = int(_block_h + 2 * MARGIN)
BADGE_X = (W - BADGE) // 2
BADGE_Y = MARGIN
_title.offset(W / 2 - (_tb.left() + _tb.right()) / 2, BADGE_Y + BADGE + GAP - _tb.top())
_name.offset(W / 2 - (_nb.left() + _nb.right()) / 2,
             BADGE_Y + BADGE + GAP + _tb.height() + LINE_GAP - _nb.top())


def new_layer():
    surf = skia.Surface(W, H)
    surf.getCanvas().clear(skia.ColorTRANSPARENT)
    return surf


def to_pil(surf):
    arr = surf.makeImageSnapshot().toarray(colorType=skia.kRGBA_8888_ColorType,
                                           alphaType=skia.kUnpremul_AlphaType)
    return Image.fromarray(np.ascontiguousarray(arr), "RGBA")


def draw_background(v):
    s = new_layer()
    s.getCanvas().clear(color(v["bg"]))
    return s


def draw_badge(v):
    s = new_layer()
    c = s.getCanvas()
    rect = skia.Rect.MakeXYWH(BADGE_X, BADGE_Y, BADGE, BADGE)
    radius = BADGE * 0.24
    c.drawRRect(skia.RRect.MakeRectXY(rect, radius, radius),
                skia.Paint(AntiAlias=True, Color=color(v["badge"])))
    if v.get("badge_stroke"):
        inset = 26
        r2 = skia.Rect.MakeXYWH(BADGE_X + inset, BADGE_Y + inset, BADGE - 2 * inset, BADGE - 2 * inset)
        c.drawRRect(skia.RRect.MakeRectXY(r2, radius - inset, radius - inset),
                    skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style,
                               StrokeWidth=4, Color=color(v["badge_stroke"], 150)))
    return s


def stepped_diamond(cx, cy, n, u):
    """Staircase diamond: union of (2(n-k)+1) x (2k+1) unit rects, k = 0..n."""
    rects = []
    for k in range(n + 1):
        hw, hh = (n - k + 0.5) * u, (k + 0.5) * u
        rects.append(skia.Rect.MakeLTRB(cx - hw, cy - hh, cx + hw, cy + hh))
    return rects


def greek_cross(cx, cy, arm, bar):
    return [skia.Rect.MakeLTRB(cx - bar / 2, cy - arm, cx + bar / 2, cy + arm),
            skia.Rect.MakeLTRB(cx - arm, cy - bar / 2, cx + arm, cy + bar / 2)]


def draw_cross(v):
    """Simplified Coptic Yota cross: four stepped-diamond lobes joined by a
    central cross and hub, each lobe and the hub carrying a small Greek cross."""
    s = new_layer()
    c = s.getCanvas()
    cx, cy = BADGE_X + BADGE / 2, BADGE_Y + BADGE / 2
    u = round(BADGE * 0.74 / 22 / 2) * 2   # grid unit, even px so half-units stay on pixels
    D = 6.5 * u                     # lobe centre distance from the middle
    lobes = [(cx, cy - D), (cx + D, cy), (cx, cy + D), (cx - D, cy)]

    def union(rects):
        """Merge rects into one path so overlapping edges don't leave AA seams."""
        out = skia.Path()
        for r in rects:
            out = skia.Op(out, skia.Path.Rect(r), skia.PathOp.kUnion_PathOp)
        return out

    body = greek_cross(cx, cy, D, 3 * u)            # connecting arms (narrow -> deep notches)
    for lx, ly in lobes:
        body += stepped_diamond(lx, ly, 4, u)
    c.drawPath(union(body), skia.Paint(AntiAlias=True, Color=color(v["cross"])))

    # inner Greek crosses: knocked out, then optionally filled with the accent
    inner = []
    for (px, py), arm in [(p, 2.5 * u) for p in lobes] + [((cx, cy), 1.5 * u)]:
        inner += greek_cross(px, py, arm, 1.0 * u)
    inner = union(inner)
    c.drawPath(inner, skia.Paint(AntiAlias=True, BlendMode=skia.BlendMode.kClear))
    if v["accent"]:
        c.drawPath(inner, skia.Paint(AntiAlias=True, Color=color(v["accent"])))
    return s


def draw_title(v):
    s = new_layer()
    s.getCanvas().drawPath(_title, skia.Paint(AntiAlias=True, Color=color(v["title"])))
    return s


def draw_name(v):
    s = new_layer()
    s.getCanvas().drawPath(_name, skia.Paint(AntiAlias=True, Color=color(v["text"])))
    return s


def build(name, v):
    layers = [
        ("Background", draw_background(v)),
        ("Badge", draw_badge(v)),
        ("Yota Cross", draw_cross(v)),
        ("Title (Ostaz)", draw_title(v)),
        ("Name (Helmi El-Kommos Yacoub)", draw_name(v)),
    ]
    psd = PSDImage.new("RGBA", (W, H))
    composite = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    for lname, surf in layers:
        img = to_pil(surf)
        composite = Image.alpha_composite(composite, img)
        bbox = img.getbbox() if lname != "Background" else (0, 0, W, H)
        psd.append(PixelLayer.frompil(img.crop(bbox), psd, lname, top=bbox[1], left=bbox[0]))
    psd.save(os.path.join(HERE, f"ostaz-helmi-logo-{name}.psd"))
    composite.save(os.path.join(HERE, f"ostaz-helmi-logo-{name}.png"))
    return composite


def main():
    previews = [build(n, v) for n, v in VARIANTS.items()]
    sheet = Image.new("RGBA", (W * len(previews), H))
    for i, im in enumerate(previews):
        sheet.paste(im, (i * W, 0))
    small = sheet.convert("RGB").resize((W * len(previews) // 3, H // 3), Image.LANCZOS)
    for attempt in range(5):        # the file may be briefly locked by an open viewer
        try:
            small.save(os.path.join(HERE, "preview-all.png"))
            break
        except OSError:
            if attempt == 4:
                raise
            time.sleep(1)
    print("done", W, H)


if __name__ == "__main__":
    main()
