import React from "react";
import { AbsoluteFill } from "remotion";
import { CanvasMascot } from "./components/CanvasMascot";

// Dev utility: the procedural rig on the generation prompt's flat background
// (#0f172a). Rendering a few seconds of this produces a stand-in "generated
// clip" for exercising the chroma-key intake (npm run clips) and ClipMascot
// compositing without spending a Veo generation.
export const ClipSource: React.FC = () => (
  <AbsoluteFill style={{ background: "#0f172a" }}>
    <div style={{ position: "absolute", bottom: 40, left: (1920 - 540) / 2 }}>
      <CanvasMascot height={840} enterAt={-100} talking={false} seed={5} />
    </div>
  </AbsoluteFill>
);
