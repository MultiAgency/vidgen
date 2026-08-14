import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { MascotCue } from "../components/cues";
import { Timings } from "../posts";
import { COLORS, FONTS } from "../theme";
import { Card, Chip, SPOTS, useT, wordTime, Sfx } from "./props";

// 099 — Diagnostics Before You Wake Up. Night patrol: the schedule card, the
// checklist ticking green, three quiet "ok" runs, then one red ✗ that gets
// investigated and reported to chat.
const CHECKS = ["df -h", "free -m", "ps aux", "tail /var/log"];

export const buildScene099 = (timings: Timings) => {
  const w = (re: RegExp, opts?: { nth?: number; offset?: number }) =>
    wordTime(timings, re, opts);

  const beats = {
    moonOut: w(/^Give$/),
    patrol: w(/^night$/),
    cron: w(/^five$/, { offset: -0.3 }),
    cronOut: w(/^Each$/, { offset: -0.2 }),
    checklist: w(/^checklist:$/),
    ticks: [w(/^disk,$/), w(/^memory,$/), w(/^processes,$/), w(/^logs$/)],
    quiet: w(/^quiet$/),
    quietOut: w(/^But$/, { offset: -0.2 }),
    fail: w(/^fails,$/),
    dig: w(/^digs$/),
    report: w(/^chat:$/),
    reportOut: w(/^So$/, { offset: -0.2 }),
    proud: w(/^investigation\./),
  };

  const cues: MascotCue[] = [
  ];

  const Overlay: React.FC = () => {
    const t = useT();
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const failed = t > beats.fail;

    return (
      <div style={{ position: "absolute", inset: 0, fontFamily: FONTS.sans }}>
        <Sfx name="stamp" at={beats.fail} /><Sfx name="ding" at={beats.report} />
        {/* night: a moon that fades as the shift starts */}
        {t < beats.moonOut ? (
          <Chip icon="🌙" x={1700} y={180} size={80} opacity={Math.min(1, t / 0.8)} />
        ) : null}

        {/* schedule card */}
        <Card
          x={SPOTS.card.x}
          y={620}
          width={480}
          inAt={beats.cron}
          outAt={beats.cronOut}
          border={`${COLORS.primaryLight}88`}
          fontSize={28}
        >
          <span style={{ fontFamily: FONTS.mono }}>⏰ every 5 min · America/New_York</span>
        </Card>

        {/* checklist card: rows tick green, one turns red on the fail beat */}
        {t > beats.checklist && t < beats.reportOut ? (
          <div
            style={{
              position: "absolute",
              left: SPOTS.bubble.x - 200,
              top: SPOTS.bubble.y - 255,
              width: 400,
              padding: "18px 26px",
              borderRadius: 16,
              border: `3px solid ${failed ? "#ef4444aa" : `${COLORS.primaryLight}66`}`,
              background: "rgba(15,23,42,0.92)",
              fontFamily: FONTS.mono,
              fontSize: 27,
              lineHeight: 1.7,
              color: COLORS.text,
              transform: `scale(${spring({ frame: frame - Math.round(beats.checklist * fps), fps, config: { damping: 12 } })}) ${failed && t < beats.fail + 0.4 ? `translateX(${Math.sin((t - beats.fail) * 60) * 5}px)` : ""}`,
            }}
          >
            {CHECKS.map((c, i) => {
              const ticked = t > beats.ticks[i];
              const isBad = failed && i === 3;
              return (
                <div key={c} style={{ color: isBad ? "#ef4444" : ticked ? COLORS.text : COLORS.textMuted }}>
                  {isBad ? "✗" : ticked ? "✓" : "·"} {c}
                  {isBad ? "  ← ERROR" : ""}
                </div>
              );
            })}
          </div>
        ) : null}

        {/* quiet runs history */}
        {t > beats.quiet && t < beats.quietOut ? (
          <div
            style={{
              position: "absolute",
              left: SPOTS.bubble.x - 130,
              top: SPOTS.bubble.y + 60,
              padding: "10px 22px",
              borderRadius: 999,
              border: `2px solid ${COLORS.border}`,
              fontFamily: FONTS.mono,
              fontSize: 26,
              color: "#22c55e",
              background: "rgba(15,23,42,0.9)",
            }}
          >
            runs: ok · ok · ok
          </div>
        ) : null}

        {/* the report lands in chat */}
        {t > beats.report ? (
          <div
            style={{
              position: "absolute",
              left: SPOTS.bubble.x - 190,
              top: SPOTS.bubble.y - 200,
              width: 380,
              padding: "16px 22px",
              borderRadius: "24px 24px 24px 6px",
              border: "3px solid #ef4444aa",
              background: "rgba(239,68,68,0.1)",
              fontSize: 28,
              fontWeight: 700,
              color: COLORS.text,
              transform: `scale(${spring({ frame: frame - Math.round(beats.report * fps), fps, config: { damping: 12 } }) * (t > beats.reportOut ? Math.max(0, 1 - (t - beats.reportOut) / 0.6) : 1)})`,
            }}
          >
            📨 disk 91% on /var — likely cause: log rotation stalled
          </div>
        ) : null}
      </div>
    );
  };

  return { cues, Overlay };
};
