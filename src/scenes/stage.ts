// The stage: named zones replacing raw x/y in declarative scenes, and the
// reserved bands the overlap checker (and scripts/qa-frames.mjs) enforce.
// Rects derived from the actual coordinates of the converted scenes.
export type Rect = { x: number; y: number; w: number; h: number };

// Widens values to Rect while keeping keys literal (merged custom-claim
// rects must be assignable back to Rect).
const defineSlots = <T extends Record<string, Rect>>(s: T): { [K in keyof T]: Rect } => s;

export const SLOTS = defineSlots({
  /** FootagePanel home: the real-console hero. */
  "hero-panel": { x: 400, y: 110, w: 1280, h: 780 },
  /** Label chips above the hero panel — legal only during focus windows. */
  "surfaces-strip": { x: 400, y: 10, w: 1280, h: 90 },
  "top-right-card": { x: 1340, y: 190, w: 440, h: 220 },
  "center-high": { x: 720, y: 260, w: 480, h: 240 },
  "center-low": { x: 680, y: 560, w: 560, h: 200 },
  "beside-mascot": { x: 760, y: 640, w: 480, h: 160 },
  "chat-bubble": { x: 1080, y: 580, w: 420, h: 280 },
  "stage-right-high": { x: 1080, y: 300, w: 560, h: 240 },
  "door-stage": { x: 980, y: 280, w: 720, h: 480 },
  "stage-right-low": { x: 910, y: 630, w: 600, h: 220 },
  "high-wide": { x: 800, y: 210, w: 700, h: 240 },
  "pipeline-band": { x: 860, y: 620, w: 1000, h: 220 },
  "stage-mid-low": { x: 1130, y: 700, w: 340, h: 170 },
  /** Mascot landmark point-slots — exempt from overlap checking. */
  "mascot-shield": { x: 470, y: 830, w: 60, h: 60 },
  "mascot-ground": { x: 380, y: 990, w: 60, h: 40 },
  "mascot-head": { x: 300, y: 720, w: 60, h: 60 },
  "chat-target": { x: 1260, y: 800, w: 60, h: 60 },
});

export type SlotName = keyof typeof SLOTS;

export const POINT_SLOTS: SlotName[] = ["mascot-shield", "mascot-ground", "mascot-head", "chat-target"];

/** Reserved bands — no scene prop may occupy these (frame QA enforces the
 * same rule on pixels; see scripts/qa-frames.mjs for the calibration). */
export const RESERVED = {
  caption: { x: 0, y: 928, w: 1920, h: 152 },
  rail: { x: 0, y: 60, w: 1920, h: 100 },
  mascot: { x: 80, y: 430, w: 580, h: 630 },
} as const;

export const intersects = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
