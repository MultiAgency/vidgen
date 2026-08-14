#!/usr/bin/env node
// Mechanical QA gate for finals in out/. Catches the defect classes that
// actually shipped from this kit: dead air at frame 0, loudness/true-peak
// drift, and stale or truncated renders (duration mismatch vs the voiceover).
// Run: npm run qa [-- <slug> ...]   (default: every post with a final in out/)
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const OUT = join(ROOT, "out");
const AUDIO = join(ROOT, "public", "audio");
// Keep in sync with src/timing.ts (values asserted here so drift fails loudly).
const AUDIO_START = 0.8;
const OUTRO = 5.5;
const TARGETS = { lufs: [-15.5, -13.0], truePeakMax: -1.0, durationTol: 0.75 };

const timing = readFileSync(join(ROOT, "src", "timing.ts"), "utf8");
for (const [name, val] of [["AUDIO_START", AUDIO_START], ["OUTRO", OUTRO]]) {
  if (!new RegExp(`${name}\\s*=\\s*${val}`).test(timing)) {
    console.error(`qa: ${name} in src/timing.ts no longer equals ${val} — update scripts/qa.mjs`);
    process.exit(1);
  }
}

const probeDuration = (f) =>
  Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString());

// The bed must outlast every post — 108 shipped with 66s of silent tail
// because a 120s bed sat under a 186s video and nothing checked.
const bedLen = probeDuration(join(ROOT, "public", "audio", "bed.wav"));

const args = process.argv.slice(2).filter((a) => !a.startsWith("-"));
const slugs = args.length
  ? args
  : readdirSync(OUT).filter((f) => /^\d{3}-.*\.mp4$/.test(f)).map((f) => f.replace(/\.mp4$/, ""));

let failed = 0;
const rows = [];
for (const slug of slugs) {
  const file = join(OUT, `${slug}.mp4`);
  const mp3 = join(AUDIO, `${slug}.mp3`);
  const problems = [];
  if (!existsSync(file)) {
    rows.push([slug, "MISSING", "", "", "", "no final in out/"]);
    failed++;
    continue;
  }
  const dur = probeDuration(file);
  if (dur > bedLen + 0.5) problems.push(`video ${dur.toFixed(0)}s outlasts the ${bedLen.toFixed(0)}s music bed`);
  let expected = null;
  if (existsSync(mp3)) {
    expected = AUDIO_START + probeDuration(mp3) + OUTRO;
    if (Math.abs(dur - expected) > TARGETS.durationTol) {
      problems.push(`duration ${dur.toFixed(1)}s ≠ expected ${expected.toFixed(1)}s (stale render?)`);
    }
  }
  // ffmpeg reports analysis on stderr.
  const silence = spawnSync("ffmpeg", ["-i", file, "-t", "2", "-af", "silencedetect=n=-50dB:d=0.4", "-f", "null", "-"]).stderr.toString();
  if (/silence_start: 0\b|silence_start: 0\./.test(silence)) problems.push("dead air at frame 0");
  const loud = spawnSync("ffmpeg", ["-i", file, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=summary", "-f", "null", "-"]).stderr.toString();
  const lufs = Number(/Input Integrated:\s*([-+]?[\d.]+)/.exec(loud)?.[1]);
  const tp = Number(/Input True Peak:\s*([-+]?[\d.]+)/.exec(loud)?.[1]);
  if (Number.isNaN(lufs) || Number.isNaN(tp)) problems.push("loudness analysis unparseable");
  if (lufs < TARGETS.lufs[0] || lufs > TARGETS.lufs[1]) problems.push(`loudness ${lufs} LUFS outside [${TARGETS.lufs}]`);
  if (tp > TARGETS.truePeakMax) problems.push(`true peak ${tp} dBTP > ${TARGETS.truePeakMax}`);
  if (problems.length) failed++;
  rows.push([slug, dur.toFixed(1), expected ? expected.toFixed(1) : "—", `${lufs}`, `${tp}`, problems.join("; ") || "ok"]);
}

const widths = [30, 7, 8, 7, 7];
console.log(["slug", "dur", "expect", "LUFS", "dBTP"].map((h, i) => h.padEnd(widths[i])).join("") + "verdict");
for (const r of rows) {
  console.log(r.slice(0, 5).map((c, i) => String(c).padEnd(widths[i])).join("") + r[5]);
}
process.exit(failed ? 1 : 0);
