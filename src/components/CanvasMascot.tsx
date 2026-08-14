import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  cancelRender,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { MascotCue, SpeechWord } from "./cues";
import { EYES, HIGHLIGHTS, SWORD_TIP } from "./mascotRig";
import { smooth } from "./motion";
import { solveMascot } from "./solve";

// Seamless deformation renderer. The character is ONE intact sprite — never
// cut into parts, so seams are impossible by construction. All motion is a
// continuous strip warp of the whole image: root bend for sway/lean, an extra
// head-weighted shear for head turns, vertical compression for nods, belly
// bulge for squash, and a traveling ripple for impacts. Face life (gaze
// highlights, blink lids) and the sword glint are additive overlays drawn on
// top of the sprite before warping, so they deform with it.

// Pose sprites: "neutral" is the original artwork; every other pose is a
// normalized generation from `npm run poses` (public/poses/<name>-vec.svg).
// A referenced pose with no file fails the render loudly, like word anchors.
const poseSrc = (pose: string) =>
  pose === "neutral" ? staticFile("mascot-full-vec.svg") : staticFile(`poses/${pose}-vec.svg`);

const spriteCache = new Map<string, Promise<HTMLImageElement>>();
const loadSprite = (pose: string): Promise<HTMLImageElement> => {
  let p = spriteCache.get(pose);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () =>
        reject(new Error(`failed to load mascot sprite for pose "${pose}"`));
      img.src = poseSrc(pose);
    });
    spriteCache.set(pose, p);
  }
  return p;
};

const STRIPS = 56;
// The head occupies roughly y 560–1000 of the 1536-tall sprite; this weight
// eases head-driven shear/nod in and out across that band so the deformation
// stays continuous (no seams, no kinks).
const headWeight = (yn: number) =>
  smooth((yn - 0.28) / 0.12) * (1 - smooth((yn - 0.62) / 0.14));

type Props = {
  height: number;
  enterAt?: number;
  talking?: boolean;
  speech?: SpeechWord[];
  cues?: MascotCue[];
  seed?: number;
};

export const CanvasMascot: React.FC<Props> = ({
  height,
  enterAt = 0,
  talking = false,
  speech,
  cues,
  seed = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const accents = useMemo(() => {
    if (!speech || speech.length === 0) return [] as number[];
    const out = [speech[0].start];
    for (let i = 1; i < speech.length; i++) {
      if (speech[i].start - speech[i - 1].end > 0.35) out.push(speech[i].start);
    }
    return out;
  }, [speech]);

  const solveAt = (fr: number) =>
    solveMascot({ frame: fr, fps, height, enterAt, talking, speech, accents, cues, seed });
  const ch = solveAt(frame);
  // Root velocity (px/frame) gates motion blur: idle stays crisp; entrances,
  // hops and kicks streak. The solve is pure math, so sub-frame samples are free.
  const chPrev = solveAt(frame - 1);
  const speed = Math.hypot(ch.rootX - chPrev.rootX, ch.rootY - chPrev.rootY);
  const width = ch.width;
  const s = ch.scaleFactor;
  const margin = Math.ceil(width * 0.22);
  const cw = Math.ceil(width + margin * 2);
  const chh = Math.ceil(height * 1.06);

  const poseNames = useMemo(() => {
    const names = new Set<string>(["neutral"]);
    cues?.forEach((c) => {
      if (c.kind === "pose") names.add(c.pose ?? "neutral");
    });
    return [...names].sort();
  }, [cues]);
  const poseKey = poseNames.join("|");

  const [sprites, setSprites] = useState<Record<string, HTMLImageElement> | null>(null);
  useEffect(() => {
    const handle = delayRender("mascot sprites");
    Promise.all(poseNames.map((n) => loadSprite(n)))
      .then((imgs) => {
        setSprites(Object.fromEntries(poseNames.map((n, i) => [n, imgs[i]])));
        continueRender(handle);
      })
      .catch((err) => cancelRender(err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poseKey]);

  const bufferRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useLayoutEffect(() => {
    const sprite = sprites?.[ch.pose];
    if (!sprite || !canvasRef.current) return;
    if (!bufferRef.current) bufferRef.current = document.createElement("canvas");
    const buffer = bufferRef.current;
    const ss = 2;
    buffer.width = cw * ss;
    buffer.height = chh * ss;
    const b = buffer.getContext("2d")!;
    const headroom = (chh - height) * ss;
    b.setTransform(s * ss, 0, 0, s * ss, margin * ss, headroom);
    b.clearRect(-(margin / s), -(headroom / (s * ss)), cw / s, chh / s);

    // The intact character.
    b.drawImage(sprite, 0, 0, 1024, 1536);

    // Face life and glint are measured against the neutral artwork
    // (mascotRig.ts); generated poses carry their own painted face.
    if (ch.pose === "neutral") {
      // Face life: highlight patches, drifting highlights, lids — additive.
      HIGHLIGHTS.forEach((eye) => {
        eye.forEach((hl, j) => {
          const grad = b.createRadialGradient(
            hl.x,
            hl.y + (j === 0 ? hl.r * 0.2 : -hl.r * 0.2),
            1,
            hl.x,
            hl.y,
            hl.r + 3,
          );
          grad.addColorStop(0, j === 0 ? "#000208" : "#060f1b");
          grad.addColorStop(1, j === 0 ? "#081524" : "#0a1a2c");
          b.fillStyle = grad;
          b.beginPath();
          b.arc(hl.x, hl.y, hl.r + 3, 0, Math.PI * 2);
          b.fill();
        });
      });
      HIGHLIGHTS.forEach((eye) => {
        eye.forEach((hl) => {
          b.fillStyle = "#ffffff";
          b.beginPath();
          b.arc(hl.x + (ch.gazeX * 0.55) / s, hl.y + (ch.gazeY * 0.55) / s, hl.r, 0, Math.PI * 2);
          b.fill();
        });
      });
      const lid = Math.max(ch.blink, ch.doze);
      if (lid > 0.01) {
        EYES.forEach((eye) => {
          b.save();
          b.translate(eye.cx, eye.cy - eye.ry - 2 + (eye.ry + 2) * 0.15);
          b.scale(1, lid);
          b.translate(0, (eye.ry + 2) * 0.85);
          const grad = b.createRadialGradient(0, -(eye.ry + 2) * 0.5, 2, 0, 0, eye.rx + 4);
          grad.addColorStop(0, "rgb(84, 140, 199)");
          grad.addColorStop(0.55, "rgb(60, 114, 173)");
          grad.addColorStop(1, "rgb(48, 95, 148)");
          b.fillStyle = grad;
          b.beginPath();
          b.ellipse(0, 0, eye.rx + 2, eye.ry + 2, 0, 0, Math.PI * 2);
          b.fill();
          b.restore();
        });
      }
      // Sword glint.
      if (ch.glint > 0) {
        b.save();
        b.translate(SWORD_TIP.cx, SWORD_TIP.cy);
        b.rotate((ch.glintCycle * 4 * Math.PI) / 180);
        const g = (0.6 + ch.glint * 0.7) * 1.9;
        b.scale(g, g);
        b.globalAlpha = ch.glint;
        b.fillStyle = "#ffffff";
        b.beginPath();
        const pts = [0, -38, 6, -6, 38, 0, 6, 6, 0, 38, -6, 6, -38, 0, -6, -6];
        b.moveTo(pts[0], pts[1]);
        for (let i = 2; i < pts.length; i += 2) b.lineTo(pts[i], pts[i + 1]);
        b.closePath();
        b.fill();
        b.restore();
      }
    }

    // ── continuous warp ─────────────────────────────────────────────────────
    const c = canvasRef.current!;
    c.width = cw * ss;
    c.height = chh * ss;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);
    const H = chh * ss;

    const drawWarped = (chS: typeof ch, tS: number, alpha: number, dx: number, dy: number) => {
      const bendAmp = Math.sin((chS.rootRot * Math.PI) / 180) * height * 0.85;
      const headShear = Math.sin((chS.headRot * Math.PI) / 180) * height * 0.16;
      const nodPush = chS.headY * 0.8;
      const armHint = Math.sin((chS.armRot * Math.PI) / 180) * height * 0.1;
      const wobble =
        Math.min(
          1,
          Math.abs(chS.swayVel) * 0.12 +
            Math.abs(chS.hopVel) / (height * 2.2) +
            Math.abs(chS.enterVel) / (height * 3.5),
        ) *
        height *
        0.012;
      const squash = chS.scaleY;
      // Vertical placement is evaluated at strip EDGES so adjacent strips share
      // a boundary by construction — a per-strip nod offset opens hairline gaps
      // wherever the head weight ramps (visible as background lines through
      // bright art during deep nods/dozes).
      const edgeY = (j: number) =>
        H - (H - (j / STRIPS) * H) * squash + nodPush * headWeight(j / STRIPS) * ss;
      ctx.globalAlpha = alpha;
      for (let i = 0; i < STRIPS; i++) {
        const y0 = (i / STRIPS) * H;
        const y1 = ((i + 1) / STRIPS) * H;
        const yn = (i + 0.5) / STRIPS;
        const wHead = headWeight(yn);
        // Cap the bend curve above the blade zone so the sword translates
        // rigidly instead of bowing — metal stays metal while the body flexes.
        const wTop = Math.min(Math.pow(1 - yn, 1.6), Math.pow(1 - 0.16, 1.6));
        const bend = (bendAmp * wTop + headShear * wHead + armHint * wTop * (1 - wHead)) * ss;
        const rip = wobble * Math.sin(yn * 7 - tS * 19) * (1 - yn) * ss;
        const bulge = 1 + (1 - squash) * 1.7 * Math.exp(-Math.pow(yn - 0.74, 2) / 0.03);
        const destY0 = edgeY(i);
        const destY1 = edgeY(i + 1);
        const dw = c.width * bulge;
        ctx.drawImage(
          buffer,
          0,
          y0,
          c.width,
          Math.max(1, y1 - y0),
          (c.width - dw) / 2 + bend + rip + dx,
          destY0 + dy,
          dw,
          Math.max(1, destY1 - destY0) + 1.1,
        );
      }
      ctx.globalAlpha = 1;
    };

    // Motion blur: sub-frame history samples streak behind the fully opaque
    // current frame. Gated on root velocity so idle frames stay crisp.
    const K = speed < 4 ? 1 : Math.min(4, 1 + Math.ceil(speed / 6));
    for (let k = K - 1; k >= 1; k--) {
      const frS = frame - k / K;
      const chS = solveAt(frS);
      drawWarped(
        chS,
        frS / fps,
        0.38 / k,
        (chS.rootX - ch.rootX) * ss,
        (chS.rootY - ch.rootY) * ss,
      );
    }
    drawWarped(ch, t, 1, 0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sprites, frame, cw, chh, s, height, margin, t, ch]);

  return (
    <div
      style={{
        width,
        height,
        position: "relative",
        transform: `perspective(1400px) translate(${ch.rootX}px, ${ch.rootY}px) rotateY(${ch.yaw}deg)`,
        transformOrigin: "50% 100%",
        opacity: 1 - ch.hide,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          left: -margin,
          top: -(chh - height),
          width: cw,
          height: chh,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -height * 0.03,
          left: "12%",
          width: "76%",
          height: height * 0.055,
          borderRadius: "50%",
          background: "rgba(0,0,0,0.35)",
          filter: "blur(12px)",
          transform: `translateX(${-ch.driftX * 0.6}px) scaleX(${1 - (ch.bobY + ch.hopY) / (height * 0.2)})`,
          opacity: interpolate(ch.hopY, [-height * 0.03, 0], [0.55, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
    </div>
  );
};
