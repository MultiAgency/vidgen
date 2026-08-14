import React from "react";
import { MascotCue } from "../components/cues";
import { ClipMascot } from "../components/ClipMascot";
import { Timings } from "../posts";
import { COLORS, FONTS } from "../theme";
import { CameraKey, FocusWindow, SceneBuild } from "./index";
import {
  Card,
  CaughtIcon,
  Chip,
  FootagePanel,
  IssueCard,
  Sfx,
  SwattedIcon,
  useT,
  wordTime,
  AT,
} from "./props";
import { Anchor, Beat, CardState, RichLine, SceneSpec } from "./schema";
import { POINT_SLOTS, RESERVED, SLOTS, SlotName, intersects } from "./stage";
import { staticFile, useCurrentFrame, useVideoConfig } from "remotion";

// Compiles a declarative SceneSpec into the same (timings) => SceneBuild
// contract hand-written scenes use. Anchors resolve through wordTime
// (fail-loud), ref anchors resolve topologically, and the overlap checker
// throws — reporting ALL violations at once — when interval-intersecting
// beats claim intersecting slots or reserved bands.

export type CustomBeatProps = {
  in: number;
  out: number;
  slot: { x: number; y: number; w: number; h: number };
  params: Record<string, number | string | boolean>;
  times: Record<string, number>;
};
export type CustomRegistry = Record<string, React.FC<CustomBeatProps>>;

type Resolved = Beat & { tIn: number; tOut: number };

const FADE_TAIL = 0.5; // props fade for their final ~0.5s — not occupancy

const resolveAnchors = (spec: SceneSpec, timings: Timings) => {
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

const checkOverlaps = (beats: Resolved[]) => {
  const problems: string[] = [];
  const occupied = beats.filter(
    (b) => b.slot !== "none" && !POINT_SLOTS.includes(b.slot as SlotName) && b.prop.kind !== "sfx",
  );
  for (const b of occupied) {
    const rect = b.prop.kind === "custom" && b.prop.claims?.length
      ? b.prop.claims.map((c) => SLOTS[c]).reduce((a, r) => ({
          x: Math.min(a.x, r.x), y: Math.min(a.y, r.y),
          w: Math.max(a.x + a.w, r.x + r.w) - Math.min(a.x, r.x),
          h: Math.max(a.y + a.h, r.y + r.h) - Math.min(a.y, r.y),
        }))
      : SLOTS[b.slot as SlotName];
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
      const orect = other.prop.kind === "custom" && other.prop.claims?.length
        ? SLOTS[other.prop.claims[0]]
        : SLOTS[other.slot as SlotName];
      if (intersects(rect, orect)) {
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

const lineStyle = (l: RichLine): React.CSSProperties => ({
  fontFamily: l.mono ? FONTS.mono : undefined,
  color: l.color ?? COLORS.text,
  textAlign: "left",
});

const BeatView: React.FC<{ beat: Resolved; times: Record<string, number>; timings: Timings; customs: CustomRegistry }> = ({
  beat,
  times,
  timings,
  customs,
}) => {
  const t = useT();
  useCurrentFrame();
  useVideoConfig();
  const slot = beat.slot === "none" ? { x: 0, y: 0, w: 0, h: 0 } : SLOTS[beat.slot as SlotName];
  const p = beat.prop;
  const resolveLocal = (a: Anchor): number =>
    "at" in a ? a.at
    : "word" in a ? wordTime(timings, new RegExp(a.word), { nth: a.nth, offset: a.offset })
    : times[a.ref] + (a.offset ?? 0);

  switch (p.kind) {
    case "sfx":
      return <Sfx name={p.name} at={beat.tIn} volume={p.volume ?? 0.4} />;
    case "chip":
      return t > beat.tIn && t < beat.tOut ? (
        <Chip icon={p.icon} x={slot.x + slot.w / 2} y={slot.y + slot.h / 2} size={p.size} />
      ) : null;
    case "issue":
      return (
        <IssueCard
          inAt={beat.tIn}
          outAt={beat.tOut}
          x={slot.x}
          yRest={slot.y}
          width={p.width ?? Math.min(560, slot.w)}
          size={p.size ?? 1}
          id={p.id}
          title={p.title}
        />
      );
    case "footage":
      return (
        <FootagePanel
          src={staticFile(p.src)}
          inAt={beat.tIn}
          outAt={beat.tOut}
          x={slot.x + slot.w / 2}
          y={slot.y}
          width={slot.w}
          clipStart={p.clipStart}
        />
      );
    case "clip":
      return (
        <ClipMascot
          name={p.name}
          at={beat.tIn}
          durationSeconds={beat.tOut - beat.tIn}
          playbackRate={p.playbackRate}
          loopSeconds={p.loopSeconds}
        />
      );
    case "caught": {
      const rest = AT[p.rest === "shield" ? "shield" : p.rest === "head" ? "head" : "ground"];
      return (
        <CaughtIcon
          icon={p.icon}
          t={t}
          fallAt={beat.tIn}
          rest={{ x: rest.x + (p.restOffset?.x ?? 0), y: rest.y + (p.restOffset?.y ?? 0) }}
          fromX={p.fromX}
          deliverAt={p.deliver ? resolveLocal(p.deliver.at) : undefined}
          to={p.deliver ? { x: SLOTS[p.deliver.to].x + SLOTS[p.deliver.to].w / 2, y: SLOTS[p.deliver.to].y + SLOTS[p.deliver.to].h / 2 } : undefined}
        />
      );
    }
    case "swatted":
      return <SwattedIcon icon={p.icon} t={t} hitAt={beat.tIn} />;
    case "card": {
      const active = [...p.states].reverse().find((st: CardState) => !st.at || t >= resolveLocal(st.at)) ?? p.states[0];
      return (
        <Card
          x={slot.x + slot.w / 2}
          y={slot.y + 60}
          width={p.width ?? slot.w}
          inAt={beat.tIn}
          outAt={beat.tOut}
          border={active.border ?? `${COLORS.primaryLight}88`}
          fontSize={p.fontSize}
          sound={p.sound}
        >
          <div style={{ lineHeight: p.lineHeight }}>
            {active.text.map((l: RichLine, i: number) => {
              const visible = !l.at || t >= resolveLocal(l.at);
              return (
                <div key={i} style={{ ...lineStyle(l), opacity: visible ? 1 : 0 }}>
                  {l.text}
                </div>
              );
            })}
          </div>
        </Card>
      );
    }
    case "custom": {
      const C = customs[p.component];
      if (!C) throw new Error(`custom component "${p.component}" not in this scene's registry`);
      const params: Record<string, number | string | boolean> = {};
      for (const [k, v] of Object.entries(p.params ?? {})) {
        params[k] = typeof v === "object" ? resolveLocal(v as Anchor) : v;
      }
      return t > beat.tIn && t < beat.tOut ? (
        <C in={beat.tIn} out={beat.tOut} slot={slot} params={params} times={times} />
      ) : null;
    }
  }
};

export const fromSpec =
  (spec: SceneSpec, customs: CustomRegistry = {}) =>
  (timings: Timings): SceneBuild => {
    const { resolved, times, one } = resolveAnchors(spec, timings);
    checkOverlaps(resolved);
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
    const camera: CameraKey[] | undefined = spec.camera?.map((k) => ({
      at: one(k.at, "camera"),
      scale: k.scale,
      x: k.x,
      y: k.y,
    }));
    const focus: FocusWindow[] | undefined = spec.focus?.map((f) => ({
      from: one(f.from, "focus"),
      to: one(f.to, "focus"),
    }));
    const Overlay: React.FC = () => (
      <div style={{ position: "absolute", inset: 0, fontFamily: FONTS.sans }}>
        {resolved.map((b) => (
          <BeatView key={b.id} beat={b} times={times} timings={timings} customs={customs} />
        ))}
      </div>
    );
    return { cues, Overlay, camera, focus };
  };
