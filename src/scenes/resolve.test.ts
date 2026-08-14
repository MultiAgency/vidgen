// Unit tests for the schema compiler core (npm test — bundled by esbuild,
// run under plain node; no framework). Covers the contracts scene data
// relies on: word/ref/abs anchor resolution, fail-loud missing anchors and
// forward refs, overlap detection with its three real exceptions (fade-tail
// non-occupancy, point slots, sfx), allowOverlap, custom slot claims, and
// hide-cue auto-pairing.
import assert from "node:assert/strict";
import type { Timings } from "../posts";
import { buildCues, checkOverlaps, resolveAnchors } from "./resolve";
import { Beat, SceneSpec } from "./schema";
import { POINT_SLOTS, RESERVED, SLOTS, SlotName, intersects } from "./stage";

// AUDIO_START (0.8) offsets every word anchor.
const timings: Timings = {
  words: [
    { text: "Hello", start: 1.0, end: 1.4 },
    { text: "world.", start: 2.0, end: 2.4 },
    { text: "again", start: 3.0, end: 3.4 },
    { text: "world.", start: 4.0, end: 4.4 },
  ],
} as Timings;

const sfx: Beat["prop"] = { kind: "sfx", name: "pop" };
const card: Beat["prop"] = { kind: "card", states: [{ text: [{ text: "x" }] }] };
const spec = (beats: Beat[], cues?: SceneSpec["cues"]): SceneSpec => ({
  slug: "test",
  beats,
  cues,
});

let passed = 0;
const test = (name: string, fn: () => void) => {
  try {
    fn();
    passed += 1;
  } catch (e) {
    console.error(`FAIL ${name}`);
    throw e;
  }
};

// ── anchor resolution ───────────────────────────────────────────────────────

test("word anchor resolves through AUDIO_START", () => {
  const { resolved } = resolveAnchors(spec([{ id: "a", in: { word: "^Hello$" }, slot: "none", prop: sfx }]), timings);
  assert.equal(resolved[0].tIn, 1.8);
  assert.equal(resolved[0].tOut, 2.4); // default out = in + 0.6
});

test("word anchor honors nth -1 and offset", () => {
  const { resolved } = resolveAnchors(
    spec([{ id: "a", in: { word: "^world\\.$", nth: -1, offset: -0.3 }, slot: "none", prop: sfx }]),
    timings,
  );
  assert.ok(Math.abs(resolved[0].tIn - 4.5) < 1e-9);
});

test("missing word anchor throws", () => {
  assert.throws(
    () => resolveAnchors(spec([{ id: "a", in: { word: "^absent$" }, slot: "none", prop: sfx }]), timings),
    /anchor not found/,
  );
});

test("out-of-range nth throws", () => {
  assert.throws(
    () => resolveAnchors(spec([{ id: "a", in: { word: "^Hello$", nth: 3 }, slot: "none", prop: sfx }]), timings),
    /no match/,
  );
});

test("abs anchor passes through untouched", () => {
  const { resolved } = resolveAnchors(spec([{ id: "a", in: { at: 7 }, slot: "none", prop: sfx }]), timings);
  assert.equal(resolved[0].tIn, 7);
});

test("ref anchor resolves against an earlier beat", () => {
  const { resolved } = resolveAnchors(
    spec([
      { id: "a", in: { at: 2 }, slot: "none", prop: sfx },
      { id: "b", in: { ref: "a", offset: 1.5 }, slot: "none", prop: sfx },
    ]),
    timings,
  );
  assert.equal(resolved[1].tIn, 3.5);
});

test("a beat's out may self-reference its own in", () => {
  const { resolved } = resolveAnchors(
    spec([{ id: "a", in: { at: 2 }, out: { ref: "a", offset: 4.3 }, slot: "none", prop: sfx }]),
    timings,
  );
  assert.equal(resolved[0].tOut, 6.3);
});

test("forward ref throws (topological order required)", () => {
  assert.throws(
    () =>
      resolveAnchors(
        spec([
          { id: "a", in: { ref: "b" }, slot: "none", prop: sfx },
          { id: "b", in: { at: 1 }, slot: "none", prop: sfx },
        ]),
        timings,
      ),
    /unresolved/,
  );
});

// ── overlap checking ────────────────────────────────────────────────────────

const at = (id: string, tIn: number, tOut: number, slot: Beat["slot"], prop: Beat["prop"] = card, extra?: Partial<Beat>) => ({
  id,
  in: { at: tIn },
  out: { at: tOut },
  slot,
  prop,
  ...extra,
});

const resolve = (beats: Beat[]) => resolveAnchors(spec(beats), timings).resolved;

test("same slot + overlapping windows throws with both ids", () => {
  assert.throws(
    () => checkOverlaps(resolve([at("a", 0, 5, "center-low"), at("b", 2, 8, "center-low")])),
    /a × b.*center-low/s,
  );
});

test("intersecting (different) slots also collide", () => {
  // center-low {680,560,560,200} and beside-mascot {760,640,480,160} intersect
  assert.throws(
    () => checkOverlaps(resolve([at("a", 0, 5, "center-low"), at("b", 2, 8, "beside-mascot")])),
    /a × b/,
  );
});

test("disjoint slots never collide", () => {
  checkOverlaps(resolve([at("a", 0, 5, "top-right-card"), at("b", 2, 8, "pipeline-band")]));
});

test("overlap confined to the fade tail is not occupancy", () => {
  // a fades over its last 0.5s; b enters at 4.6 — inside a's tail only
  checkOverlaps(resolve([at("a", 0, 5, "center-low"), at("b", 4.6, 8, "center-low")]));
});

test("point slots are exempt", () => {
  checkOverlaps(resolve([at("a", 0, 5, "mascot-shield"), at("b", 0, 5, "mascot-shield")]));
});

test("sfx beats never occupy", () => {
  checkOverlaps(resolve([at("a", 0, 5, "center-low"), at("b", 0, 5, "center-low", sfx)]));
});

test("allowOverlap suppresses a named collision", () => {
  checkOverlaps(
    resolve([
      at("a", 0, 5, "center-low", card, { allowOverlap: ["beside-mascot"] }),
      at("b", 2, 8, "beside-mascot"),
    ]),
  );
});

test("custom claims merge into one occupied rect", () => {
  const claiming: Beat["prop"] = { kind: "custom", component: "X", claims: ["center-low", "center-high"] };
  assert.throws(
    () => checkOverlaps(resolve([at("a", 0, 5, "none", claiming), at("b", 2, 8, "center-high")])),
    /a × b/,
  );
});

test("every occupiable slot stays out of the caption band", () => {
  for (const [name, rect] of Object.entries(SLOTS)) {
    if (POINT_SLOTS.includes(name as SlotName)) continue; // landmarks, not occupancy
    assert.ok(!intersects(rect, RESERVED.caption), `slot ${name} intersects the caption band`);
  }
});

// ── cue building ────────────────────────────────────────────────────────────

test("spec cues resolve their anchors", () => {
  const beats = [at("a", 2, 4, "none", sfx)];
  const { resolved, one } = resolveAnchors(spec(beats, [{ at: { word: "^again$" }, kind: "swat" }]), timings);
  const cues = buildCues(spec(beats, [{ at: { word: "^again$" }, kind: "swat" }]), resolved, one);
  assert.deepEqual(cues, [{ at: 3.8, kind: "swat", durationSeconds: undefined }]);
});

test("hideMascot clips auto-pair their hide cue", () => {
  const clip: Beat["prop"] = { kind: "clip", name: "doze", hideMascot: true };
  const s = spec([at("a", 2, 6, "none", clip)]);
  const { resolved, one } = resolveAnchors(s, timings);
  const cues = buildCues(s, resolved, one);
  assert.deepEqual(cues, [{ at: 1.95, kind: "hide", durationSeconds: 4.1 }]);
});

test("clips without hideMascot add no cue", () => {
  const clip: Beat["prop"] = { kind: "clip", name: "celebrate" };
  const s = spec([at("a", 2, 6, "none", clip)]);
  const { resolved, one } = resolveAnchors(s, timings);
  assert.equal(buildCues(s, resolved, one).length, 0);
});

console.log(`ok — ${passed} tests passed`);
