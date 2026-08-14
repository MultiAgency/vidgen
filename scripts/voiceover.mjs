#!/usr/bin/env node
// Generate the voiceover for a post via ElevenLabs text-to-speech.
//
// Usage:
//   ELEVENLABS_API_KEY=... node scripts/voiceover.mjs posts/001-meet-ironclaw.json
//   node scripts/voiceover.mjs --mock posts/001-meet-ironclaw.json
//
// Writes:
//   public/audio/<slug>.mp3         — the voiceover audio
//   public/audio/<slug>.words.json  — word-level timings + total duration,
//                                     consumed by the Captions component and
//                                     by calculateMetadata for video length.
//
// --mock skips the API and estimates word timings from the script at a
// typical speaking rate, so captions, pacing, and talk animation can be
// previewed without an API key (no mp3 is written; the video renders silent).
//
// ELEVENLABS_VOICE_ID overrides the post's voice.voiceId when set.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const argv = process.argv.slice(2);
const mock = argv.includes("--mock");
const postPath = argv.find((a) => a !== "--mock");
if (!postPath) {
  console.error("usage: node scripts/voiceover.mjs [--mock] posts/<slug>.json");
  process.exit(1);
}

const audioDir = join(projectRoot, "public", "audio");

if (mock) {
  const post = JSON.parse(await readFile(resolve(postPath), "utf8"));
  // ~165 wpm base rate; punctuation adds a pause, long words take longer.
  const tokens = post.script.split(/\s+/).filter(Boolean);
  const words = [];
  let t = 0;
  for (const token of tokens) {
    const dur = 0.22 + token.length * 0.028;
    words.push({ text: token, start: t, end: t + dur });
    t += dur + (/[.!?:—]$/.test(token) ? 0.45 : /[,;]$/.test(token) ? 0.2 : 0.06);
  }
  await mkdir(audioDir, { recursive: true });
  await writeFile(
    join(audioDir, `${post.slug}.words.json`),
    JSON.stringify({ durationSeconds: t, words }, null, 2),
  );
  console.log(
    `wrote public/audio/${post.slug}.words.json (mock, ${t.toFixed(1)}s, ${words.length} words)`,
  );
  process.exit(0);
}

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) {
  console.error("ELEVENLABS_API_KEY is not set");
  process.exit(1);
}

const post = JSON.parse(await readFile(resolve(postPath), "utf8"));
const voiceId = process.env.ELEVENLABS_VOICE_ID ?? post.voice?.voiceId;
if (!voiceId) {
  console.error("no voice id: set voice.voiceId in the post or ELEVENLABS_VOICE_ID");
  process.exit(1);
}

const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`;
const res = await fetch(url, {
  method: "POST",
  headers: { "xi-api-key": apiKey, "content-type": "application/json" },
  body: JSON.stringify({
    text: post.script,
    model_id: post.voice?.modelId ?? "eleven_multilingual_v2",
    voice_settings: {
      stability: post.voice?.stability ?? 0.5,
      similarity_boost: post.voice?.similarityBoost ?? 0.75,
    },
  }),
});
if (!res.ok) {
  console.error(`ElevenLabs request failed: ${res.status} ${await res.text()}`);
  process.exit(1);
}

const body = await res.json();
const { characters, character_start_times_seconds: starts, character_end_times_seconds: ends } =
  body.alignment;

// Collapse the character-level alignment into word timings.
const words = [];
let current = null;
characters.forEach((ch, i) => {
  if (/\s/.test(ch)) {
    if (current) words.push(current);
    current = null;
    return;
  }
  if (!current) {
    current = { text: ch, start: starts[i], end: ends[i] };
  } else {
    current.text += ch;
    current.end = ends[i];
  }
});
if (current) words.push(current);

const durationSeconds = ends.length ? ends[ends.length - 1] : 0;

await mkdir(audioDir, { recursive: true });
await writeFile(join(audioDir, `${post.slug}.mp3`), Buffer.from(body.audio_base64, "base64"));
await writeFile(
  join(audioDir, `${post.slug}.words.json`),
  JSON.stringify({ durationSeconds, words }, null, 2),
);

console.log(
  `wrote public/audio/${post.slug}.mp3 (${durationSeconds.toFixed(1)}s, ${words.length} words)`,
);
