#!/usr/bin/env node
// Claims lint: every spoken product claim should be pinned to a source in the
// ironclaw repo. Posts without a claims[] array get a warning (they predate
// the manifest); a claim whose source path no longer exists FAILS — that's
// exactly how narration drifts away from the product (a wrong schedule line
// shipped once and took an outside review to catch).
// Run: npm run lint:claims
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const IRONCLAW = join(ROOT, "..", "ironclaw");
const posts = readdirSync(join(ROOT, "posts")).filter((f) => f.endsWith(".json"));

let dead = 0;
let unpinned = 0;
for (const f of posts) {
  const post = JSON.parse(readFileSync(join(ROOT, "posts", f)));
  if (!Array.isArray(post.claims) || post.claims.length === 0) {
    console.log(`warn  ${f}: no claims manifest`);
    unpinned++;
    continue;
  }
  for (const c of post.claims) {
    if (!existsSync(join(IRONCLAW, c.source))) {
      console.log(`FAIL  ${f}: source missing for "${c.text}" → ${c.source}`);
      dead++;
    }
  }
  console.log(`ok    ${f}: ${post.claims.length} claims pinned`);
}
console.log(`\n${posts.length} posts, ${unpinned} without manifests, ${dead} dead sources`);
process.exit(dead ? 1 : 0);
