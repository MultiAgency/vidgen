import React, { useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill,
  Audio,
  cancelRender,
  continueRender,
  delayRender,
  Img,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Background, GRAIN } from "./components/Background";
import { Captions } from "./components/Captions";
import { DiagramBeat } from "./components/DiagramBeat";
import { MascotCue } from "./components/cues";
import { Mascot3D } from "./components/Mascot3D";
import { StepRail, TimedCard } from "./components/Walkthrough";
import { Post, Timings } from "./posts";
import { SCENES } from "./scenes";
import { Sfx } from "./scenes/props";
import { COLORS, FONTS } from "./theme";
import { AUDIO_START, OUTRO } from "./timing";
import { MASCOT_HEIGHT_FRAC, MASCOT_HEIGHT_FRAC_SQUARE } from "./layout";

// Music bed level under the voiceover (~-18 dB relative to full scale).
const BED_VOLUME = 0.12;

export const MascotPost: React.FC<{ post: Post }> = ({ post }) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const [timings, setTimings] = useState<Timings | null>(null);
  const [hasAudio, setHasAudio] = useState(false);
  const [handle] = useState(() => delayRender("load word timings"));

  useEffect(() => {
    // Timings and audio are checked separately: mock voiceovers write
    // words.json without an mp3 so pacing can be previewed silently.
    Promise.all([
      fetch(staticFile(`audio/${post.slug}.words.json`)).then(async (res) => {
        if (res.ok) {
          setTimings(await res.json());
        }
      }),
      fetch(staticFile(`audio/${post.slug}.mp3`), { method: "HEAD" }).then(
        (res) => setHasAudio(res.ok),
      ),
    ])
      .then(() => continueRender(handle))
      .catch((err) => cancelRender(err));
  }, [handle, post.slug]);

  const t = frame / fps;
  const square = width / height < 1.2;
  const voiceEnd = timings
    ? AUDIO_START + timings.durationSeconds
    : durationInFrames / fps - OUTRO;
  // Scenes: word-anchored authored performances (16:9 only). Their cue list
  // replaces the auto-derived gestures below.
  const scene = useMemo(() => {
    const build = square ? undefined : SCENES[post.slug];
    return build && timings ? build(timings) : undefined;
  }, [square, post.slug, timings]);

  // Post renderers consume only "hide" (Mascot3D) and "swat" (camera shake),
  // both authored per scene — there is no auto-derived fallback.
  const cues = useMemo<MascotCue[]>(() => scene?.cues ?? [], [scene]);

  // Camera: scene keyframes when provided (eased ~8-frame moves that read as
  // cuts), else the default slow push-in. The outro sits outside this
  // transform either way. Evaluated as a function of time so the camera's own
  // velocity can drive a motion-blur softness during moves and impact shakes.
  const camAt = (tt: number) => {
    let scale = interpolate(tt, [AUDIO_START, voiceEnd], [1, 1.05], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    let x = 0;
    let y = 0;
    if (scene?.camera && scene.camera.length > 0) {
      const keys = scene.camera;
      let a = keys[0];
      let b = keys[0];
      for (const k of keys) {
        if (k.at <= tt) a = k;
        if (k.at > tt) {
          b = k;
          break;
        }
        b = k;
      }
      const span = 0.27;
      const p = a === b ? 1 : Math.min(1, Math.max(0, (tt - b.at + span) / span));
      const e = p * p * (3 - 2 * p);
      scale = a.scale + (b.scale - a.scale) * e;
      x = (a.x ?? 0) + ((b.x ?? 0) - (a.x ?? 0)) * e;
      y = (a.y ?? 0) + ((b.y ?? 0) - (a.y ?? 0)) * e;
    }
    // Impact micro-shake: a few pixels for ~5 frames on each swat beat.
    for (const cue of cues) {
      if (cue.kind !== "swat") continue;
      const local = tt - cue.at;
      if (local >= 0 && local < 0.18) {
        const sh = Math.sin(local * 95) * 3 * (1 - local / 0.18);
        x += sh;
        y -= sh * 0.6;
      }
    }
    return { scale, x, y };
  };
  const cam = camAt(t);
  const camPrev = camAt(t - 1 / fps);
  const camSpeed = Math.hypot(
    ((cam.scale - camPrev.scale) * width) / 2,
    cam.x - camPrev.x,
    cam.y - camPrev.y,
  );
  const camBlur = camSpeed > 1.2 ? Math.min(2.5, camSpeed * 0.14) : 0;
  const camera = cam.scale;
  const camX = cam.x;
  const camY = cam.y;
  // Demo focus: while a focus window is active, the footage owns the frame.
  let focusAmt = 0;
  if (scene?.focus) {
    for (const wdw of scene.focus) {
      const rise = Math.min(1, Math.max(0, (t - wdw.from) / 0.35));
      const fall = Math.min(1, Math.max(0, (wdw.to - t) / 0.35));
      focusAmt = Math.max(focusAmt, Math.min(rise, fall));
    }
    focusAmt = focusAmt * focusAmt * (3 - 2 * focusAmt);
  }

  const outroStart = voiceEnd + 0.4;

  const titleIn = spring({ frame: frame - Math.round(0.2 * fps), fps, config: { damping: 14 } });
  const outroIn = spring({
    frame: frame - Math.round(outroStart * fps),
    fps,
    config: { damping: 14 },
  });
  const ctaIn = spring({
    frame: frame - Math.round((outroStart + 0.9) * fps),
    fps,
    config: { damping: 14 },
  });
  const mainFade = t >= outroStart ? interpolate(outroIn, [0, 1], [1, 0]) : 1;

  // Editorial: the title is an opening statement, not furniture. It holds
  // through the first spoken sentence, then hands the top of frame to the
  // step rail (walkthrough posts) or a compact kicker (everything else).
  const titleHold = useMemo(() => {
    const sentenceEnd = timings?.words.find((x) => /[.!?]$/.test(x.text));
    return (sentenceEnd ? sentenceEnd.end + AUDIO_START : 4.2) + 0.5;
  }, [timings]);
  const titleOutP = Math.min(1, Math.max(0, (t - titleHold) / 0.55));
  const titleOut = titleOutP * titleOutP * (3 - 2 * titleOutP);
  // The rail promotes only AFTER the title has fully left — text must never
  // cross-dissolve through text (cut review, note 3).
  const railUpP = Math.min(1, Math.max(0, (t - titleHold - 0.55) / 0.4));
  const railUp = railUpP * railUpP * (3 - 2 * railUpP);

  // Stage inversion (104 plan W1): the host stands smaller than the evidence
  // he presents — the product is the biggest thing in a presenting frame.
  const mascotHeight =
    height * (square ? MASCOT_HEIGHT_FRAC_SQUARE : MASCOT_HEIGHT_FRAC);

  return (
    <AbsoluteFill
      style={{ fontFamily: FONTS.sans, filter: "contrast(1.03) saturate(1.045)" }}
    >
      <Background accent={post.accent} />
      <Audio
        src={staticFile("audio/bed.wav")}
        volume={(f) => {
          // Audible from frame 0 — a silent first second is a scroll trigger.
          const ramp = interpolate(
            f,
            [0, fps, durationInFrames - 1.5 * fps, durationInFrames - 5],
            [BED_VOLUME * 0.8, BED_VOLUME, BED_VOLUME, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
          // Section arc: the bed builds ~+3dB into the back half so the mix
          // crests where the film does, instead of a flat wall (LRA was 2.1).
          const arc = interpolate(
            f,
            [0, durationInFrames * 0.5, durationInFrames * 0.78],
            [1, 1.08, 1.38],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
          const base = ramp * arc;
          if (!timings) return base;
          // Speech-aware ducking: sit lower under words, swell in the gaps.
          const tt = f / fps - AUDIO_START;
          let dist = Infinity;
          for (const w of timings.words) {
            if (tt >= w.start && tt <= w.end) {
              dist = 0;
              break;
            }
            dist = Math.min(dist, Math.abs(tt - (tt < w.start ? w.start : w.end)));
          }
          const gap = Math.min(1, dist / 0.45);
          return base * (0.75 + gap * 0.55);
        }}
      />
      {hasAudio ? (
        <Sequence from={Math.round(AUDIO_START * fps)}>
          <Audio src={staticFile(`audio/${post.slug}.mp3`)} />
        </Sequence>
      ) : null}
      {/* The title lands with a hit; the CTA pops with one. */}
      <Sfx name="stamp" at={0.2} volume={0.4} />
      <Sfx name="pop" at={outroStart + 0.9} volume={0.45} />

      {/* Camera: slow push-in around the mascot/captions centroid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${camera}) translate(${camX}px, ${camY}px)`,
          transformOrigin: "38% 60%",
          filter: camBlur > 0 ? `blur(${camBlur}px)` : undefined,
        }}
      >
      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: square ? height * 0.06 : height * 0.07,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: titleIn * (1 - titleOut) * mainFade * (1 - 0.92 * focusAmt),
          // Slow living zoom through the title act — the opening frame must
          // never be fully static (plan W4).
          transform: `translateY(${interpolate(titleIn, [0, 1], [-40, 0]) - 60 * titleOut}px) scale(${1 + Math.min(t / 9, 1) * 0.035})`,
        }}
      >
        <div style={{ fontSize: square ? 84 : 96, fontWeight: 900, color: COLORS.text }}>
          {post.title}
        </div>
        <div
          style={{
            fontSize: square ? 38 : 42,
            fontWeight: 600,
            color: COLORS.textMuted,
            marginTop: 12,
          }}
        >
          {post.tagline}
        </div>
      </div>

      {/* Brand bug: the NEAR AI tile, small and quiet, top-right throughout */}
      {!square ? (
        <Img
          src={staticFile("brand/nearai-tile.png")}
          style={{
            position: "absolute",
            top: height * 0.045,
            right: width * 0.032,
            height: 54,
            opacity: 0.42 * mainFade,
          }}
        />
      ) : null}

      {/* Kicker: once the title exits, a quiet caps label keeps the context */}
      {!post.walkthrough ? (
        <div
          style={{
            position: "absolute",
            top: height * 0.055,
            left: width * 0.045,
            fontFamily: FONTS.mono,
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: "0.09em",
            textTransform: "uppercase",
            color: COLORS.textMuted,
            opacity: railUp * mainFade * (1 - 0.92 * focusAmt),
          }}
        >
          {post.title}
        </div>
      ) : null}

      {/* Mascot */}
      <div
        style={{
          position: "absolute",
          bottom: square ? height * 0.2 : height * 0.02,
          left: square ? (width - mascotHeight * (1024 / 1536)) / 2 : width * 0.06,
          opacity: mainFade,
          transform: `scale(${1 - 0.52 * focusAmt}) translateX(${-focusAmt * 40}px)`,
          transformOrigin: "left bottom",
        }}
      >
        <Mascot3D height={mascotHeight} enterAt={Math.round(0.3 * fps)} cues={cues} />
      </div>

      {/* Walkthrough: step rail under the tagline + timed cards (16:9 only) */}
      {post.walkthrough && !square ? (
        <>
          {/* The rail starts under the title, then promotes into the title's
              vacated slot as the one persistent context element. */}
          <div
            style={{
              position: "absolute",
              top: interpolate(railUp, [0, 1], [height * 0.25, height * 0.08]),
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              opacity: mainFade * (1 - 0.92 * focusAmt),
            }}
          >
            <StepRail steps={post.walkthrough.steps} accent={post.accent} />
          </div>
          {/* Every step advance gets a whoosh — transitions must be audible. */}
          {post.walkthrough.steps.map((s, i) => (
            <Sfx key={i} name="whoosh" at={s.at} volume={0.32} />
          ))}
          {post.walkthrough.cards.map((card, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                // Bottom-anchored: cards of any height grow UP from a
                // caption-band-safe floor (frame QA enforces the band).
                bottom: height * 0.17,
                left: width * 0.34,
                right: width * 0.05,
                display: "flex",
                justifyContent: "center",
                opacity: mainFade,
              }}
            >
              <TimedCard card={card} accent={post.accent} />
            </div>
          ))}
        </>
      ) : null}

      {/* Scene props (choreographed posts, 16:9 only) */}
      {scene ? (
        <div style={{ position: "absolute", inset: 0, opacity: mainFade }}>
          <scene.Overlay />
        </div>
      ) : null}

      {/* Diagram beat (16:9 only) */}
      {post.diagram && !square ? (
        <div
          style={{
            position: "absolute",
            top: height * 0.25,
            left: width * 0.38,
            right: width * 0.04,
            display: "flex",
            justifyContent: "center",
            opacity: mainFade,
          }}
        >
          <DiagramBeat
            nodes={post.diagram.nodes}
            accent={post.accent}
            startSeconds={post.diagram.at}
            durationSeconds={Math.min(
              post.diagram.duration ?? 12,
              Math.max(0, voiceEnd - 0.5 - post.diagram.at),
            )}
          />
        </div>
      ) : null}

      {/* Captions: permanently a lower-third subtitle — the frame belongs to
          the scene, never to the transcript ("just text" verdict).
          REMOTION_QA_HIDE_CAPTIONS renders without them so the frame-QA
          band checker can treat any caption-band ink as an intrusion. */}
      {process.env.REMOTION_QA_HIDE_CAPTIONS ? null : (
      <div
        style={{
          position: "absolute",
          ...(square
            ? { bottom: height * 0.045, left: width * 0.06, right: width * 0.06 }
            : {
                top: height * 0.855,
                left: width * (0.26 - 0.04 * focusAmt),
                right: width * 0.04,
              }),
          opacity: mainFade,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Captions
          timings={timings}
          accent={post.accent}
          audioStart={AUDIO_START}
          fontSize={square ? 54 : 44}
        />
      </div>
      )}
      </div>

      {/* Outro */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          opacity: outroIn,
          transform: `scale(${interpolate(outroIn, [0, 1], [0.94, 1])})`,
        }}
      >
        <div
          style={{
            fontSize: square ? 64 : 80,
            fontWeight: 900,
            color: COLORS.text,
            textAlign: "center",
          }}
        >
          {post.outro}
        </div>
        <div
          style={{
            fontSize: square ? 40 : 48,
            fontWeight: 700,
            color: post.accent,
            marginTop: 24,
          }}
        >
          IronClaw
        </div>
        {/* End card CTA, springing in after the outro line */}
        <div
          style={{
            marginTop: 36,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 18,
            opacity: ctaIn,
            transform: `translateY(${interpolate(ctaIn, [0, 1], [24, 0])}px)`,
          }}
        >
          <div
            style={{
              fontSize: square ? 30 : 34,
              fontWeight: 800,
              color: COLORS.bg,
              background: post.accent,
              borderRadius: 999,
              padding: "14px 36px",
            }}
          >
            ⭐ Star it on GitHub
          </div>
          <div
            style={{
              fontSize: square ? 28 : 32,
              fontWeight: 600,
              color: COLORS.textMuted,
            }}
          >
            github.com/nearai/ironclaw
          </div>
          {/* Brand signature */}
          <Img
            src={staticFile("brand/nearai-primary.png")}
            style={{ height: square ? 44 : 52, marginTop: 34, opacity: 0.92 }}
          />
        </div>
      </AbsoluteFill>

      {/* Grade: subject backlight + corner vignette + animated film grain,
          over everything — the "lens" the whole post is seen through. */}
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse 60% 52% at 40% 46%, rgba(148,197,253,0.055), transparent 62%)," +
            "radial-gradient(ellipse 88% 80% at 50% 46%, transparent 56%, rgba(2,6,17,0.5) 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          backgroundImage: GRAIN,
          backgroundPosition: `${(frame * 7) % 240}px ${(frame * 13) % 240}px`,
          opacity: 0.035,
        }}
      />
    </AbsoluteFill>
  );
};
