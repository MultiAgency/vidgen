import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { Background } from "./components/Background";
import { CanvasMascot } from "./components/CanvasMascot";
import { COLORS, FONTS } from "./theme";

// Animation-rig sampler: entrance, idle-vs-talking comparison, and a detail
// close-up, with the tunable parameters printed on screen. Not a post — a
// style-review artifact for the retired 2D warp rig (CanvasMascot).

const ACCENT = "#60a5fa";

// Synthetic speech pattern for the sampler: sentence bursts with pauses, so
// the speech-reactive channels (energy, nods, hops) are visible without audio.
const SPEECH_DEMO = Array.from({ length: 60 }, (_, i) => {
  const sentence = Math.floor(i / 8);
  const inSentence = i % 8;
  const start = sentence * 3.0 + inSentence * 0.32;
  return { start, end: start + 0.26 };
});

const Label: React.FC<{ title: string; params: string[] }> = ({ title, params }) => (
  <div style={{ position: "absolute", top: 60, left: 0, right: 0, textAlign: "center" }}>
    <div style={{ fontSize: 72, fontWeight: 900, color: COLORS.text }}>{title}</div>
    <div
      style={{
        fontFamily: FONTS.mono,
        fontSize: 30,
        color: COLORS.textMuted,
        marginTop: 16,
        lineHeight: 1.6,
      }}
    >
      {params.map((p) => (
        <div key={p}>{p}</div>
      ))}
    </div>
  </div>
);

const Caption: React.FC<{ text: string; x: string }> = ({ text, x }) => (
  <div
    style={{
      position: "absolute",
      bottom: 70,
      left: x,
      width: 500,
      textAlign: "center",
      fontSize: 40,
      fontWeight: 800,
      color: ACCENT,
    }}
  >
    {text}
  </div>
);

export const MascotSample: React.FC = () => {
  const { fps, height, width } = useVideoConfig();
  return (
    <AbsoluteFill style={{ fontFamily: FONTS.sans }}>
      <Background accent={ACCENT} />

      {/* Chapter 1: entrance spring */}
      <Sequence durationInFrames={4 * fps}>
        <Label
          title="Entrance"
          params={["spring(damping 12, stiffness 90, mass 0.9)", "drop-in from 40% height"]}
        />
        <div style={{ position: "absolute", bottom: height * 0.04, left: (width - 570) / 2 }}>
          <CanvasMascot
            height={height * 0.68}
            enterAt={Math.round(0.4 * fps)}
            talking={false}
            cues={[
              { at: 1.6, kind: "proud" },
              { at: 2.7, kind: "point" },
            ]}
          />
        </div>
      </Sequence>

      {/* Chapter 2: idle vs talking, side by side */}
      <Sequence from={4 * fps} durationInFrames={9 * fps}>
        <Label
          title="Idle vs Speaking"
          params={[
            "one intact sprite · continuous strip warp (no parts, no seams)",
            "noise-driven drift (never repeats) · speech-reactive: nods on sentence starts",
            "bend sway · head shear · belly-bulge squash · impact ripple",
          ]}
        />
        <div style={{ position: "absolute", bottom: height * 0.06, left: width * 0.17 }}>
          <CanvasMascot height={height * 0.58} enterAt={-100} talking={false} seed={0} />
        </div>
        <div style={{ position: "absolute", bottom: height * 0.06, right: width * 0.17 }}>
          <CanvasMascot
            height={height * 0.58}
            enterAt={-100}
            seed={3}
            speech={SPEECH_DEMO}
            cues={[
              { at: 1.5, kind: "point" },
              { at: 4.2, kind: "jog" },
              { at: 8.0, kind: "proud" },
            ]}
          />
        </div>
        <Caption text="idle" x="14%" />
        <Caption text="speaking" x="60%" />
      </Sequence>

      {/* Chapter 3: detail close-up — blink and glint cadence */}
      <Sequence from={13 * fps} durationInFrames={9 * fps}>
        <Label
          title="Details"
          params={["blink: lids sweep 7 frames", "sword glint: 18 frames every 4s, rotating star"]}
        />
        {/* Oversized so the face and sword-glint region fill the frame */}
        <div
          style={{
            position: "absolute",
            top: height * 0.02,
            left: (width - 1024 * ((height * 1.2) / 1536)) / 2,
          }}
        >
          <CanvasMascot height={height * 1.2} enterAt={-100} seed={1} speech={SPEECH_DEMO} />
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};
