#!/usr/bin/env python3
"""30-second accept/reject for a Veo generation, before spending intake time:
contact sheet of 8 frames + one chroma-key composite over the kit gradient.
Judge: face + shield-N stable, background flat, facing direction correct.

Run: npm run clip-check -- <file.mp4>   → art/clips/review/<name>-check.png
"""
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw

src = Path(sys.argv[1])
root = Path(__file__).resolve().parent.parent
out = root / "art" / "clips" / "review"
out.mkdir(parents=True, exist_ok=True)

dur = float(subprocess.run(
    ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(src)],
    capture_output=True, text=True).stdout)

frames = []
with tempfile.TemporaryDirectory() as td:
    for i in range(8):
        t = dur * (i + 0.5) / 8
        f = Path(td) / f"{i}.png"
        subprocess.run(["ffmpeg", "-y", "-ss", f"{t:.2f}", "-i", str(src),
                        "-frames:v", "1", str(f)], capture_output=True)
        frames.append((t, Image.open(f).convert("RGB")))

w = frames[0][1].width // 4
h = frames[0][1].height * w // frames[0][1].width
sheet = Image.new("RGB", (w * 4, h * 2 + h * 2), (10, 14, 26))
d = ImageDraw.Draw(sheet)
for i, (t, img) in enumerate(frames):
    cell = img.resize((w, h))
    sheet.paste(cell, (w * (i % 4), h * (i // 4)))
    d.text((w * (i % 4) + 8, h * (i // 4) + 6), f"{t:.1f}s", fill=(255, 255, 255))

# key composite of the middle frame over a kit-like gradient
mid = frames[4][1]
bg_color = mid.getpixel((5, 5))
from PIL import ImageChops
bg = Image.new("RGB", mid.size, bg_color)
diff = ImageChops.difference(mid, bg)
r, g, b = diff.split()
dist = ImageChops.lighter(ImageChops.lighter(r, g), b)
mask = dist.point(lambda v: 255 if v >= 30 else 0)
grad = Image.new("RGB", mid.size, 0)
gd = ImageDraw.Draw(grad)
for y in range(0, mid.height, 4):
    v = int(8 + 22 * y / mid.height)
    gd.rectangle([0, y, mid.width, y + 4], fill=(v, v + 6, v + 20))
grad.paste(mid, (0, 0), mask)
comp = grad.resize((w * 2, h * 2))
sheet.paste(comp, (0, h * 2))
d.text((w * 2 + 20, h * 2 + 20),
       f"{src.name}  {dur:.1f}s\nkey preview at {frames[4][0]:.1f}s\ncorner color {bg_color}",
       fill=(226, 232, 240))

dest = out / f"{src.stem}-check.png"
sheet.save(dest)
print(f"wrote {dest.relative_to(root)}")
