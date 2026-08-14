#!/usr/bin/env node
// The one render pipeline: render → loudnorm → QA, per slug, sequentially
// (concurrent remotion renders starve each other's delayRender budget).
// Canonical loudnorm parameters live HERE and nowhere else.
// Run: npm run ship -- <slug> [...]  |  npm run ship -- --all
import { execFileSync, execSync, spawnSync } from "node:child_process";
import { readdirSync, renameSync, rmSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
// loudnorm one-pass can overshoot its TP target, alimiter caps SAMPLE peaks
// only (true peak is inter-sample: 106 hit -0.5 dBTP with a -1.5 sample cap),
// and AAC adds up to ~0.5 dB more. Cap samples at -2.5 dBFS (10^(-2.5/20) =
// 0.75) to leave true-peak + encode margin for the -1.0 dBTP QA gate.
const LOUDNORM = "loudnorm=I=-14:TP=-2.0:LRA=11,alimiter=limit=0.75:level=false";

const args = process.argv.slice(2);
const slugs = args.includes("--all")
  ? readdirSync(join(ROOT, "posts")).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""))
  : args.filter((a) => !a.startsWith("-"));
if (slugs.length === 0) {
  console.error("usage: npm run ship -- <slug> [...] | --all");
  process.exit(1);
}

for (const slug of slugs) {
  console.log(`\n=== ${slug}`);
  const raw = join(ROOT, "out", `${slug}.raw.mp4`);
  const final = join(ROOT, "out", `${slug}.mp4`);
  execSync(`npx remotion render ${slug} "${raw}"`, { cwd: ROOT, stdio: ["ignore", "ignore", "inherit"] });
  execFileSync("ffmpeg", ["-y", "-i", raw, "-af", LOUDNORM, "-c:v", "copy", `${final}.tmp.mp4`], { stdio: ["ignore", "ignore", "pipe"] });
  renameSync(`${final}.tmp.mp4`, final);
  rmSync(raw);
  console.log(`shipped out/${slug}.mp4`);
}

console.log("\nQA:");
const qa = spawnSync("node", [join(ROOT, "scripts", "qa.mjs"), ...slugs], { stdio: "inherit" });
process.exit(qa.status ?? 1);
