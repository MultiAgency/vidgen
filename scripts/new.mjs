#!/usr/bin/env node
// npm run new -- <number> <slug> — scaffold the two files a new video needs:
//   posts/<number>-<slug>.json   the script (title/tagline/script placeholders + empty claims[])
//   src/scenes/data/<number>.ts  a minimal valid SceneSpec with one commented example beat
//
// Follows the shapes in posts/104-dev-workflow.json and src/scenes/data/097.ts.
// The scaffold never touches src/scenes/index.ts or src/posts.ts — registering a
// scene for playback stays a manual, reviewed step.

import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

const [, , numArg, slugArg] = process.argv;

if (!numArg || !slugArg) {
  console.error("usage: npm run new -- <number> <slug>");
  console.error("  npm run new -- 109 build-frames");
  process.exit(1);
}
if (!/^\d{3}$/.test(numArg)) {
  console.error(`error: <number> must be three digits, got "${numArg}"`);
  process.exit(1);
}
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slugArg)) {
  console.error(`error: <slug> must be lowercase kebab-case, got "${slugArg}"`);
  process.exit(1);
}

const slug = `${numArg}-${slugArg}`;

const postPath = join(root, "posts", `${slug}.json`);
if (existsSync(postPath)) {
  console.error(`already exists: ${postPath}`);
  process.exit(1);
}
const scenePath = join(root, "src", "scenes", "data", `${numArg}.ts`);
if (existsSync(scenePath)) {
  console.error(`already exists: ${scenePath}`);
  process.exit(1);
}

mkdirSync(dirname(postPath), { recursive: true });
mkdirSync(dirname(scenePath), { recursive: true });

writeFileSync(
  postPath,
  JSON.stringify(
    {
      slug,
      title: "Replace me — a short title",
      tagline: "Replace me — the one-line hook",
      accent: "#f97316",
      outro: "Replace me — the closer line.",
      script: "Replace me — the full voiceover script.",
      fallbackDurationSeconds: 45,
      claims: [],
    },
    null,
    2,
  ) + "\n",
);
console.log(`wrote ${postPath}`);

writeFileSync(
  scenePath,
  `import type { SceneSpec } from \"../schema\";

// ${numArg} — ${slug}: choreography as pure data. Study src/scenes/data/097.ts
// and 104.ts before writing beats: every sentence gets a visual beat, beats
// anchor to spoken words (never absolute seconds), and nothing enters the
// caption band or collides with the mascot box — the compiler enforces both.
export const scene${numArg}: SceneSpec = {
  slug: \"${slug}\",
  // Beats are anchored to voiceover words: { word: \"^regex$\", nth?, offset? }.
  // Uncomment and extend once the script is in place.
  beats: [
    {
      id: \"example\",
      in: { word: \"^Replace$\", offset: 0.1 },
      out: { word: \"^me$\", offset: 0.4 },
      slot: \"center-low\",
      prop: {
        kind: \"card\",
        width: 560,
        states: [{ text: [{ text: \"✨ your first beat — anchor it to speech\" }] }],
      },
      note: \"example beat; delete and write real beats anchored to the script\",
    },
  ],
};
`,
);
console.log(`wrote ${scenePath}`);

console.log(`\nScaffolded ${slug}. Next:`);
console.log(`  1. Edit ${postPath} — title, tagline, script, and claims[].`);
console.log(`  2. Edit ${scenePath}  — replace the example beat with real choreography.`);
console.log(`  3. Register the post in src/scenes/index.ts and src/posts.ts (manual, reviewed).`);
console.log(`  4. Run npm run lint && npm test before opening a PR.`);
