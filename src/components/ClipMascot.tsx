import React from "react";
import { Loop, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

// Plays a generated mascot animation clip (transparent webm from
// `npm run clips`). Pair with a {kind:"hide", at, durationSeconds} cue so
// the standing Mascot3D idle cross-fades out: its 0.27s hide ease matches
// the clip's edge fades here.
type Props = {
  /** Clip name — public/clips/<name>.webm */
  name: string;
  /** Composition seconds the clip starts. */
  at: number;
  durationSeconds: number;
  /** Default geometry = the standing mascot box (left stage). */
  x?: number;
  y?: number;
  height?: number;
  /** Aspect of the keyed clip frame (default: the 920×720 segment crop). */
  aspect?: number;
  /** Slow a short clip to cover a longer window (0.6 = 60% speed). */
  playbackRate?: number;
  /** Loop the clip for the whole window: the media length in seconds of the
   * -loop (ping-pong) variant from `npm run clips`, whose seam is invisible. */
  loopSeconds?: number;
};

export const ClipMascot: React.FC<Props> = ({
  name,
  at,
  durationSeconds,
  x = -20,
  y = 230,
  height = 900,
  aspect = 920 / 720,
  playbackRate = 1,
  loopSeconds,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const edge = 0.27;
  const fade = Math.min(
    1,
    Math.max(0, (t - at) / edge),
    Math.max(0, (at + durationSeconds - t) / edge),
  );
  const video = (
    <OffthreadVideo
      src={staticFile(`clips/${name}.webm`)}
      transparent
      muted
      playbackRate={playbackRate}
      style={{
        position: "absolute",
        left: x,
        top: y,
        height,
        width: height * aspect,
        objectFit: "contain",
        opacity: fade,
      }}
    />
  );
  return (
    <Sequence from={Math.round(at * fps)} durationInFrames={Math.round(durationSeconds * fps)}>
      {loopSeconds ? (
        <Loop durationInFrames={Math.max(1, Math.round((loopSeconds / playbackRate) * fps))}>
          {video}
        </Loop>
      ) : (
        video
      )}
    </Sequence>
  );
};
