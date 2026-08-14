import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { MascotCue } from "../components/cues";
import { Timings } from "../posts";
import { COLORS, FONTS } from "../theme";
import { Card, Chip, SPOTS, useT, wordTime, Sfx } from "./props";

// 100 — Bug Bounty Triage, Contained. The hostile report arrives, the leak
// detector masks its secret, reproduction runs inside the sandbox-cage card,
// the health score ticks down as findings land, and the verdict posts back.
export const buildScene100 = (timings: Timings) => {
  const w = (re: RegExp, opts?: { nth?: number; offset?: number }) =>
    wordTime(timings, re, opts);

  const beats = {
    report: w(/^hostile$/, { offset: -0.4 }),
    shield: w(/^attack$/),
    scan: w(/^Prompt-injection/),
    scanOut: w(/^leak$/, { offset: -0.2 }),
    mask: w(/^scrubs$/),
    redacted: w(/^tokens$/),
    maskOut: w(/^Then$/, { offset: -0.3 }),
    sandbox: w(/^sandbox$/),
    sandboxOut: w(/^every$/, { offset: -0.3 }),
    score: w(/^finding$/),
    autofix: w(/^fix,$/),
    scoreOut: w(/^Then$/, { nth: 1, offset: -0.2 }),
    verdict: w(/^verdict\./),
    proud: w(/^Triage$/),
  };

  const cues: MascotCue[] = [
    { at: beats.verdict, kind: "swat" },
  ];

  const Overlay: React.FC = () => {
    const t = useT();
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // health score ticks 100 → 55 (−30 P1, −15 P2) across the findings beat
    const score =
      t < beats.score ? 100 : t < beats.score + 0.8 ? 70 : t < beats.autofix ? 70 : 55;

    return (
      <div style={{ position: "absolute", inset: 0, fontFamily: FONTS.sans }}>
        <Sfx name="ding" at={beats.autofix} /><Sfx name="stamp" at={beats.verdict} />
        {/* the hostile report */}
        {t > beats.report && t < beats.scanOut ? (
          <div
            style={{
              position: "absolute",
              left: SPOTS.card.x - 200,
              top: SPOTS.card.y - 46,
              width: 400,
              padding: "16px 24px",
              borderRadius: 14,
              border: "3px solid #ef4444aa",
              background: "rgba(15,23,42,0.94)",
              transform: `scale(${spring({ frame: frame - Math.round(beats.report * fps), fps, config: { damping: 12 } })})`,
              fontSize: 28,
              fontWeight: 700,
              color: COLORS.text,
            }}
          >
            📨 bug bounty report
            <div style={{ fontSize: 22, color: "#ef4444", marginTop: 4 }}>
              untrusted · handle with shield
            </div>
          </div>
        ) : null}

        {/* injection scan chip */}
        {t > beats.scan && t < beats.scanOut ? (
          <Chip icon="🛡️" x={SPOTS.card.x + 260} y={SPOTS.card.y} size={70} />
        ) : null}

        {/* the leak detector masks, then redacts */}
        <Card
          x={SPOTS.bubble.x}
          y={SPOTS.bubble.y - 120}
          width={520}
          inAt={beats.mask}
          outAt={beats.maskOut}
          border={`${COLORS.primaryLight}88`}
          fontSize={30}
        >
          <span style={{ fontFamily: FONTS.mono }}>
            {t < beats.redacted ? "sk-a********abcd" : "[REDACTED]"}
          </span>
          <div style={{ fontSize: 22, color: COLORS.textMuted, marginTop: 4 }}>
            leak detector · known credential shapes
          </div>
        </Card>

        {/* the sandbox cage */}
        <Card
          x={SPOTS.bubble.x}
          y={SPOTS.bubble.y - 100}
          width={520}
          inAt={beats.sandbox}
          outAt={beats.sandboxOut}
          border="#eab308aa"
          fontSize={28}
        >
          📦 isolated sandbox
          <div style={{ fontFamily: FONTS.mono, fontSize: 24, color: COLORS.textMuted, marginTop: 6 }}>
            2 GiB · 1 CPU · 120s · network: none
          </div>
        </Card>

        {/* health score + auto-fix tag */}
        {t > beats.score && t < beats.scoreOut ? (
          <div
            style={{
              position: "absolute",
              left: SPOTS.bubble.x - 200,
              top: SPOTS.bubble.y - 40,
              width: 400,
              padding: "16px 24px",
              borderRadius: 14,
              border: `3px solid ${score < 70 ? "#f97316aa" : "#22c55eaa"}`,
              background: "rgba(15,23,42,0.94)",
              fontFamily: FONTS.mono,
              fontSize: 30,
              color: COLORS.text,
            }}
          >
            Health Score: {score}
            {t > beats.autofix ? (
              <span
                style={{
                  marginLeft: 16,
                  padding: "2px 10px",
                  border: "3px solid #22c55e",
                  borderRadius: 8,
                  color: "#22c55e",
                  fontSize: 24,
                  fontWeight: 900,
                }}
              >
                [AUTO-FIXED]
              </span>
            ) : null}
          </div>
        ) : null}

        {/* verdict posted */}
        {t > beats.verdict ? (
          <div
            style={{
              position: "absolute",
              left: SPOTS.bubble.x - 190,
              top: SPOTS.bubble.y - 70,
              width: 380,
              padding: "14px 22px",
              borderRadius: 14,
              border: "3px solid #22c55eaa",
              background: "rgba(34,197,94,0.1)",
              transform: `scale(${spring({ frame: frame - Math.round(beats.verdict * fps), fps, config: { damping: 12 } })})`,
              fontSize: 28,
              fontWeight: 700,
              color: COLORS.text,
            }}
          >
            🏷 labeled · verdict posted to the issue
          </div>
        ) : null}
      </div>
    );
  };

  return { cues, Overlay };
};
