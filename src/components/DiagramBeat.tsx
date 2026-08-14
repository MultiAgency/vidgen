import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { DiagramNode } from "../posts";
import { COLORS } from "../theme";
import { IconOrEmoji } from "./icons";

// Mid-video cutaway: an animated left-to-right pipeline of the mechanism the
// voiceover is describing. Nodes pop in staggered, connectors draw between
// them, and a pulse dot travels the pipeline while the beat is on screen.
export const DiagramBeat: React.FC<{
  nodes: DiagramNode[];
  accent: string;
  startSeconds: number;
  durationSeconds: number;
}> = ({ nodes, accent, startSeconds, durationSeconds }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps - startSeconds;
  if (t < 0 || t > durationSeconds) return null;

  const enter = spring({
    frame: frame - Math.round(startSeconds * fps),
    fps,
    config: { damping: 15 },
  });
  const exit = interpolate(t, [durationSeconds - 0.5, durationSeconds], [1, 0], {
    extrapolateLeft: "clamp",
  });
  const visible = enter * exit;

  // Pulse dot: repeatedly travels the whole pipeline once every 2.4s,
  // starting after the nodes have landed.
  const pulseT = t > 1.2 ? ((t - 1.2) % 2.4) / 2.4 : 0;

  return (
    <div
      style={{
        opacity: visible,
        transform: `translateY(${interpolate(visible, [0, 1], [24, 0])}px)`,
        background: "rgba(148, 163, 184, 0.07)",
        border: `2px solid ${accent}44`,
        borderRadius: 24,
        padding: "28px 40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        position: "relative",
      }}
    >
      {nodes.map((node, i) => {
        const nodeIn = spring({
          frame: frame - Math.round((startSeconds + 0.25 + i * 0.3) * fps),
          fps,
          config: { damping: 12 },
        });
        return (
          <React.Fragment key={i}>
            {i > 0 ? (
              <div
                style={{
                  width: 56,
                  height: 4,
                  borderRadius: 2,
                  background: `${accent}66`,
                  transform: `scaleX(${nodeIn})`,
                  transformOrigin: "left",
                }}
              />
            ) : null}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                opacity: nodeIn,
                transform: `scale(${interpolate(nodeIn, [0, 1], [0.6, 1])})`,
              }}
            >
              <IconOrEmoji icon={node.icon} size={54} color="#e2e8f0" />
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: COLORS.text,
                  whiteSpace: "nowrap",
                }}
              >
                {node.label}
              </div>
            </div>
          </React.Fragment>
        );
      })}
      {/* Traveling pulse */}
      <div
        style={{
          position: "absolute",
          left: `${interpolate(pulseT, [0, 1], [8, 92])}%`,
          top: -7,
          width: 14,
          height: 14,
          borderRadius: 7,
          background: accent,
          boxShadow: `0 0 18px ${accent}`,
          opacity: pulseT > 0 ? 0.9 * visible : 0,
        }}
      />
    </div>
  );
};
