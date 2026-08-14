#!/usr/bin/env node
// Generate the ambient music bed (public/audio/bed.wav) — a soft two-chord
// pad long enough to cover the longest post without looping. Pure synthesis,
// no samples, so the bed is license-free by construction.
//
// Usage: node scripts/make-bed.mjs [seconds]   (default 75)

import { writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SR = 44100;
const seconds = Number(process.argv[2] ?? 75);
const frames = Math.floor(SR * seconds);

// Two chords, alternating: A(add9) and D(add9)/A. Frequencies in Hz.
const CHORDS = [
  [110.0, 164.81, 220.0, 246.94, 277.18], // A2 E3 A3 B3 C#4
  [110.0, 146.83, 220.0, 293.66, 369.99], // A2 D3 A3 D4 F#4
];
const CHORD_SECONDS = 16;
const XFADE = 3; // seconds of overlap between chords

// Deterministic LFO phases (no Math.random — reproducible bed).
const phase = (i, j) => ((i * 7 + j * 13) % 10) / 10;

const smoothstep = (x) => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};

// Envelope of chord c at time t: rises over XFADE at its start, falls over
// XFADE at its end, active every other CHORD_SECONDS slot.
const chordEnv = (c, t) => {
  const period = CHORD_SECONDS * CHORDS.length;
  const local = ((t % period) + period) % period;
  const start = c * CHORD_SECONDS;
  const end = start + CHORD_SECONDS;
  const rise = smoothstep((local - start) / XFADE);
  const fall = 1 - smoothstep((local - (end - XFADE)) / XFADE);
  // Wrap-around for chord 0 rising again at period end.
  const wrapRise = c === 0 ? smoothstep((local - (period - XFADE)) / XFADE) : 0;
  return Math.max(Math.min(rise, fall), wrapRise);
};

const left = new Float64Array(frames);
const right = new Float64Array(frames);

for (let f = 0; f < frames; f++) {
  const t = f / SR;
  let l = 0;
  let r = 0;
  for (let c = 0; c < CHORDS.length; c++) {
    const env = chordEnv(c, t);
    if (env <= 0) continue;
    for (let v = 0; v < CHORDS[c].length; v++) {
      const freq = CHORDS[c][v];
      // Slow per-voice shimmer.
      const lfo = 0.75 + 0.25 * Math.sin(2 * Math.PI * (0.05 + 0.02 * v) * t + phase(c, v) * 2 * Math.PI);
      // Higher voices quieter; add a faint octave partial for warmth.
      const amp = (env * lfo * 0.9) / (v + 2);
      const detune = 1.0015; // L/R detune for stereo width
      l += amp * (Math.sin(2 * Math.PI * freq * t) + 0.18 * Math.sin(2 * Math.PI * freq * 2 * t));
      r += amp * (Math.sin(2 * Math.PI * freq * detune * t) + 0.18 * Math.sin(2 * Math.PI * freq * 2 * detune * t));
    }
  }
  // Global fade in/out.
  const fade = smoothstep(t / 2) * smoothstep((seconds - t) / 3);
  left[f] = l * fade;
  right[f] = r * fade;
}

// Normalize to a modest peak; the Remotion volume prop does the ducking.
let peak = 0;
for (let f = 0; f < frames; f++) {
  peak = Math.max(peak, Math.abs(left[f]), Math.abs(right[f]));
}
const gain = 0.5 / peak;

const data = Buffer.alloc(frames * 4);
for (let f = 0; f < frames; f++) {
  data.writeInt16LE(Math.round(left[f] * gain * 32767), f * 4);
  data.writeInt16LE(Math.round(right[f] * gain * 32767), f * 4 + 2);
}

const header = Buffer.alloc(44);
header.write("RIFF", 0);
header.writeUInt32LE(36 + data.length, 4);
header.write("WAVE", 8);
header.write("fmt ", 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20); // PCM
header.writeUInt16LE(2, 22); // stereo
header.writeUInt32LE(SR, 24);
header.writeUInt32LE(SR * 4, 28);
header.writeUInt16LE(4, 32);
header.writeUInt16LE(16, 34);
header.write("data", 36);
header.writeUInt32LE(data.length, 40);

const out = join(projectRoot, "public", "audio", "bed.wav");
await writeFile(out, Buffer.concat([header, data]));
console.log(`wrote public/audio/bed.wav (${seconds}s, ${((44 + data.length) / 1e6).toFixed(1)} MB)`);
