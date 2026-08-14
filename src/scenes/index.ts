import { MascotCue } from "../components/cues";
import { Timings } from "../posts";
import { buildScene001 } from "./Scene001";
import { CUSTOM_097 } from "./custom/097";
import { scene097 } from "./data/097";
import { fromSpec } from "./fromSpec";
import { buildScene098 } from "./Scene098";
import { buildScene099 } from "./Scene099";
import { buildScene100 } from "./Scene100";
import { buildScene101 } from "./Scene101";
import { buildScene102 } from "./Scene102";
import { buildScene103 } from "./Scene103";
import { buildScene104 } from "./Scene104";
import { buildScene106 } from "./Scene106";
import { buildScene107 } from "./Scene107";
import { buildScene108 } from "./Scene108";

// A scene turns a post's word timings into an authored performance: gesture
// cues for the mascot plus a prop overlay. Beats are derived from the words
// (see wordTime in props.tsx), so re-voicing a script re-anchors the scene.
export type CameraKey = { at: number; scale: number; x?: number; y?: number };
/** Demo-focus window: the product footage owns the frame — the title/rail
 * fade, captions drop to a lower third, and the mascot shrinks to a corner
 * commentator. */
export type FocusWindow = { from: number; to: number };
export type SceneBuild = {
  cues: MascotCue[];
  Overlay: React.FC;
  /** Optional camera keyframes; MascotPost eases between them (~8 frames). */
  camera?: CameraKey[];
  focus?: FocusWindow[];
};

export const SCENES: Record<string, (timings: Timings) => SceneBuild> = {
  "001-meet-ironclaw": buildScene001,
  "097-github-notifications": fromSpec(scene097, CUSTOM_097),
  "098-pr-review-digest": buildScene098,
  "099-alert-diagnostics": buildScene099,
  "100-bug-bounty-triage": buildScene100,
  "101-safe-server-commands": buildScene101,
  "102-release-tag-fanout": buildScene102,
  "103-explain-any-codebase": buildScene103,
  "104-dev-workflow": buildScene104,
  "106-skills-tools-use-cases": buildScene106,
  "107-why-tee": buildScene107,
  "108-architecture-reborn": buildScene108,
};
