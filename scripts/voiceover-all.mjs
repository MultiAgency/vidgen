#!/usr/bin/env node
// Run scripts/voiceover.mjs for a set of posts (default: all of posts/),
// skipping any that already have an mp3.
//
// Usage:
//   ELEVENLABS_API_KEY=... npm run voiceover:all                          # all posts
//   ELEVENLABS_API_KEY=... npm run voiceover:all -- posts/{097..103}-*.json
//   npm run voiceover:all -- --mock
//
// Delete a post's mp3 to regenerate it. --mock is forwarded and skips
// nothing mp3-wise since mock mode writes no mp3 — it refreshes word
// timings instead.

import { readdir, readFile, access } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const mock = process.argv.includes("--mock");

const fileArgs = process.argv.slice(2).filter((a) => a !== "--mock");
const postPaths =
  fileArgs.length > 0
    ? fileArgs.map((f) => resolve(f))
    : (await readdir(join(projectRoot, "posts")))
        .filter((f) => f.endsWith(".json"))
        .sort()
        .map((f) => join(projectRoot, "posts", f));

let failures = 0;
for (const postPath of postPaths) {
  const { slug } = JSON.parse(await readFile(postPath, "utf8"));
  if (!mock) {
    const done = await access(join(projectRoot, "public", "audio", `${slug}.mp3`))
      .then(() => true, () => false);
    if (done) {
      console.log(`skip ${slug} (mp3 exists)`);
      continue;
    }
  }
  const args = [join(projectRoot, "scripts", "voiceover.mjs")];
  if (mock) args.push("--mock");
  args.push(postPath);
  const { status } = spawnSync(process.execPath, args, { stdio: "inherit" });
  if (status !== 0) failures++;
}

process.exit(failures ? 1 : 0);
