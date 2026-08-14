#!/usr/bin/env node
// Convert generated mascot animation clips (art/clips/<name>.mp4, solid
// #0f172a background per the generation prompt) into transparent VP9 webm
// the renderer composites directly: chroma-key the navy, despill, trim any
// lead-in, normalize to 30fps. Run: npm run clips [-- --start name=0.4]
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ART = new URL("../art/clips/", import.meta.url).pathname;
const OUT = new URL("../public/clips/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const starts = {};
let keyColor = "0x0f172a";
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--key") keyColor = argv[++i];
  const m = argv[i].match(/^([\w-]+)=([\d.]+)$/);
  if (m) starts[m[1]] = m[2];
}

// Multi-action takes: art/clips/segments.json maps a source file to named
// time ranges (and an optional crop) — segments are cut to temp files first,
// then keyed like any clip. Example:
//   { "walk-talk.mp4": { "crop": "920:720:180:0",
//       "segments": { "walk": [0.4, 4.2], "talk": [4.6, 10.0] } } }
const segPath = join(ART, "segments.json");
const manifest = existsSync(segPath) ? JSON.parse(readFileSync(segPath)) : {};
for (const [src, spec] of Object.entries(manifest)) {
  if (!existsSync(join(ART, src))) continue;
  for (const [name, [t0, t1]] of Object.entries(spec.segments)) {
    const cut = join(ART, `${name}.mp4`);
    const vf = spec.crop ? ["-vf", `crop=${spec.crop}`] : [];
    execFileSync("ffmpeg", ["-y", "-ss", String(t0), "-t", String(t1 - t0),
      "-i", join(ART, src), ...vf, "-c:v", "libx264", "-crf", "16", "-an", cut],
      { stdio: ["ignore", "ignore", "pipe"] });
    console.log(`cut ${src} → ${name}.mp4 [${t0}–${t1}]`);
  }
}

const sources = new Set(Object.keys(manifest));
const clips = existsSync(ART)
  ? readdirSync(ART).filter((f) => /\.(mp4|mov|webm)$/i.test(f) && !sources.has(f))
  : [];
if (clips.length === 0) {
  console.error(`nothing to do — put generated clips in ${ART}`);
  process.exit(1);
}

for (const file of clips) {
  const name = file.replace(/\.[^.]+$/, "");
  const out = join(OUT, `${name}.webm`);
  const args = ["-y"];
  if (starts[name]) args.push("-ss", starts[name]);
  args.push(
    "-i", join(ART, file),
    // Key the prompt's background; tolerance wide enough for encoder drift.
    // NO despill — the character itself is blue, and despill turns him
    // violet. Edge fringe is navy-on-navy at composite time: invisible.
    "-vf",
    `colorkey=${keyColor}:0.12:0.08,fps=30`,
    "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "28",
    "-an", out,
  );
  execFileSync("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
  const probe = execFileSync("ffprobe", [
    "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out,
  ]).toString().trim();
  console.log(`wrote public/clips/${name}.webm (${Number(probe).toFixed(2)}s)`);
  // Ping-pong variant: forward+reverse concat = a seamless loop from any clip,
  // so a 2s idle can hold a window of any length via ClipMascot's loop prop.
  const loopOut = join(OUT, `${name}-loop.webm`);
  execFileSync("ffmpeg", [
    "-y", "-c:v", "libvpx-vp9", "-i", out,
    "-filter_complex", "[0:v]split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1[out]",
    "-map", "[out]", "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "28",
    "-an", loopOut,
  ], { stdio: ["ignore", "ignore", "pipe"] });
  console.log(`wrote public/clips/${name}-loop.webm (ping-pong)`);
}
console.log('\nUse in scenes: <ClipMascot name="…" at={…} …/> paired with a {kind:"hide"} cue.');
