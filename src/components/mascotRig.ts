// The artwork contract for the RETIRED 2D rig (kept for the dev sampler
// compositions only): natural dimensions of public/mascot.png and measured
// face-feature positions used by CanvasMascot's overlays.

export const NATURAL = { width: 1024, height: 1536 };

export const EYES = [
  { cx: 415, cy: 852, rx: 44, ry: 46 }, // left
  { cx: 588, cy: 858, rx: 40, ry: 44 }, // right
];

// The painted specular highlights inside each black eye orb. Gaze is shown by
// re-drawing these procedurally and letting them drift — the orbs stay put.
export const HIGHLIGHTS = [
  [{ x: 415, y: 838, r: 12 }, { x: 394, y: 866, r: 5 }], // left eye: big, small
  [{ x: 584, y: 845, r: 12 }, { x: 571, y: 873, r: 5.5 }], // right eye
];

export const SWORD_TIP = { cx: 152, cy: 60 };

export const BLINK_PERIOD = 108; // frames between blinks (~3.6s at 30fps)
export const BLINK_FRAMES = 7;

/** Height (px) of the mascot at the 16:9 post layout, where all motion
 * amplitudes were tuned. Other sizes scale relative to this. */
export const TUNED_HEIGHT = 1080 * 0.72;

