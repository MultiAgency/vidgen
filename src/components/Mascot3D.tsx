import React from "react";
import { interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Loop, OffthreadVideo } from "remotion";
import { MascotCue } from "./cues";
import { envelope } from "./motion";

// The mascot IS the generated 3D figurine (user style verdict: 2D warp
// retired). Standing presence is the ping-pong idle loop; scenes take over
// with their own ClipMascot windows via {kind:"hide"} cues, exactly as they
// did with the rig. Entrance is a rise-in until a walk clip exists.
const IDLE_LOOP_SECONDS = 4.0;
const CLIP_ASPECT = 920 / 720;

type Props = {
  /** Display height of the mascot box (the clip frame renders ~18% taller —
   * the figurine occupies ~85% of its frame). */
  height: number;
  enterAt?: number;
  cues?: MascotCue[];
};

export const Mascot3D: React.FC<Props> = ({ height, enterAt = 0, cues }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  let hide = 0;
  if (cues) {
    for (const cue of cues) {
      if (cue.kind !== "hide") continue;
      const local = t - cue.at;
      const dur = cue.durationSeconds ?? 2;
      if (local >= 0 && local <= dur) {
        hide = Math.max(hide, envelope(local, 0.27, dur - 0.54, 0.27));
      }
    }
  }

  const enter = spring({
    frame: frame - enterAt,
    fps,
    config: { damping: 13, stiffness: 80, mass: 0.9 },
  });
  const clipHeight = height * 1.18;
  return (
    <div
      style={{
        width: (height * 1024) / 1536,
        height,
        position: "relative",
        opacity: Math.min(enter, 1 - hide),
        transform: `translateY(${interpolate(enter, [0, 1], [height * 0.12, 0])}px)`,
      }}
    >
      <Loop durationInFrames={Math.max(1, Math.round(IDLE_LOOP_SECONDS * fps))}>
        <OffthreadVideo
          src={staticFile("clips/idle-loop.webm")}
          transparent
          muted
          style={{
            position: "absolute",
            left: -height * 0.30,
            bottom: -height * 0.04,
            height: clipHeight,
            width: clipHeight * CLIP_ASPECT,
            objectFit: "contain",
          }}
        />
      </Loop>
    </div>
  );
};
