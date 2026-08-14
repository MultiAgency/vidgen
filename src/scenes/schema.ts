// The declarative scene schema (plan T1). Scenes become JSON-serializable
// data modules (src/scenes/data/NNN.ts) compiled by fromSpec() into the same
// (timings) => SceneBuild contract hand scenes use — coexistence is free.
// Design notes: word anchors resolve via wordTime (unchanged fail-loud);
// ref anchors resolve against other beats topologically; slots replace raw
// x/y and feed the overlap checker; customs are the bespoke escape hatch.
import type { SlotName } from "./stage";

/** Word-anchored time: regex SOURCE string against the voiceover words. */
export type WordAnchor = { word: string; nth?: number; offset?: number };
/** Relative to another beat's resolved `in`. */
export type RefAnchor = { ref: string; offset?: number };
/** Absolute seconds — discouraged; for pre-voice moments only. */
export type AbsAnchor = { at: number };
export type Anchor = WordAnchor | RefAnchor | AbsAnchor;

export type RichLine = {
  text: string;
  mono?: boolean;
  color?: string;
  /** Per-line font size (e.g. mono sub-lines under a title). */
  size?: number;
  /** Extra space above this line (a title/body separator). */
  gap?: number;
  align?: "left" | "center";
  /** Line appears at this anchor (typed-on reveals; the card grows). */
  at?: Anchor;
};

export type CardState = {
  text: RichLine[];
  border?: string;
  /** State becomes active at this anchor (risky→approved flips). */
  at?: Anchor;
};

export type PropSpec =
  | { kind: "card"; states: CardState[]; width?: number; fontSize?: number; lineHeight?: number; sound?: "pop" | "stamp" | "ding" | null }
  | { kind: "chip"; icon: string; size?: number }
  | { kind: "issue"; id: string; title: string; width?: number; size?: number }
  | { kind: "footage"; src: string; clipStart?: number }
  | { kind: "clip"; name: string; playbackRate?: number; loopSeconds?: number; hideMascot?: boolean }
  | { kind: "caught"; icon: string; rest: "shield" | "ground" | "head"; restOffset?: { x: number; y: number }; fromX: number; deliver?: { at: Anchor; to: SlotName } }
  | { kind: "swatted"; icon: string }
  | { kind: "sfx"; name: string; volume?: number }
  | { kind: "custom"; component: string; params?: Record<string, Anchor | string | number | boolean>; claims?: SlotName[] };

export type Beat = {
  id: string;
  in: Anchor;
  /** Required for slot-occupying kinds; sfx and instant props may omit. */
  out?: Anchor;
  slot: SlotName | "none";
  prop: PropSpec;
  /** Editorial why — the load-bearing comment, preserved in data. */
  note?: string;
  /** Intentional adjacency; any use added during migration is reviewed. */
  allowOverlap?: SlotName[];
};

export type SceneSpec = {
  slug: string;
  beats: Beat[];
  cues?: { at: Anchor; kind: "swat" | "hide"; durationSeconds?: number }[];
  camera?: { at: Anchor; scale: number; x?: number; y?: number }[];
  focus?: { from: Anchor; to: Anchor }[];
};
