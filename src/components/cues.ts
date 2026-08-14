/** Word intervals (seconds, composition time) for speech-reactive motion. */
export type SpeechWord = { start: number; end: number };

/** Semantic cue: the mascot performs `kind` at second `at` (composition time).
 * Post renderers consume `hide` (Mascot3D) and `swat` (camera micro-shake);
 * the remaining kinds drive the retired 2D rig, kept only for the dev
 * sampler compositions (MascotSample / ClipSource). */
export type MascotCue = {
  at: number;
  kind: "point" | "shieldUp" | "proud" | "jog" | "doze" | "wake" | "swat" | "pose" | "hide";
  durationSeconds?: number;
  /** Only `pose` (dev rig): sprite name under public/poses/. */
  pose?: string;
};
