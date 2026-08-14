// The pure compiler core of the declarative scene schema — no React, no
// remotion. fromSpec.tsx is the view layer over these functions, and
// resolve.test.ts exercises them directly (npm test).
import type { MascotCue } from "../components/cues";
import type { Timings } from "../posts";
import { AUDIO_START } from "../timing";
import type { Anchor, Beat, SceneSpec } from "./schema";
import { POINT_SLOTS, RESERVED, SLOTS, SlotName, intersects } from "./stage";

// ── Word anchoring ──────────────────────────────────────────────────────────
// Scenes anchor every beat to the voiceover words so re-voicing a script can
// never desync the choreography. Throws when the pattern is missing so a
// script edit that breaks a scene fails loudly at build time.
export const wordTime = (
  timings: Timings,
  pattern: RegExp,
  opts: { nth?: number; offset?: number } = {},
): number => {
  const matches = timings.words.filter((w) => pattern.test(w.text));
  if (matches.length === 0) {
    throw new Error(`scene anchor not found: ${pattern}`);
  }
  const nth = opts.nth ?? 0;
  const w = matches[nth < 0 ? matches.length + nth : nth];
  if (!w) throw new Error(`scene anchor ${pattern} has no match #${opts.nth}`);
  return AUDIO_START + w.start + (opts.offset ?? 0);
};

export type Resolved = Beat & { tIn: number; tOut: number };

export const FADE_TAIL = 0.5; // props fade for their final ~0.5s — not occupancy

export const resolveAnchors = (spec: SceneSpec, timings: Timings) => {
  const times: Record<string, number> = {};
  const one = (a: Anchor, self: string): number => {
    if ("at" in a) return a.at;
    if ("word" in a) {
      return wordTime(timings, new RegExp(a.word), { nth: a.nth, offset: a.offset });
    }
    if (!(a.ref in times)) {
      throw new Error(`beat "${self}": ref "${a.ref}" unresolved (order beats topologically; cycles are not allowed)`);
    }
    return times[a.ref] + (a.offset ?? 0);
  };
  const resolved: Resolved[] = [];
  for (const b of spec.beats) {
    const tIn = one(b.in, b.id);
    times[b.id] = tIn;
    const tOut = b.out ? one(b.out, b.id) : tIn + 0.6;
    resolved.push({ ...b, tIn, tOut });
  }
  return { resolved, times, one };
};

/** The rect a beat occupies: merged claims for customs, else its slot. */
const rectOf = (b: Resolved) =>
  b.prop.kind === "custom" && b.prop.claims?.length
    ? b.prop.claims.map((c) => SLOTS[c]).reduce((a, r) => ({
        x: Math.min(a.x, r.x), y: Math.min(a.y, r.y),
        w: Math.max(a.x + a.w, r.x + r.w) - Math.min(a.x, r.x),
        h: Math.max(a.y + a.h, r.y + r.h) - Math.min(a.y, r.y),
      }))
    : b.slot !== "none"
      ? SLOTS[b.slot as SlotName]
      : null;

export const checkOverlaps = (beats: Resolved[]) => {
  const problems: string[] = [];
  const occupied = beats.filter(
    (b) =>
      b.prop.kind !== "sfx" &&
      !POINT_SLOTS.includes(b.slot as SlotName) &&
      rectOf(b) !== null,
  );
  for (const b of occupied) {
    const rect = rectOf(b)!;
    // reserved bands (the rail relaxation during focus is handled by the
    // pixel checker; statically we simply forbid the caption band)
    if (intersects(rect, RESERVED.caption)) {
      problems.push(`${b.id}: slot "${b.slot}" intersects the reserved caption band`);
    }
    for (const other of occupied) {
      if (other.id <= b.id) continue;
      if (b.allowOverlap?.includes(other.slot as SlotName)) continue;
      if (other.allowOverlap?.includes(b.slot as SlotName)) continue;
      const overlapT = Math.min(b.tOut - FADE_TAIL, other.tOut - FADE_TAIL) - Math.max(b.tIn, other.tIn);
      if (overlapT <= 0) continue;
      if (intersects(rect, rectOf(other)!)) {
        problems.push(
          `${b.id} × ${other.id}: slots "${b.slot}"/"${other.slot}" intersect for ${overlapT.toFixed(1)}s (${Math.max(b.tIn, other.tIn).toFixed(1)}s+)`,
        );
      }
    }
  }
  if (problems.length) {
    throw new Error(`scene overlap check failed:\n  ${problems.join("\n  ")}`);
  }
};

export const buildCues = (
  spec: SceneSpec,
  resolved: Resolved[],
  one: (a: Anchor, self: string) => number,
): MascotCue[] => {
  const cues: MascotCue[] = (spec.cues ?? []).map((c) => ({
    at: one(c.at, "cue"),
    kind: c.kind,
    durationSeconds: c.durationSeconds,
  }));
  // clip beats with hideMascot auto-pair the hide cue — no manual pairing.
  for (const b of resolved) {
    if (b.prop.kind === "clip" && b.prop.hideMascot) {
      cues.push({ at: b.tIn - 0.05, kind: "hide", durationSeconds: b.tOut - b.tIn + 0.1 });
    }
  }
  return cues;
};
