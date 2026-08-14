import React from "react";
import {
  Audio,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { WalkthroughCard, WalkthroughStep } from "../posts";
import { COLORS, FONTS } from "../theme";

// Step rail: numbered chips that light up as the voiceover reaches each step.
export const StepRail: React.FC<{ steps: WalkthroughStep[]; accent: string }> = ({
  steps,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
      {steps.map((step, i) => {
        const active = t >= step.at && (i === steps.length - 1 || t < steps[i + 1].at);
        const reached = t >= step.at;
        // Cascade in one at a time at the open — the first motion the
        // viewer sees, instead of six chips waiting statically (plan W4).
        const enter = spring({
          frame: frame - Math.round((0.35 + i * 0.14) * fps),
          fps,
          config: { damping: 13 },
        });
        const pop = spring({
          frame: frame - Math.round(step.at * fps),
          fps,
          config: { damping: 12 },
        });
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 22px",
              borderRadius: 999,
              border: `2px solid ${reached ? accent : COLORS.border}`,
              background: active ? `${accent}22` : "transparent",
              transform: `scale(${(reached ? interpolate(pop, [0, 1], [1, 1.06]) : 1) * interpolate(enter, [0, 1], [0.6, 1])})`,
              opacity: (reached ? 1 : 0.45) * enter,
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                background: reached ? accent : COLORS.border,
                color: COLORS.bg,
                fontSize: 19,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {i + 1}
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: COLORS.text }}>
              {step.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Timed card: a terminal (code) or chat-bubble panel shown during its window,
// with a typing reveal for code and a slide-in for chat.
export const TimedCard: React.FC<{ card: WalkthroughCard; accent: string }> = ({
  card,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps - card.at;
  if (t < 0 || t > card.duration) return null;

  const enter = spring({
    frame: frame - Math.round(card.at * fps),
    fps,
    config: { damping: 14 },
  });
  const exit = interpolate(t, [card.duration - 0.5, card.duration], [1, 0], {
    extrapolateLeft: "clamp",
  });
  const visible = enter * exit;

  if (card.type === "code") {
    const shown = Math.floor(interpolate(t, [0.3, 2.2], [0, card.text.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }));
    return (
      <>
      <Sequence from={Math.round((card.at + 0.25) * fps)} durationInFrames={Math.round(2.4 * fps)}>
        <Audio src={staticFile("audio/sfx/typing.wav")} volume={0.22} />
      </Sequence>
      <div
        style={{
          opacity: visible,
          transform: `translateY(${interpolate(visible, [0, 1], [24, 0])}px)`,
          background: "#0b1120",
          border: `2px solid ${COLORS.border}`,
          borderRadius: 18,
          padding: "26px 34px",
          minWidth: 900,
          boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
        }}
      >
        <div style={{ display: "flex", gap: 9, marginBottom: 18 }}>
          {["#f87171", "#fbbf24", "#34d399"].map((c) => (
            <div key={c} style={{ width: 16, height: 16, borderRadius: 8, background: c }} />
          ))}
        </div>
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 34,
            lineHeight: 1.6,
            color: COLORS.text,
            whiteSpace: "pre-wrap",
          }}
        >
          {card.lineAt
            ? card.text.split("\n").map((ln, i) => {
                const lt = t - (card.lineAt![i] ?? 0);
                const chars =
                  lt < 0
                    ? 0
                    : Math.floor(
                        interpolate(lt, [0, 0.45], [0, ln.length], {
                          extrapolateLeft: "clamp",
                          extrapolateRight: "clamp",
                        }),
                      );
                const isCurrent =
                  lt >= 0 && (i === card.lineAt!.length - 1 || t < card.lineAt![i + 1]);
                return (
                  // Height is reserved before reveal so the card never reflows.
                  <div key={i} style={{ opacity: lt < 0 ? 0 : 1 }}>
                    {ln.slice(0, chars) || " "}
                    {isCurrent ? <span style={{ color: accent }}>▍</span> : null}
                  </div>
                );
              })
            : (
              <>
                {card.text.slice(0, shown)}
                <span style={{ color: accent }}>▍</span>
              </>
            )}
        </div>
      </div>
      </>
    );
  }

  return null;
};
