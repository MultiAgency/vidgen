import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";

// Static grain texture (SVG turbulence rendered once as a data URI) so the
// background has tooth without per-frame filter cost. Also reused as the
// animated film-grain grade layer in MascotPost.
export const GRAIN = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='7'/><feColorMatrix type='saturate' values='0'/></filter><rect width='240' height='240' filter='url(%23n)' opacity='0.5'/></svg>`,
)}")`;

export const Background: React.FC<{ accent: string }> = ({ accent }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const drift = Math.sin(t * 0.15) * 60;
  const drift2 = Math.cos(t * 0.11) * 40;

  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, #111c33 0%, ${COLORS.bg} 45%, #0a1122 100%)` }}>
      {/* drifting grid, slightly parallaxed */}
      <div
        style={{
          position: "absolute",
          inset: -100,
          backgroundImage: `linear-gradient(${COLORS.border}22 1px, transparent 1px), linear-gradient(90deg, ${COLORS.border}22 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
          transform: `translate(${drift2 * 0.3}px, ${drift * 0.15}px)`,
        }}
      />
      {/* color depth: primary glow low-left, accent glow high-right, accent floor wash */}
      <div
        style={{
          position: "absolute",
          width: width * 0.6,
          height: width * 0.6,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.primary}30, transparent 65%)`,
          left: -width * 0.15 + drift,
          top: height * 0.25,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: width * 0.5,
          height: width * 0.5,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accent}26, transparent 65%)`,
          right: -width * 0.1 - drift,
          top: -height * 0.15,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: -height * 0.35,
          height: height * 0.7,
          background: `radial-gradient(ellipse at 50% 100%, ${accent}14, transparent 60%)`,
        }}
      />
      {/* grain + vignette */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: GRAIN, opacity: 0.05 }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at 50% 42%, transparent 55%, rgba(2,6,16,0.55) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
