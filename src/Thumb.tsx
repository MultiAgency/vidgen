import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { Background } from "./components/Background";
import { COLORS, FONTS } from "./theme";

// Platform thumbnails (1280×720), composed from kit assets so type, color,
// and mascot match the videos they front. One layout, per-video config.

export type ThumbSpec = {
  /** Big line, 3–5 words, the click argument — not the title. */
  hook: string;
  /** Accent-colored word(s) within the hook (exact substring). */
  pop: string;
  accent: string;
  /** Thumb-art frame name (public/thumb-art, extracted from the 3D clips). */
  pose: string;
  /** Small kicker above the hook. */
  kicker: string;
};

export const THUMBS: Record<string, ThumbSpec> = {
  "104-dev-workflow": {
    hook: "Install to Autopilot",
    pop: "Autopilot",
    accent: "#f43f5e",
    pose: "celebrate",
    kicker: "THE REAL DEV WORKFLOW",
  },
  "097-github-notifications": {
    hook: "Never miss an issue",
    pop: "issue",
    accent: "#fb923c",
    pose: "doze",
    kicker: "GITHUB → YOUR CHAT",
  },
  "108-architecture-reborn": {
    hook: "Authority flows down",
    pop: "Authority",
    accent: "#06b6d4",
    pose: "neutral",
    kicker: "THE ARCHITECTURE, FROM SOURCE",
  },
  "107-why-tee": {
    hook: "Your agent needs a TEE",
    pop: "TEE",
    accent: "#a78bfa",
    pose: "point",
    kicker: "HARDWARE-ENFORCED PRIVACY",
  },
};

// Thumb art comes from the 3D clip frames (public/thumb-art, extracted by
// ffmpeg from the keyed webms) — the 2D art is retired from thumbnails too.
const ART = { neutral: "idle", celebrate: "celebrate", doze: "doze", point: "point" } as const;
const poseSrc = (pose: string) =>
  staticFile(`thumb-art/${ART[pose as keyof typeof ART] ?? "idle"}.png`);

export const Thumb: React.FC<{ spec: ThumbSpec }> = ({ spec }) => {
  const [before, after] = spec.hook.split(spec.pop);
  return (
    <AbsoluteFill style={{ fontFamily: FONTS.sans }}>
      <Background accent={spec.accent} />
      <Img
        src={poseSrc(spec.pose)}
        style={{
          position: "absolute",
          right: -30,
          bottom: -40,
          height: 620,
          filter: "drop-shadow(0 24px 48px rgba(0,0,0,0.5))",
        }}
      />
      <div style={{ position: "absolute", left: 64, top: 130, width: 780 }}>
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: COLORS.textMuted,
            marginBottom: 18,
          }}
        >
          {spec.kicker}
        </div>
        <div
          style={{
            fontSize: 110,
            fontWeight: 900,
            lineHeight: 1.04,
            color: COLORS.text,
            textShadow: "0 6px 30px rgba(0,0,0,0.55)",
          }}
        >
          {before}
          <span style={{ color: spec.accent }}>{spec.pop}</span>
          {after}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 64,
          bottom: 44,
          display: "flex",
          alignItems: "center",
          gap: 22,
          fontSize: 34,
          fontWeight: 800,
          color: COLORS.text,
          opacity: 0.92,
        }}
      >
        <span>
          Iron<span style={{ color: spec.accent }}>Claw</span>
        </span>
        <span style={{ opacity: 0.55, fontWeight: 400 }}>·</span>
        <Img src={staticFile("brand/nearai-primary.png")} style={{ height: 36 }} />
      </div>
      {/* Corner vignette so the frame reads at feed size */}
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse 90% 85% at 45% 45%, transparent 60%, rgba(2,6,17,0.45) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
