import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { MascotCue } from "../components/cues";
import { Timings } from "../posts";
import { COLORS, FONTS } from "../theme";
import { ease, SPOTS, useT, wordTime, Sfx } from "./props";

// 098 — Your Morning PR Digest. Three PR cards drop in, get worked through
// one by one, receive their verdict stamps (the parallel-pr-review skill's
// real labels), collapse into one digest, and ship to chat.
const PRS = [
  { id: "#412", meta: "@alice  +120/−8", verdict: "APPROVE", color: "#22c55e" },
  { id: "#408", meta: "@bob  +64/−12", verdict: "REQUEST CHANGES", color: "#f97316" },
  { id: "#395", meta: "@carol  +9/−2", verdict: "CONFLICTING", color: "#ef4444" },
];

export const buildScene098 = (timings: Timings) => {
  const w = (re: RegExp, opts?: { nth?: number; offset?: number }) =>
    wordTime(timings, re, opts);

  const beats = {
    drop: w(/^Ten$/, { offset: 0.3 }),
    cron: w(/^scheduled$/),
    cronOut: w(/^pulls$/, { offset: -0.2 }),
    work: w(/^one:$/),
    stamp1: w(/^ready$/),
    stamp2: w(/^needs$/),
    stamp3: w(/^blocked$/),
    digest: w(/^digest,/),
    deliver: w(/^Slack$/),
    receiptOut: w(/^You$/, { offset: -0.3 }),
    proud: w(/^Review$/),
  };

  const cues: MascotCue[] = [
    { at: beats.stamp1, kind: "swat" },
    { at: beats.stamp2, kind: "swat" },
    { at: beats.stamp3, kind: "swat" },
  ];

  const CARD_W = 280;
  const baseX = 1010;
  const baseY = 640;

  const Overlay: React.FC = () => {
    const t = useT();
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const stamps = [beats.stamp1, beats.stamp2, beats.stamp3];
    const digesting = t > beats.digest;

    return (
      <div style={{ position: "absolute", inset: 0, fontFamily: FONTS.sans }}>
        <Sfx name="stamp" at={beats.stamp1} /><Sfx name="stamp" at={beats.stamp2} /><Sfx name="stamp" at={beats.stamp3} /><Sfx name="ding" at={beats.deliver + 0.4} />
        {/* cron card */}
        {t > beats.cron && t < beats.cronOut ? (
          <div
            style={{
              position: "absolute",
              left: SPOTS.card.x - 190,
              top: SPOTS.card.y - 40,
              padding: "16px 28px",
              borderRadius: 16,
              border: `3px solid ${COLORS.primaryLight}88`,
              background: "rgba(15,23,42,0.9)",
              fontFamily: FONTS.mono,
              fontSize: 30,
              color: COLORS.text,
              transform: `scale(${spring({ frame: frame - Math.round(beats.cron * fps), fps, config: { damping: 12 } })})`,
            }}
          >
            ⏰ 0 7 * * MON-FRI
          </div>
        ) : null}

        {/* PR cards */}
        {PRS.map((pr, i) => {
          const dropAt = beats.drop + i * 0.35;
          if (t < dropAt) return null;
          const drop = ease(Math.min(1, (t - dropAt) / 0.6));
          const x = baseX + i * (CARD_W + 22);
          // during "works through them", each card lifts while inspected
          const inspectAt = beats.work + i * 2.2;
          const inspecting =
            t > inspectAt && t < inspectAt + 2.0 && t < stamps[0] ? 1 : 0;
          const stamped = t > stamps[i];
          // digest: cards slide together and shrink into the digest position
          const dg = digesting ? ease(Math.min(1, (t - beats.digest) / 0.7)) : 0;
          const dgX = interpolate(dg, [0, 1], [x, SPOTS.bubble.x - CARD_W / 2 - 40 + i * 24]);
          const dgY = interpolate(dg, [0, 1], [baseY, SPOTS.bubble.y - 230 + i * 8]);
          const dgS = interpolate(dg, [0, 1], [1, 0.55]);
          const flyOut = t > beats.deliver ? ease(Math.min(1, (t - beats.deliver) / 0.5)) : 0;
          if (flyOut >= 1) return null;
          return (
            <div
              key={pr.id}
              style={{
                position: "absolute",
                left: dgX,
                top: interpolate(drop, [0, 1], [-160, dgY]) - inspecting * 18,
                width: CARD_W,
                padding: "16px 20px",
                borderRadius: 14,
                border: `3px solid ${inspecting ? COLORS.primaryLight : COLORS.border}`,
                background: "rgba(15,23,42,0.94)",
                transform: `scale(${dgS}) rotate(${(i - 1) * 2}deg)`,
                opacity: 1 - flyOut,
                color: COLORS.text,
              }}
            >
              <div style={{ fontFamily: FONTS.mono, fontSize: 28, fontWeight: 700 }}>
                {pr.id} <span style={{ color: COLORS.textMuted }}>{pr.meta}</span>
              </div>
              {stamped && !digesting ? (
                <div
                  style={{
                    marginTop: 10,
                    display: "inline-block",
                    padding: "4px 14px",
                    border: `3px solid ${pr.color}`,
                    borderRadius: 8,
                    color: pr.color,
                    fontSize: 24,
                    fontWeight: 900,
                    transform: `rotate(-6deg) scale(${spring({ frame: frame - Math.round(stamps[i] * fps), fps, config: { damping: 10 } })})`,
                  }}
                >
                  {pr.verdict}
                </div>
              ) : null}
            </div>
          );
        })}

        {/* digest chip + delivery receipt */}
        {t > beats.deliver ? (
          <div
            style={{
              position: "absolute",
              left: SPOTS.bubble.x - 170,
              top: SPOTS.bubble.y - 150,
              width: 340,
              padding: "18px 22px",
              textAlign: "center",
              borderRadius: "26px 26px 26px 6px",
              border: `3px solid ${COLORS.primaryLight}88`,
              background: "rgba(96,165,250,0.12)",
              transform: `scale(${spring({ frame: frame - Math.round(beats.deliver * fps), fps, config: { damping: 12 } }) * (t > beats.receiptOut ? Math.max(0, 1 - (t - beats.receiptOut) / 0.6) : 1)})`,
              fontSize: 34,
              fontWeight: 800,
              color: COLORS.text,
            }}
          >
            📋 digest → your chat
            <div style={{ fontSize: 24, fontWeight: 600, color: COLORS.textMuted, marginTop: 6 }}>
              Delivered ✓ · ranked by what needs you
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  return { cues, Overlay };
};
