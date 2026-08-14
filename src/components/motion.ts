// Motion core shared by the mascot rig and scene choreography.

// Band-limited pseudo-noise: three sines at irrational frequency ratios never
// visibly repeat. Deterministic in t, so renders are reproducible.
export const noise = (t: number, f: number, phase: number) =>
  Math.sin(t * Math.PI * 2 * f + phase) * 0.55 +
  Math.sin(t * Math.PI * 2 * f * 1.618 + phase * 2.7) * 0.3 +
  Math.sin(t * Math.PI * 2 * f * 0.382 + phase * 5.1) * 0.15;

export const smooth = (x: number) => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};

// Envelope for a scheduled gesture: 0 → 1 → 0 with eased shoulders.
export const envelope = (
  local: number,
  attack: number,
  hold: number,
  release: number,
) => {
  if (local < 0) return 0;
  if (local < attack) return smooth(local / attack);
  if (local < attack + hold) return 1;
  return 1 - smooth((local - attack - hold) / release);
};

// Ambient micro-behaviors, one every ~7s, deterministically sequenced by seed.
export const ACTIONS = ["twirl", "shieldBump", "headTilt", "doubleNod"] as const;
export const ACTION_PERIOD = 7; // seconds
export const ACTION_DUR = 1.6;
