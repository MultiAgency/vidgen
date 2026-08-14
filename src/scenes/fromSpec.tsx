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
  AT,
} from "./props";
import { Anchor, CardState, RichLine, SceneSpec } from "./schema";
import { Resolved, buildCues, checkOverlaps, resolveAnchors, wordTime } from "./resolve";
import { SLOTS, SlotName } from "./stage";
import { staticFile, useCurrentFrame, useVideoConfig } from "remotion";

// Compiles a declarative SceneSpec into the same (timings) => SceneBuild
// contract hand-written scenes use. The pure compiler core (anchor
// resolution, the fail-loud overlap checker, cue pairing) lives in
// resolve.ts; this file is the React view over its output.

export type CustomBeatProps = {
  in: number;
  out: number;
  slot: { x: number; y: number; w: number; h: number };
  params: Record<string, number | string | boolean>;
  times: Record<string, number>;
};
export type CustomRegistry = Record<string, React.FC<CustomBeatProps>>;

const lineStyle = (l: RichLine): React.CSSProperties => ({
  fontFamily: l.mono ? FONTS.mono : undefined,
  color: l.color ?? COLORS.text,
  textAlign: l.align ?? "left",
  fontSize: l.size,
  marginTop: l.gap,
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
            {active.text.map((l: RichLine, i: number) =>
              !l.at || t >= resolveLocal(l.at) ? (
                <div key={i} style={lineStyle(l)}>
                  {l.text}
                </div>
              ) : null,
            )}
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
    const cues: MascotCue[] = buildCues(spec, resolved, one);
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
