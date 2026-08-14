// Shared stage layout constants. MascotPost and the scene landmark system
// (props.tsx MASCOT_BOX) must agree on the mascot's box — they drifted once
// (stage inversion set 0.60 while landmarks still assumed 0.72, skewing every
// AT.* anchor by ~40-60px), hence this single source.
export const MASCOT_HEIGHT_FRAC = 0.6;
export const MASCOT_HEIGHT_FRAC_SQUARE = 0.52;
export const MASCOT_LEFT_FRAC = 0.06;
export const MASCOT_BOTTOM_FRAC = 0.98;
