#!/usr/bin/env python3
"""Normalize generated pose art into rig-ready sprites.

Inputs in art/poses/: a 3x3 pose sheet named sheet*.png (cells in the
generation prompt's order, SHEET_ORDER below) and/or loose <pose>.png files.
Backgrounds may be the solid dark navy the prompt asks for, or already
transparent.

Each pose is background-keyed, scaled against the sheet's calibration cell
(loose files scale by their own character height), centered on the 1024x1536
rig canvas with feet on the original sprite's ground line, then vtracer-traced
to public/poses/<pose>-vec.svg — the files CanvasMascot loads for pose cues.

Run: npm run poses
Non-standing loose poses (sitting, crouching) misjudge their own height —
override with: npm run poses -- --scale doze=0.8
"""

import argparse
import shutil
import subprocess
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter

root = Path(__file__).resolve().parent.parent
ART = root / "art" / "poses"
OUT = root / "public" / "poses"
CANVAS = (1024, 1536)

# Cell order of the 3x3 generation sheet (row-major), matching the prompt.
SHEET_ORDER = [
    "calibration", "quarter-left", "quarter-right",
    "walk", "point", "celebrate",
    "doze", "lean", "back",
]


def bg_dist(img: Image.Image) -> Image.Image:
    """Per-pixel color distance from the background (sampled at the corner)."""
    bg = Image.new("RGB", img.size, img.convert("RGB").getpixel((2, 2)))
    diff = ImageChops.difference(img.convert("RGB"), bg)
    r, g, b = diff.split()
    return ImageChops.lighter(ImageChops.lighter(r, g), b)


def raw_bbox(img: Image.Image):
    """Character bbox without the keying erode — for scale measurement."""
    img = img.convert("RGBA")
    lo, _hi = img.getchannel("A").getextrema()
    if lo >= 128:
        img.putalpha(bg_dist(img).point(lambda v: 255 if v >= 40 else 0))
    return char_bbox(img)


def keyed(img: Image.Image) -> Image.Image:
    """Return the image with its background as alpha. Generations on the solid
    navy the prompt asks for get chroma-keyed against the corner color; images
    that already carry real transparency pass through.

    Key AFTER upscaling to sprite resolution: the erode that keeps partial
    alpha inside the silhouette (vtracer composites partials against white —
    a soft key ramp becomes a white rim) would eat antennae-thin shapes at
    generation-cell resolution."""
    img = img.convert("RGBA")
    lo, _hi = img.getchannel("A").getextrema()
    if lo < 128:
        return img
    mask = bg_dist(img).point(
        lambda v: 0 if v < 34 else 255 if v > 52 else (v - 34) * 14,
    )
    mask = mask.filter(ImageFilter.MinFilter(5))
    mask = mask.filter(ImageFilter.GaussianBlur(0.8))
    out = img.copy()
    out.putalpha(mask)
    return out


def char_bbox(img: Image.Image):
    solid = img.getchannel("A").point(lambda v: 255 if v > 16 else 0)
    box = solid.getbbox()
    if box is None:
        raise SystemExit("no character found after background keying")
    return box


def drop_border_fragments(img: Image.Image) -> Image.Image:
    """Remove keyed components that touch the image border, except the main
    character — neighbor-cell bleed and corner watermarks live at the edges,
    while detached character bits (an antenna tip) sit in the interior and
    are kept."""
    ds = 4
    small = img.getchannel("A").resize((img.width // ds, img.height // ds))
    w, h = small.size
    px = small.load()
    seen = [[False] * w for _ in range(h)]
    comps = []
    for y in range(h):
        for x in range(w):
            if px[x, y] > 16 and not seen[y][x]:
                stack = [(x, y)]
                seen[y][x] = True
                cells, touch = [], False
                while stack:
                    cx, cy = stack.pop()
                    cells.append((cx, cy))
                    touch = touch or cx in (0, w - 1) or cy in (0, h - 1)
                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        nx, ny = cx + dx, cy + dy
                        if 0 <= nx < w and 0 <= ny < h and px[nx, ny] > 16 and not seen[ny][nx]:
                            seen[ny][nx] = True
                            stack.append((nx, ny))
                comps.append((len(cells), touch, cells))
    comps.sort(key=lambda c: -c[0])
    kill = [c for c in comps[1:] if c[1]]
    if not kill:
        return img
    mask = Image.new("L", (w, h), 255)
    put = mask.load()
    for _, _, cells in kill:
        for cx, cy in cells:
            put[cx, cy] = 0
    mask = mask.filter(ImageFilter.MinFilter(3)).resize(img.size, Image.NEAREST)
    out = img.copy()
    out.putalpha(ImageChops.multiply(out.getchannel("A"), mask))
    return out


def normalize(img: Image.Image, scale: float, ground: int) -> Image.Image:
    """Upscale to sprite resolution, key, and place feet-down on the canvas."""
    big = img.resize(
        (max(1, round(img.width * scale)), max(1, round(img.height * scale))),
        Image.LANCZOS,
    )
    big = drop_border_fragments(keyed(big))
    box = char_bbox(big)
    part = big.crop(box)
    canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    canvas.paste(part, ((CANVAS[0] - part.width) // 2, ground - part.height), part)
    return canvas


parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument(
    "--scale", action="append", default=[], metavar="POSE=FACTOR",
    help="extra scale factor for a pose (e.g. doze=0.8)",
)
parser.add_argument(
    "--flip", action="append", default=[], metavar="POSE",
    help="mirror a pose horizontally (ONLY for poses with no visible logo — "
    "the shield's N would read backwards)",
)
args = parser.parse_args()
overrides = dict((kv.split("=")[0], float(kv.split("=")[1])) for kv in args.scale)

# Reference geometry from the original artwork: character height + ground line.
ref = Image.open(root / "public" / "mascot.png").convert("RGBA")
ref_box = char_bbox(ref)
ref_h = ref_box[3] - ref_box[1]
ground = ref_box[3]

poses: dict[str, tuple[Image.Image, float]] = {}  # name -> (keyed image, scale)

for sheet_png in sorted(ART.glob("sheet*.png")):
    sheet = Image.open(sheet_png)
    cw, ch = sheet.width // 3, sheet.height // 3
    cells = {
        SHEET_ORDER[r * 3 + c]: sheet.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch))
        for r in range(3) for c in range(3)
    }
    # One scale for the whole sheet, from the calibration cell — per-cell
    # rescaling would destroy the relative proportions the sheet guarantees.
    calib = raw_bbox(cells["calibration"])
    scale = ref_h / (calib[3] - calib[1])
    print(f"{sheet_png.name}: cell {cw}x{ch}, sheet scale {scale:.3f}")
    for name, cell in cells.items():
        poses[name] = (cell, scale)

for png in sorted(ART.glob("*.png")):
    if png.name.startswith("sheet"):
        continue
    name = png.stem
    img = Image.open(png)
    box = raw_bbox(img)
    scale = ref_h / (box[3] - box[1])
    print(f"{png.name}: standalone, scaled by its own height ({scale:.3f}) — "
          f"use --scale {name}=… if the pose isn't standing")
    poses[name] = (img, scale)

if not poses:
    raise SystemExit(f"nothing to do — put sheet*.png or <pose>.png files in {ART}")

vtracer = shutil.which("vtracer") or str(Path.home() / ".cargo" / "bin" / "vtracer")
if not Path(vtracer).exists():
    raise SystemExit("vtracer not found — install with: cargo install vtracer")

OUT.mkdir(parents=True, exist_ok=True)
norm_dir = ART / "normalized"
norm_dir.mkdir(exist_ok=True)
for name, (img, scale) in sorted(poses.items()):
    if name in args.flip:
        img = img.transpose(Image.FLIP_LEFT_RIGHT)
    canvas = normalize(img, scale * overrides.get(name, 1.0), ground)
    norm_png = norm_dir / f"{name}.png"
    canvas.save(norm_png, optimize=True)
    svg = OUT / f"{name}-vec.svg"
    subprocess.run(
        # Finer quantization than the parts pipeline: upscaled soft gradients
        # band at coarse steps, and AA seams between quantized layers read as
        # hairlines unless adjacent layers are near-identical in color.
        [vtracer, "--input", str(norm_png), "--output", str(svg),
         "--colormode", "color", "--hierarchical", "stacked", "--mode", "spline",
         "--filter_speckle", "8", "--color_precision", "8", "--gradient_step", "4"],
        check=True, capture_output=True,
    )
    svg.write_text(
        svg.read_text().replace('width="1024" height="1536"', 'viewBox="0 0 1024 1536"'),
    )
    box = char_bbox(canvas)
    print(f"traced public/poses/{svg.name}  (feet at y={box[3]}, height {box[3] - box[1]})")

print(f"\nReference: feet at y={ground}, height {ref_h}. Use in scenes via "
      'cues: { kind: "pose", pose: "<name>", at: … }')
