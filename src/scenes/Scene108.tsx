import React from "react";
import { interpolate } from "remotion";
import { ClipMascot } from "../components/ClipMascot";
import { MascotCue } from "../components/cues";
import { Timings } from "../posts";
import { COLORS, FONTS } from "../theme";
import { Chip, SPOTS, Sfx, useT, wordTime } from "./props";

// 108 — Inside IronClaw. The contributor architecture tour: the walkthrough
// rail and cards carry the verified claims; this scene adds the on-screen
// file-path receipts (the script's opening promise), the four runtime-lane
// chips, and the knight acting the perimeter story. Every path shown here
// was verified against ironclaw HEAD 307521f15 — update the receipts if the
// script is re-voiced against a newer tree.

/** Bottom-right mono receipt: which source file backs the current claim. */
const PathTag: React.FC<{ from: number; to: number; path: string }> = ({
  from,
  to,
  path,
}) => {
  const t = useT();
  if (t < from || t > to) return null;
  const opacity =
    interpolate(t, [from, from + 0.35], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) *
    interpolate(t, [to - 0.35, to], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  return (
    <div
      style={{
        // Clear of the rail band and of camera-zoom clipping at the frame edge.
        position: "absolute",
        right: 130,
        top: 175,
        padding: "8px 14px",
        borderRadius: 10,
        background: "rgba(13, 20, 38, 0.85)",
        border: "1.5px solid rgba(226, 232, 240, 0.22)",
        fontFamily: FONTS.mono,
        fontSize: 19,
        color: COLORS.textMuted,
        opacity,
        maxWidth: 430,
        wordBreak: "break-all",
        textAlign: "right",
      }}
    >
      {path}
    </div>
  );
};

export const buildScene108 = (timings: Timings) => {
  const w = (re: RegExp, opts?: { nth?: number; offset?: number }) =>
    wordTime(timings, re, opts);

  const beats = {
    families: w(/^Sixty-four$/),
    turn: w(/^enters$/, { offset: -0.4 }),
    loop: w(/^ordered$/, { offset: -0.6 }),
    seal: w(/^perimeter$/),
    lanes: w(/^closed$/, { offset: -0.3 }),
    manifest: w(/^manifest$/),
    events: w(/^Everything$/),
    trust: w(/^compiler\.$/, { offset: -1.2 }),
    neverDeleted: w(/^deleted$/),
    recap: w(/^shape:$/, { offset: -0.5 }),
    outro: w(/^Start$/),
  };

  const cues: MascotCue[] = [
    // Families: study the crate-tree card.
    // Loop: study the ten-stage pipeline card.
    // Seal: present the capability-stage diagram.
    // Lanes: present the four lane chips, then swat the manifest rejection.
    { at: beats.manifest + 0.3, kind: "swat" },
    // Trust: study the mint-site card.
    // The outro goes to the generated 3D figurine: rig hides, clip jumps.
    { at: beats.outro - 0.1, kind: "hide", durationSeconds: 8 },
  ];

  const receipts = [
    { from: beats.families, to: beats.turn, path: "crates/AGENTS.md" },
    {
      from: beats.turn,
      to: beats.loop,
      path: "ironclaw_turns/src/coordinator.rs:314",
    },
    {
      from: beats.loop,
      to: beats.seal,
      path: "ironclaw_agent_loop/src/executor/pipeline.rs:30",
    },
    {
      from: beats.seal,
      to: beats.lanes,
      path: "ironclaw_capabilities/src/host/authorize.rs:164",
    },
    {
      from: beats.lanes,
      to: beats.events,
      path: "ironclaw_host_api/src/lane.rs · runtime.rs",
    },
    {
      from: beats.events,
      to: beats.trust,
      path: "ironclaw_event_log/src/sink.rs",
    },
    {
      from: beats.trust,
      to: beats.recap,
      path: "ironclaw_conversations/src/inbound.rs:358",
    },
  ];

  const LANES = [
    { icon: "🖥", label: "first-party" },
    { icon: "🧩", label: "wasm" },
    { icon: "🕸", label: "mcp" },
    { icon: "📦", label: "process" },
  ];

  const Overlay: React.FC = () => {
    const t = useT();
    return (
      <>
        {/* Sound choreography — this scene shipped 180s with two SFX total.
            Whoosh on section turns, stamp on the seal, ding on the payoffs. */}
        <Sfx name="whoosh" at={beats.families} volume={0.32} />
        <Sfx name="whoosh" at={beats.turn} volume={0.32} />
        <Sfx name="whoosh" at={beats.loop} volume={0.32} />
        <Sfx name="stamp" at={beats.seal + 0.1} volume={0.4} />
        <Sfx name="whoosh" at={beats.lanes} volume={0.32} />
        <Sfx name="pop" at={beats.manifest + 0.3} volume={0.38} />
        <Sfx name="whoosh" at={beats.events} volume={0.32} />
        <Sfx name="ding" at={beats.neverDeleted} volume={0.42} />
        <Sfx name="riser" at={beats.recap} volume={0.4} />
        <Sfx name="stamp" at={beats.outro + 0.2} volume={0.42} />
        <ClipMascot
          name="celebrate"
          at={beats.outro}
          durationSeconds={1.35}
        />
        {/* …then settles into a slow breathing idle until the end card. */}
        <ClipMascot
          name="idle"
          at={beats.outro + 1.3}
          durationSeconds={3.8}
          playbackRate={0.52}
        />
        {receipts.map((r) => (
          <PathTag key={r.path} {...r} />
        ))}
        {LANES.map((lane, i) => {
          const inAt = beats.lanes + 0.25 * i;
          // Clear the frame before the RuntimeKind card pops (the swat cue
          // lands right as they vanish, which reads as the rejection).
          const outAt = beats.manifest - 0.4;
          if (t < inAt || t > outAt) return null;
          const opacity =
            interpolate(t, [inAt, inAt + 0.3], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }) *
            interpolate(t, [outAt - 0.3, outAt], [1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
          const x = 1180 + i * 165;
          return (
            <React.Fragment key={lane.label}>
              <Chip icon={lane.icon} x={x} y={SPOTS.lowerRight.y - 160} opacity={opacity} />
              <div
                style={{
                  position: "absolute",
                  left: x - 80,
                  top: SPOTS.lowerRight.y - 98,
                  width: 160,
                  textAlign: "center",
                  fontFamily: FONTS.mono,
                  fontSize: 22,
                  color: COLORS.text,
                  opacity,
                }}
              >
                {lane.label}
              </div>
            </React.Fragment>
          );
        })}
      </>
    );
  };

  return {
    cues,
    Overlay,
    camera: [
      { at: 0, scale: 1 },
      { at: beats.seal - 0.2, scale: 1 },
      { at: beats.seal + 1.2, scale: 1.05, x: 30 },
      { at: beats.lanes - 0.5, scale: 1 },
    ],
  };
};
