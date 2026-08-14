#!/usr/bin/env node
// Synthesize the tiny SFX set (license-free by construction, like the bed):
//   pop.wav    — prop cards/chips landing
//   whoosh.wav — swats and fly-offs
//   stamp.wav  — verdict stamps
//   ding.wav   — confirmations (✓ / approvals)
// Usage: node scripts/make-sfx.mjs

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SR = 44100;

// Deterministic noise (no Math.random): xorshift.
let seed = 0x9e3779b9;
const rand = () => {
  seed ^= seed << 13;
  seed ^= seed >>> 17;
  seed ^= seed << 5;
  return ((seed >>> 0) / 0xffffffff) * 2 - 1;
};

const env = (t, a, d) => (t < a ? t / a : Math.max(0, 1 - (t - a) / d));

const render = (seconds, fn) => {
  const n = Math.floor(SR * seconds);
  const out = new Float64Array(n);
  let lp = 0;
  for (let i = 0; i < n; i++) out[i] = fn(i / SR, () => rand(), (x, k) => (lp = lp + k * (x - lp)));
  return out;
};

const SFX = {
  // Soft click-pop: sine blip pitching down fast.
  "pop.wav": render(0.16, (t) => {
    const f = 620 - t * 1800;
    return Math.sin(2 * Math.PI * f * t) * env(t, 0.004, 0.11) * 0.7;
  }),
  // Airy whoosh: lowpassed noise with a swell.
  "whoosh.wav": render(0.45, (t, noise, lowpass) => {
    const cutoff = 0.04 + 0.25 * Math.sin(Math.PI * Math.min(t / 0.45, 1));
    return lowpass(noise(), cutoff) * env(t, 0.12, 0.3) * 1.6;
  }),
  // Stamp thunk: low sine knock + noise transient.
  "stamp.wav": render(0.22, (t, noise) => {
    const body = Math.sin(2 * Math.PI * (110 - t * 160) * t) * env(t, 0.003, 0.16) * 0.9;
    const click = noise() * env(t, 0.001, 0.02) * 0.5;
    return body + click;
  }),
  // Two-partial bell ding.
  "ding.wav": render(0.5, (t) => {
    const e = env(t, 0.004, 0.42);
    return (Math.sin(2 * Math.PI * 1318.5 * t) * 0.6 + Math.sin(2 * Math.PI * 1975.5 * t) * 0.25) * e * 0.5;
  }),
  // Soft keyboard burst under typed terminal cards (~2.4s of irregular ticks).
  "typing.wav": render(2.4, (t, noise) => {
    const step = 0.085 + 0.02 * Math.sin(t * 9.7);
    const phase = t % step;
    const tick = phase < 0.012 ? noise() * env(phase, 0.001, 0.01) : 0;
    return tick * 0.8 * env(t, 0.05, 2.3);
  }),
  // Riser into the recap: filtered noise sweeping up over 1.6s.
  "riser.wav": render(1.6, (t, noise, lowpass) => {
    const p = t / 1.6;
    return lowpass(noise(), 0.02 + p * 0.3) * p * p * 1.8;
  }),
};

const dir = join(root, "public", "audio", "sfx");
await mkdir(dir, { recursive: true });
for (const [name, data] of Object.entries(SFX)) {
  let peak = 0;
  for (const v of data) peak = Math.max(peak, Math.abs(v));
  const gain = 0.8 / peak;
  const buf = Buffer.alloc(44 + data.length * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + data.length * 2, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(data.length * 2, 40);
  data.forEach((v, i) => buf.writeInt16LE(Math.round(v * gain * 32767), 44 + i * 2));
  await writeFile(join(dir, name), buf);
  console.log(`wrote public/audio/sfx/${name}`);
}
