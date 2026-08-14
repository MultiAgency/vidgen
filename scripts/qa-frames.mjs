#!/usr/bin/env node
// Visual QA: reserved-band cleanliness. Samples frames across a composition
// (rendered WITHOUT captions via REMOTION_QA_HIDE_CAPTIONS) and asserts that
// scene props stay out of reserved bands: the caption band and the rail band.
// v1 samples a 2.5s grid (beat-precise sampling arrives with the scene
// schema, where beat times become data). Every historical collision in this
// kit persisted for 2–8s, so grid sampling catches the class.
// Run: npm run qa:frames -- <slug> [...]     (renders stills — slow-ish)
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const STEP = 2.5;
const FPS = 30;
// Coverage note (honest): ink-based bands detect FOREIGN structures in
// reserved space — the card-in-caption-band and edge-tag classes (2 of the
// 5 historical collisions). Collisions BETWEEN legitimate elements
// (subtitle×chips, card×caption mid-frame, chips×panel) are undetectable by
// pixel presence — both parties are allowed ink — and are the scene
// schema's interval×rect checker's job (T1).
// startT: the rail band only applies after the title act (the centered
// title legitimately spans the band until ~9s; the longest first sentence
// ends by 10).
const BANDS = [
  // Stills render with REMOTION_QA_HIDE_CAPTIONS, so the entire caption band
  // has NO legitimate occupant except the mascot column (x<1140) — any other
  // ink is a prop intrusion. This catches the historical card-in-band class.
  { name: "caption-band", y0: 928, y1: 1080, exemptX: [0, 1140] },
  // exempt through the hero panel's chrome right edge under maximum camera
  // zoom (measured 1790 static; ×1.07 about the 38% origin ≈ 1840). The
  // historical edge-tag class extended past 1845 and stays detectable.
  // exempt spans the hero panel's full extent under max camera zoom
  // (left sidebar edge ≈305, chrome right ≈1840).
  { name: "rail", y0: 106, y1: 160, exemptX: [298, 1845], startT: 10.5 },
];
// Ink = pixels meaningfully brighter than the dark stage background.
const PY = `
import sys, json
from PIL import Image
img = Image.open(sys.argv[1]).convert("L")
report = {}
for name, y0, y1, x0, x1 in json.loads(sys.argv[2]):
    band = img.crop((0, y0, img.width, y1))
    px = band.load()
    ink = 0
    for y in range(band.height):
        for x in range(0, band.width, 2):
            if x0 is not None and x0 <= x <= x1:
                continue
            if px[x, y] > 72:
                ink += 1
    report[name] = ink
print(json.dumps(report))
`;

const slugs = process.argv.slice(2).filter((a) => !a.startsWith("-"));
if (slugs.length === 0) {
  console.error("usage: npm run qa:frames -- <slug> [...]");
  process.exit(1);
}

let failed = 0;
for (const slug of slugs) {
  const mp3 = join(ROOT, "public", "audio", `${slug}.mp3`);
  const voice = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp3]).toString());
  const end = 0.8 + voice; // sample through the voiced film, not the outro card
  const tmp = mkdtempSync(join(tmpdir(), "qaf-"));
  const violations = [];
  for (let t = 1.5; t < end; t += STEP) {
    const frame = Math.round(t * FPS);
    const png = join(tmp, `${frame}.png`);
    execFileSync("npx", ["remotion", "still", slug, `--frame=${frame}`, png], { cwd: ROOT, stdio: ["ignore", "ignore", "pipe"], env: { ...process.env, REMOTION_QA_HIDE_CAPTIONS: "1" } });
    const active = BANDS.filter((b) => t >= (b.startT ?? 0));
    const spec = JSON.stringify(active.map((b) => [b.name, b.y0, b.y1, b.exemptX?.[0] ?? null, b.exemptX?.[1] ?? null]));
    const res = JSON.parse(spawnSync("python3", ["-c", PY, png, spec]).stdout.toString());
    for (const [band, ink] of Object.entries(res)) {
      // 300: real intrusions measured 329-3558; entrance-spring overshoot
      // transients and AA bleed stay under ~250.
      if (ink > 300) violations.push({ t: t.toFixed(1), band, ink });
    }
  }
  rmSync(tmp, { recursive: true, force: true });
  if (violations.length) {
    failed++;
    console.log(`FAIL  ${slug}:`);
    for (const v of violations) console.log(`      ${v.t}s ${v.band} ink=${v.ink}`);
  } else {
    console.log(`ok    ${slug}`);
  }
}
process.exit(failed ? 1 : 0);
