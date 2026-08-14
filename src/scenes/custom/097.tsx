import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../../theme";
import { CustomRegistry } from "../fromSpec";
import { AT } from "../props";

// Bespoke visuals for 097 — the two pieces the schema shouldn't absorb:
// the digest bubble that assembles as icons arrive, and the sleep particles.

const DigestBubble: React.FC<{
  in: number;
  out: number;
  slot: { x: number; y: number; w: number; h: number };
  params: Record<string, number | string | boolean>;
  times: Record<string, number>;
}> = ({ in: tIn, out: tOut, slot, params }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const pop = spring({ frame: frame - Math.round(tIn * fps), fps, config: { damping: 13 } });
  const arrivals = [0, 0.3, 0.7].map((d) => (params.deliver as number) + d);
  const pulse = arrivals.reduce((acc, a) => {
    const local = t - a - 0.5;
    return local > 0 && local < 0.25 ? Math.sin((Math.PI * local) / 0.25) * 0.1 : acc;
  }, 0);
  const confirmAt = (i: number) => arrivals[i] + 0.55;
  return (
    <div
      style={{
        position: "absolute",
        left: slot.x,
        top: slot.y,
        width: slot.w,
        padding: "18px 0",
        textAlign: "center",
        borderRadius: "26px 26px 26px 6px",
        border: `3px solid ${COLORS.primaryLight}88`,
        background: "rgba(96, 165, 250, 0.12)",
        transform: `scale(${pop * (1 + pulse) * (t > tOut - 0.8 ? Math.max(0, 1 - (t - (tOut - 0.8)) / 0.8) : 1)})`,
        fontSize: 40,
        fontWeight: 800,
        color: COLORS.text,
      }}
    >
      💬 your chat
      <div
        style={{
          fontSize: 23,
          fontWeight: 600,
          color: COLORS.textMuted,
          marginTop: 8,
          textAlign: "left",
          paddingLeft: 26,
          lineHeight: 1.6,
        }}
      >
        {[
          ["🐛 #347 · needs triage", confirmAt(0)],
          ["🔀 PR #98 · ready to merge", confirmAt(1)],
          ["💬 1 review reply", confirmAt(2)],
        ].map(([line, at], i) => (
          <div key={i} style={{ opacity: t > (at as number) ? 1 : 0.15 }}>
            {t > (at as number) ? (line as string) : "· · ·"}
          </div>
        ))}
      </div>
    </div>
  );
};

const Zzz: React.FC<{ in: number; out: number }> = ({ in: tIn, out: tOut }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t < tIn || t > tOut) return null;
  return (
    <>
      {[0, 1, 2].map((i) => {
        const phase = (t * 0.55 + i * 0.33) % 1;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: AT.head.x + 70 + phase * 50 + i * 10,
              top: AT.head.y - 130 - phase * 130,
              fontSize: 34 + i * 14,
              fontWeight: 800,
              color: COLORS.textMuted,
              opacity: Math.sin(Math.PI * phase) * 0.8,
              transform: `rotate(${-12 + i * 8}deg)`,
            }}
          >
            z
          </div>
        );
      })}
    </>
  );
};

export const CUSTOM_097: CustomRegistry = {
  DigestBubble,
  Zzz,
};
