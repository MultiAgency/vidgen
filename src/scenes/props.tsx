import React from "react";
import {
  Audio,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { IconOrEmoji } from "../components/icons";
import { smooth } from "../components/motion";
import { MASCOT_BOTTOM_FRAC, MASCOT_HEIGHT_FRAC, MASCOT_LEFT_FRAC } from "../layout";
import { COLORS, FONTS } from "../theme";

/** One-shot sound effect at `at` seconds (pop / whoosh / stamp / ding). */
export const Sfx: React.FC<{ name: string; at: number; volume?: number }> = ({
  name,
  at,
  volume = 0.5,
}) => {
  const { fps } = useVideoConfig();
  const from = Math.round(at * fps);
  if (from < 0) return null;
  return (
    <Sequence from={from} durationInFrames={Math.round(fps * 0.6)}>
      <Audio src={staticFile(`audio/sfx/${name}.wav`)} volume={volume} />
    </Sequence>
  );
};

// ── Word anchoring ──────────────────────────────────────────────────────────
// wordTime lives in resolve.ts (the pure compiler core); re-exported here so
// hand scenes keep their single props import.
export { wordTime } from "./resolve";

// ── Layout landmarks (16:9, 1920×1080) ─────────────────────────────────────
// Derived from the same constants MascotPost renders with (src/layout.ts) —
// a hand-mirrored 0.72 survived a layout change once and skewed every
// landmark by ~50px.
export const MASCOT_BOX = {
  left: 1920 * MASCOT_LEFT_FRAC,
  bottom: 1080 * MASCOT_BOTTOM_FRAC,
  height: 1080 * MASCOT_HEIGHT_FRAC,
};
const mx = (x: number) => MASCOT_BOX.left + (x / 1536) * MASCOT_BOX.height;
const my = (y: number) =>
  MASCOT_BOX.bottom - MASCOT_BOX.height + (y / 1536) * MASCOT_BOX.height;

/** Natural-coordinate → screen-space mapping for mascot features. */
export const AT = {
  shield: { x: mx(740), y: my(1130) },
  ground: { x: mx(700), y: my(1420) },
  head: { x: mx(505), y: my(850) },
  swordTip: { x: mx(152), y: my(60) },
};
/** Free areas that never collide with title/captions at 16:9. */
export const SPOTS = {
  bubble: { x: 1290, y: 830 },
  card: { x: 960, y: 320 },
  lowerRight: { x: 1450, y: 900 },
};

export const ease = smooth;

/** Current composition time in seconds. */
export const useT = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

// ── Shared prop components ─────────────────────────────────────────────────

export const Chip: React.FC<{
  icon: string;
  x: number;
  y: number;
  size?: number;
  rot?: number;
  opacity?: number;
  color?: string;
}> = ({ icon, x, y, size = 64, rot = 0, opacity = 1, color = "#e2e8f0" }) => {
  const pad = size * 0.22;
  const badge = size + pad * 2;
  return (
    <div
      style={{
        position: "absolute",
        left: x - badge / 2,
        top: y - badge / 2,
        width: badge,
        height: badge,
        borderRadius: badge / 2,
        background: "rgba(13, 20, 38, 0.92)",
        border: "2px solid rgba(226, 232, 240, 0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `rotate(${rot}deg)`,
        opacity,
        filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.55))",
      }}
    >
      <IconOrEmoji icon={icon} size={size * 0.78} color={color} />
    </div>
  );
};

/** Labeled prop card (approval prompts, cron cards, verdict stamps…). */
export const Card: React.FC<{
  x: number;
  y: number;
  width: number;
  inAt: number;
  outAt: number;
  border: string;
  children: React.ReactNode;
  fontSize?: number;
  /** Entrance sound; null silences it. */
  sound?: "pop" | "stamp" | "ding" | null;
}> = ({ x, y, width, inAt, outAt, border, children, fontSize = 38, sound = "pop" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t < inAt || t > outAt) return null;
  const pop = spring({
    frame: frame - Math.round(inAt * fps),
    fps,
    config: { damping: 10, stiffness: 130, mass: 0.8 },
  });
  const out = interpolate(t, [outAt - 0.5, outAt], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <>
      {sound ? <Sfx name={sound} at={inAt} /> : null}
      <div
        style={{
          position: "absolute",
          left: x - width / 2,
          top: y - 60,
          width,
          padding: "20px 26px",
          borderRadius: 20,
          border: `3px solid ${border}`,
          borderTopWidth: 5,
          background: "rgba(13, 20, 38, 0.94)",
          boxShadow: "0 18px 50px rgba(0,0,0,0.5)",
          opacity: out,
          transform: `scale(${pop * (0.85 + out * 0.15)}) translateY(${(1 - pop) * 26 + (1 - out) * 20}px) rotate(${(1 - pop) * -1.5}deg)`,
          fontSize,
          fontWeight: 700,
          color: COLORS.text,
          textAlign: "center",
        }}
      >
        {children}
      </div>
    </>
  );
};

/** Falls in from above, bounces at `rest`, then (optionally) arcs to `to`. */
export const CaughtIcon: React.FC<{
  icon: string;
  t: number;
  fallAt: number;
  rest: { x: number; y: number };
  fromX: number;
  deliverAt?: number;
  to?: { x: number; y: number };
}> = ({ icon, t, fallAt, rest, fromX, deliverAt, to }) => {
  if (t < fallAt) return null;
  const sounds = (
    <>
      <Sfx name="pop" at={fallAt + 0.55} volume={0.4} />
      {deliverAt !== undefined ? <Sfx name="whoosh" at={deliverAt} volume={0.35} /> : null}
    </>
  );
  if (deliverAt === undefined || t < deliverAt) {
    const f = (t - fallAt) / 0.55;
    if (f < 1) {
      return (
        <>
          {sounds}
          <Chip
            icon={icon}
            x={interpolate(f, [0, 1], [fromX, rest.x])}
            y={interpolate(f * f, [0, 1], [-80, rest.y])}
            rot={f * 180}
          />
        </>
      );
    }
    const b = t - fallAt - 0.55;
    const bounce = b < 0.3 ? -Math.sin((Math.PI * b) / 0.3) * 16 : 0;
    return (
      <>
        {sounds}
        <Chip icon={icon} x={rest.x} y={rest.y + bounce} />
      </>
    );
  }
  const d = (t - deliverAt) / 0.5;
  if (d >= 1 || !to) return null;
  const e = ease(d);
  return (
    <>
      {sounds}
      <Chip
        icon={icon}
        x={interpolate(e, [0, 1], [rest.x, to.x])}
        y={interpolate(e, [0, 1], [rest.y, to.y]) - Math.sin(Math.PI * e) * 140}
        size={interpolate(e, [0.6, 1], [64, 30], { extrapolateLeft: "clamp" })}
      />
    </>
  );
};

/** Real product footage in a browser-chrome frame, muted, popping in/out. */
export const FootagePanel: React.FC<{
  src: string;
  inAt: number;
  outAt: number;
  x: number;
  y: number;
  width: number;
  /** Seconds of the clip to skip (e.g. leading scroll before the moment). */
  clipStart?: number;
}> = ({ src, inAt, outAt, x, y, width, clipStart = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t < inAt || t > outAt) return null;
  const pop = spring({
    frame: frame - Math.round(inAt * fps),
    fps,
    config: { damping: 11, stiffness: 120 },
  });
  const out = interpolate(t, [outAt - 0.4, outAt], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const videoH = (width * 720) / 1280;
  return (
    <>
      <Sfx name="pop" at={inAt} volume={0.4} />
      <div
        style={{
          position: "absolute",
          left: x - width / 2,
          top: y,
          width,
          borderRadius: 14,
          overflow: "hidden",
          border: "1px solid rgba(226,232,240,0.25)",
          background: "#0b1120",
          boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
          opacity: out,
          transform: `scale(${pop * (0.9 + out * 0.1)}) translateY(${(1 - pop) * 26}px)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px" }}>
          {["#f87171", "#fbbf24", "#34d399"].map((c) => (
            <div key={c} style={{ width: 10, height: 10, borderRadius: 5, background: c }} />
          ))}
          <div
            style={{
              marginLeft: 8,
              padding: "3px 14px",
              borderRadius: 8,
              background: "rgba(148,163,184,0.12)",
              color: COLORS.textMuted,
              fontSize: 15,
              fontFamily: "ui-monospace, monospace",
            }}
          >
            127.0.0.1:3000 — IronClaw console
          </div>
          <div
            style={{
              marginLeft: "auto",
              padding: "3px 10px",
              borderRadius: 8,
              background: "rgba(16,185,129,0.15)",
              color: "#34d399",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.08em",
            }}
          >
            LIVE CAPTURE
          </div>
        </div>
        <Sequence from={Math.round(inAt * fps)} layout="none">
          <OffthreadVideo
            src={src}
            muted
            trimBefore={Math.round(clipStart * fps)}
            style={{ width, height: videoH, display: "block" }}
          />
        </Sequence>
      </div>
    </>
  );
};

/** Falls toward the mascot and gets batted off-screen left at `hitAt`. */
export const SwattedIcon: React.FC<{ icon: string; t: number; hitAt: number }> = ({
  icon,
  t,
  hitAt,
}) => {
  const fallAt = hitAt - 0.55;
  if (t < fallAt) return null;
  const whoosh = <Sfx name="whoosh" at={hitAt} volume={0.45} />;
  if (t < hitAt) {
    const f = (t - fallAt) / 0.55;
    return (
      <Chip
        icon={icon}
        x={interpolate(f, [0, 1], [520, 430])}
        y={interpolate(f * f, [0, 1], [-80, 760])}
        rot={f * 160}
      />
    );
  }
  const s = (t - hitAt) / 0.45;
  if (s >= 1) return null;
  const flash = (t - hitAt) / 0.15;
  return (
    <>
      {whoosh}
      {flash < 1 ? (
        <svg
          width={160}
          height={160}
          style={{ position: "absolute", left: 430 - 80, top: 760 - 80, overflow: "visible" }}
        >
          <g
            transform={`rotate(${flash * 40} 80 80) scale(${0.5 + flash})`}
            style={{ transformOrigin: "80px 80px" }}
            opacity={1 - flash}
          >
            {[0, 60, 120].map((a) => (
              <path
                key={a}
                d="M80 20 L86 74 L140 80 L86 86 L80 140 L74 86 L20 80 L74 74 Z"
                fill="#ffffff"
                transform={`rotate(${a} 80 80)`}
              />
            ))}
          </g>
        </svg>
      ) : null}
      <Chip
      icon={icon}
      x={interpolate(s, [0, 1], [430, -140])}
      y={760 - Math.sin(Math.PI * Math.min(s * 1.4, 1)) * 260 + s * s * 380}
      rot={s * -720}
      opacity={1 - s * 0.4}
      />
    </>
  );
};

/** Stylized GitHub-issue card that drops onto the stage (promoted to a
 * shared prop on its second scene appearance, per the schema plan). */
export const IssueCard: React.FC<{
  inAt: number;
  outAt: number;
  x: number;
  /** Resting top edge after the drop. */
  yRest: number;
  id: string;
  title: string;
  width?: number;
  /** Scale factor for compact appearances (097's overnight drop). */
  size?: number;
}> = ({ inAt, outAt, x, yRest, id, title, width = 560, size = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t < inAt || t > outAt) return null;
  const drop = spring({
    frame: frame - Math.round(inAt * fps),
    fps,
    config: { damping: 11, stiffness: 90 },
  });
  const fade = interpolate(t, [outAt - 0.6, outAt], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: interpolate(drop, [0, 1], [yRest - 560, yRest]),
        width,
        borderRadius: 16,
        border: "2.5px solid #22c55e88",
        background: "rgba(13,20,38,0.95)",
        padding: `${18 * size}px ${24 * size}px`,
        opacity: fade,
        transform: `rotate(${(1 - drop) * -4}deg) scale(${size})`,
        transformOrigin: "top left",
        boxShadow: "0 22px 55px rgba(0,0,0,0.5)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <div style={{ width: 22, height: 22, borderRadius: 11, border: "2.5px solid #22c55e" }} />
        <span style={{ fontFamily: FONTS.mono, fontSize: 24, color: COLORS.textMuted }}>
          {id} · open
        </span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: COLORS.text }}>{title}</div>
    </div>
  );
};
