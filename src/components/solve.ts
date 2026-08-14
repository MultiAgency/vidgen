import { interpolate, spring } from "remotion";
import { MascotCue, SpeechWord } from "./cues";
import { NATURAL, TUNED_HEIGHT, BLINK_FRAMES, BLINK_PERIOD } from "./mascotRig";
import { ACTIONS, ACTION_DUR, ACTION_PERIOD, envelope, noise, smooth } from "./motion";

export type MascotChannels = {
  scaleFactor: number;
  width: number;
  rootX: number;
  rootY: number;
  rootRot: number; // degrees — the DOM rig rotates; the canvas rig bends
  yaw: number;
  scaleY: number;
  scaleX: number;
  headRot: number;
  headY: number;
  armRot: number;
  shieldRot: number;
  shieldY: number;
  antL: number;
  antR: number;
  bootL: number;
  bootR: number;
  gazeX: number;
  gazeY: number;
  blink: number;
  doze: number;
  glint: number;
  glintCycle: number;
  bobY: number;
  hopY: number;
  driftX: number;
  /** Angular velocity of the sway family (deg/s) — drives jelly wobble. */
  swayVel: number;
  /** Vertical velocity of hop (px/s) — drives landing wobble. */
  hopVel: number;
  /** Vertical velocity of the entrance spring (px/s) — landing settle ripple. */
  enterVel: number;
  /** (Dev rig only) active pose sprite; pose cues hard-swap at the bottom
   * of a squash pulse. */
  pose: string;
  /** 1 while a hide cue holds the rig invisible (clip takeover); eased edges. */
  hide: number;
};

export type SolveArgs = {
  frame: number;
  fps: number;
  height: number;
  enterAt: number;
  talking: boolean;
  speech?: SpeechWord[];
  accents: number[];
  cues?: MascotCue[];
  seed: number;
};

export const solveMascot = ({
  frame,
  fps,
  height,
  enterAt,
  talking,
  speech,
  accents,
  cues,
  seed,
}: SolveArgs): MascotChannels => {
  const scaleFactor = height / NATURAL.height;
  const width = NATURAL.width * scaleFactor;
  const t = frame / fps;
  const px = (v: number) => (v * height) / TUNED_HEIGHT;

  let energy: number;
  if (speech && speech.length > 0) {
    const around = speech.filter((w) => w.end > t - 0.55 && w.start < t + 0.55);
    energy = Math.min(1, around.length / 4);
  } else {
    energy = talking ? 1 : 0;
  }

  let nod = 0;
  for (const a of accents) {
    const local = t - a;
    if (local >= 0 && local < 0.55) {
      nod = Math.max(
        nod,
        Math.sin((local / 0.55) * Math.PI) * (local < 0.18 ? smooth(local / 0.18) : 1),
      );
    }
  }

  const enterSpring = spring({
    frame: frame - enterAt,
    fps,
    config: { damping: 12, stiffness: 90, mass: 0.9 },
  });
  const enterY = interpolate(enterSpring, [0, 1], [height * 0.4, 0]);
  const enterPrev = spring({
    frame: frame - 2 - enterAt,
    fps,
    config: { damping: 12, stiffness: 90, mass: 0.9 },
  });
  const enterVel =
    (interpolate(enterPrev, [0, 1], [height * 0.4, 0]) - enterY) / (2 / fps);

  const amp = px(6 + energy * 6);
  const bobY = noise(t, 0.5 + energy * 0.3, seed) * amp;
  const driftX = noise(t, 0.23, seed + 11) * px(3.5 + energy * 2);
  const swayBase = (tt: number) => noise(tt, 0.2, seed + 23) * (1.2 + energy * 0.6);
  const sway = swayBase(t);
  const breath = 1 + Math.sin(t * Math.PI * 2 * 0.18 + seed) * 0.005;
  const yaw = noise(t, 0.11, seed + 37) * 2.2;

  const hopAt = (tt: number) => {
    const trigger = speech
      ? accents.find((a) => tt - a >= 0 && tt - a < 1.0 && accents.indexOf(a) % 3 === 0)
      : talking
        ? Math.floor(tt / 6) * 6
        : undefined;
    let y = 0;
    let sy = 1;
    if (trigger !== undefined) {
      const c = (tt - trigger) * fps;
      if (c >= 0 && c < 7) {
        const p = c / 7;
        y = Math.sin(Math.PI * p) * px(6);
        sy = 1 - Math.sin(Math.PI * p) * 0.045;
      } else if (c < 23) {
        const p = (c - 7) / 16;
        y = -Math.sin(Math.PI * p) * px(24);
        sy = 1 + Math.sin(Math.PI * p) * 0.05;
      } else if (c < 30) {
        const p = (c - 23) / 7;
        sy = 1 - Math.sin(Math.PI * p) * 0.05;
      }
    }
    return { y, sy };
  };
  const hop = hopAt(t);
  const hopPrev = hopAt(t - 0.08);
  let hopY = hop.y;
  let hopScaleY = hop.sy;
  const hopVel = (hop.y - hopPrev.y) / 0.08;

  const slot = Math.floor(t / ACTION_PERIOD);
  const action = ACTIONS[(slot + seed) % ACTIONS.length];
  const actionLocal = t - (slot * ACTION_PERIOD + ACTION_PERIOD * 0.55);
  const act = envelope(actionLocal, 0.35, ACTION_DUR * 0.35, 0.55);

  const lagged = (delay: number) => noise(t - delay, 0.2, seed + 23);
  let headRot = -0.6 * lagged(0.12) * (0.9 + energy * 0.7) - nod * 2.2;
  let headY = nod * px(7);
  let armRot =
    0.9 * lagged(0.22) * (0.9 + energy * 0.7) +
    energy * Math.sin(t * Math.PI * 2 * 0.85) * 0.3;
  let shieldRot = 0.45 * lagged(0.3);

  if (action === "twirl") armRot += act * Math.sin(actionLocal * Math.PI * 2 * 1.2) * 2.2;
  if (action === "shieldBump") shieldRot += act * -3.2;
  if (action === "headTilt") headRot += act * 3.4;
  if (action === "doubleNod")
    headY += act * Math.abs(Math.sin(actionLocal * Math.PI * 2 * 1.5)) * px(9);

  let shieldY = 0;
  let proud = 0;
  let leanRot = 0;
  let leanX = 0;
  let jog = 0;
  let jogPhase = 0;
  let doze = 0;
  let wakeKick = 0;
  let pointBias = 0;
  let hide = 0;
  if (cues) {
    for (const cue of cues) {
      const local = t - cue.at;
      if (cue.kind === "pose") continue; // resolved in the pose track below
      if (cue.kind === "hide") {
        const dur = cue.durationSeconds ?? 2;
        if (local >= 0 && local <= dur) {
          hide = Math.max(hide, envelope(local, 0.27, dur - 0.54, 0.27));
        }
        continue;
      }
      if (cue.kind === "doze") {
        const dur = cue.durationSeconds ?? 4;
        if (local >= 0 && local <= dur) {
          doze = Math.max(doze, envelope(local, 0.7, dur - 1.0, 0.3));
        }
        continue;
      }
      if (cue.kind === "wake") {
        if (local >= 0 && local < 0.9) {
          if (local < 0.35) wakeKick = -Math.sin((Math.PI * local) / 0.35) * px(18);
          headRot += Math.sin(local * 26) * 2.2 * (1 - local / 0.9);
        }
        continue;
      }
      if (cue.kind === "swat") {
        if (local >= 0 && local < 0.7) {
          const e = Math.sin((Math.PI * local) / 0.7);
          armRot += e * 3.5;
          leanX -= e * px(9);
          leanRot -= e * 1.2;
        }
        continue;
      }
      if (cue.kind === "jog") {
        if (local >= 0 && local <= 3.4) {
          jog = Math.max(jog, envelope(local, 0.4, 2.2, 0.7));
          jogPhase = local * Math.PI * 2 * 2.4;
        }
        continue;
      }
      if (local < 0 || local > 2.6) continue;
      const e = envelope(local, 0.3, 1.2, 0.9);
      if (cue.kind === "point") {
        leanRot += e * 1.6;
        leanX += e * px(12);
        armRot += e * 2;
        headRot += e * 1.2;
        pointBias = Math.max(pointBias, e);
      } else if (cue.kind === "shieldUp") {
        shieldRot += e * -2;
        shieldY = Math.min(shieldY, -e * px(6));
      } else {
        proud = Math.max(proud, e);
      }
    }
  }
  headRot -= proud * 1.8;
  headY -= proud * px(5);
  headRot += doze * 5;
  headY += doze * px(7);

  const jogBounce = jog * Math.abs(Math.sin(jogPhase)) * -px(9);
  leanRot += jog * 1.8;
  armRot += jog * Math.sin(jogPhase) * 3;
  shieldRot += jog * Math.sin(jogPhase + Math.PI) * 1.4;
  headY += jog * Math.abs(Math.sin(jogPhase + 0.5)) * -px(3);
  const bootLift = (phase: number) => jog * Math.max(0, Math.sin(phase)) * px(16);
  const bootL = bootLift(jogPhase);
  const bootR = bootLift(jogPhase + Math.PI);

  const GAZE = [
    [5, 0], [0, 0], [6, -2], [2, 1], [5.5, 1.5], [0, 0], [4, -1],
  ] as const;
  const gazeHold = 2.6 - (1 - energy) * 0.9;
  // Positive modulo: motion-blur sub-frame samples evaluate the solve at
  // slightly negative times around frame 0, where a JS % goes negative.
  const gi =
    ((Math.floor(t / gazeHold + seed) % GAZE.length) + GAZE.length) % GAZE.length;
  const prevG = GAZE[(gi + GAZE.length - 1) % GAZE.length];
  const nextG = GAZE[gi];
  const dart = smooth(((t / gazeHold + seed) % 1) / 0.07);
  // Point cues pull the gaze toward the presented content.
  const gazeX =
    ((prevG[0] + (nextG[0] - prevG[0]) * dart) + pointBias * 4) * scaleFactor * 2;
  const gazeY = (prevG[1] + (nextG[1] - prevG[1]) * dart) * scaleFactor * 2;

  const headDriver = (tt: number) =>
    -0.6 * noise(tt - 0.12, 0.2, seed + 23) +
    noise(tt, 0.5 + energy * 0.3, seed) * amp * 0.06 +
    noise(tt, 0.2, seed + 23) * 0.9;
  const headVel = (headDriver(t) - headDriver(t - 0.1)) / 0.1;
  const antKick = (hopY / px(1)) * -0.22;
  const clampDeg = (v: number) => Math.max(-10, Math.min(10, v));
  const antL =
    clampDeg(-headVel * 0.55 + antKick) + noise(t, 1.15, seed + 5) * 1.4 + nod * 3;
  const antR =
    clampDeg(-headVel * 0.65 + antKick) + noise(t, 1.3, seed + 9) * 1.4 + nod * 3.4;

  const blinkPhase = (((frame + seed * 37) % BLINK_PERIOD) + BLINK_PERIOD) % BLINK_PERIOD;
  const blink =
    blinkPhase < BLINK_FRAMES ? Math.sin((Math.PI * blinkPhase) / BLINK_FRAMES) : 0;
  const glintCycle = (((frame + seed * 17) % (4 * fps)) + 4 * fps) % (4 * fps);
  const glint = glintCycle < 18 ? Math.sin((Math.PI * glintCycle) / 18) : 0;

  // ── pose track ────────────────────────────────────────────────────────────
  // Pose cues form a timeline; each fires a squash pulse and the sprite
  // hard-swaps at the bottom of the dip, where the motion masks the cut.
  const POSE_PULSE = 0.36;
  let pose = "neutral";
  let posePulse = 0;
  if (cues) {
    const events: { at: number; pose: string }[] = [];
    for (const c of cues) {
      if (c.kind !== "pose") continue;
      events.push({ at: c.at, pose: c.pose ?? "neutral" });
      if (c.durationSeconds !== undefined) {
        events.push({ at: c.at + c.durationSeconds, pose: "neutral" });
      }
    }
    events.sort((a, b) => a.at - b.at);
    for (const ev of events) {
      const local = t - ev.at;
      if (local >= 0 && local < POSE_PULSE) {
        posePulse = Math.max(posePulse, Math.sin((local / POSE_PULSE) * Math.PI));
      }
      if (local >= POSE_PULSE * 0.5) pose = ev.pose;
    }
  }
  const swayVel = (swayBase(t) - swayBase(t - 0.08)) / 0.08;
  const scaleYTotal =
    breath * hopScaleY * (1 + proud * 0.012) * (1 - posePulse * 0.06);

  return {
    scaleFactor,
    width,
    rootX: driftX + leanX,
    rootY: enterY + bobY * (1 - 0.75 * doze) + hopY * (1 - doze) + jogBounce + wakeKick,
    rootRot: sway + leanRot,
    yaw,
    scaleY: scaleYTotal,
    scaleX: 2 - breath * hopScaleY,
    headRot,
    headY,
    armRot,
    shieldRot,
    shieldY,
    antL,
    antR,
    bootL,
    bootR,
    gazeX,
    gazeY,
    blink,
    doze,
    glint,
    glintCycle,
    bobY,
    hopY,
    driftX,
    swayVel,
    hopVel,
    enterVel,
    pose,
    hide,
  };
};
