import React from "react";
import { MascotCue } from "../components/cues";
import { Timings } from "../posts";
import { COLORS, FONTS } from "../theme";
import { AT, Card, CaughtIcon, Chip, SPOTS, useT, wordTime } from "./props";

// 001 — Meet IronClaw. Capability montage: the security-boundary beats play
// as cards, the extensions rain onto the shield, and the schedule sends him
// off to work while you sleep.
export const buildScene001 = (timings: Timings) => {
  const w = (re: RegExp, opts?: { nth?: number; offset?: number }) =>
    wordTime(timings, re, opts);

  const beats = {
    boundary: w(/^security$/),
    redact: w(/^scrubbing/),
    redactOut: w(/^approval$/, { offset: -0.2 }),
    cardIn: w(/^approval$/),
    cardApproved: w(/^default\./),
    cardOut: w(/^Teach$/, { offset: -0.2 }),
    skills: w(/^playbooks$/),
    extGithub: w(/^GitHub,/),
    extGmail: w(/^Gmail,/),
    extSlack: w(/^Slack/),
    extTelegram: w(/^Telegram/),
    schedule: w(/^routine,/),
    sleep: w(/^automation\./),
    proud: w(/^blindly\./),
  };

  const cues: MascotCue[] = [
  ];

  const Overlay: React.FC = () => {
    const t = useT();
    return (
      <div style={{ position: "absolute", inset: 0, fontFamily: FONTS.sans }}>
        {/* leak detector: a secret gets masked, then redacted */}
        <Card
          x={SPOTS.card.x}
          y={SPOTS.card.y}
          width={520}
          inAt={beats.redact}
          outAt={beats.redactOut}
          border={`${COLORS.primaryLight}88`}
          fontSize={30}
        >
          <span style={{ fontFamily: FONTS.mono }}>
            {t < beats.redact + 1.2 ? "sk-a********abcd" : "[REDACTED]"}
          </span>
        </Card>

        {/* approval gate */}
        <Card
          x={SPOTS.card.x}
          y={SPOTS.card.y}
          width={460}
          inAt={beats.cardIn}
          outAt={beats.cardOut}
          border={t >= beats.cardApproved ? "#22c55eaa" : "#f97316aa"}
        >
          {t >= beats.cardApproved ? "✅ approved — proceed" : "✋ risky action — approve?"}
        </Card>

        {/* skills book */}
        {t > beats.skills && t < beats.extGithub - 0.2 ? (
          <Chip icon="📖" x={AT.head.x + 240} y={AT.head.y - 60} size={72} />
        ) : null}

        {/* extensions rain onto the shield */}
        <CaughtIcon icon="🐙" t={t} fallAt={beats.extGithub} rest={{ x: AT.shield.x - 30, y: AT.shield.y - 20 }} fromX={430} />
        <CaughtIcon icon="✉️" t={t} fallAt={beats.extGmail} rest={{ x: AT.shield.x + 6, y: AT.shield.y - 38 }} fromX={520} />
        <CaughtIcon icon="💬" t={t} fallAt={beats.extSlack} rest={{ x: AT.shield.x + 42, y: AT.shield.y - 16 }} fromX={470} />
        <CaughtIcon icon="✈️" t={t} fallAt={beats.extTelegram} rest={{ x: AT.shield.x + 8, y: AT.shield.y + 6 }} fromX={560} />

        {/* the schedule clock, then Zzz over the working-night beat */}
        {t > beats.schedule && t < beats.proud ? (
          <Chip icon="⏰" x={SPOTS.bubble.x} y={SPOTS.bubble.y - 40} size={70} />
        ) : null}
        {t > beats.sleep && t < beats.proud ? (
          <div
            style={{
              position: "absolute",
              left: SPOTS.bubble.x + 60,
              top: SPOTS.bubble.y - 140,
              fontSize: 40,
              fontWeight: 800,
              color: COLORS.textMuted,
            }}
          >
            z z z
          </div>
        ) : null}
      </div>
    );
  };

  return { cues, Overlay };
};
