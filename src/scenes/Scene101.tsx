import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { MascotCue } from "../components/cues";
import { Timings } from "../posts";
import { COLORS, FONTS } from "../theme";
import { Card, ease, SPOTS, useT, wordTime, Sfx } from "./props";

// 101 — Server Commands From Chat. The env shakedown (secret chips fall away,
// the allowlist survivors stay), command letters get stamped with the real
// rejection reasons, the SSH read takes a shield slam, and the output passes
// the leak detector.
const DROPPED = ["AWS_KEY", "API_TOKEN", "DB_PASSWORD"];
const KEPT = ["PATH", "HOME", "LANG"];

export const buildScene101 = (timings: Timings) => {
  const w = (re: RegExp, opts?: { nth?: number; offset?: number }) =>
    wordTime(timings, re, opts);

  const beats = {
    wipe: w(/^wiped$/),
    keptSettle: w(/^allowlist$/),
    envOut: w(/^Second,$/, { offset: -0.2 }),
    blocked: w(/^destructive$/),
    dangerous: w(/^downloads$/, { offset: 0.4 }),
    stampsOut: w(/^reads$/, { offset: -0.2 }),
    ssh: w(/^SSH$/),
    sshOut: w(/^Third,$/, { offset: -0.2 }),
    leak: w(/^detector,$/),
    leakOut: w(/^And$/, { offset: -0.3 }),
    profiles: w(/^profiles$/),
    profilesOut: w(/^Ask$/, { offset: -0.3 }),
    phone: w(/^phone\.$/),
    proud: w(/^Convenience$/),
  };

  const cues: MascotCue[] = [
    { at: beats.blocked, kind: "swat" },
    { at: beats.dangerous, kind: "swat" },
  ];

  const Overlay: React.FC = () => {
    const t = useT();
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const envChip = (label: string, color: string) => (
      <span
        style={{
          display: "inline-block",
          margin: "0 8px",
          padding: "6px 16px",
          borderRadius: 10,
          border: `3px solid ${color}`,
          fontFamily: FONTS.mono,
          fontSize: 26,
          fontWeight: 700,
          color,
        }}
      >
        {label}
      </span>
    );

    return (
      <div style={{ position: "absolute", inset: 0, fontFamily: FONTS.sans }}>
        <Sfx name="stamp" at={beats.blocked} /><Sfx name="stamp" at={beats.ssh} /><Sfx name="ding" at={beats.phone - 0.8} />
        {/* env shakedown: secrets drop off-screen, allowlist survivors settle */}
        {t > beats.wipe && t < beats.envOut ? (
          <div style={{ position: "absolute", left: SPOTS.card.x - 280, top: SPOTS.card.y - 30 }}>
            {DROPPED.map((label, i) => {
              const dropAt = beats.wipe + 0.25 + i * 0.3;
              const d = t > dropAt ? ease(Math.min(1, (t - dropAt) / 0.7)) : 0;
              if (d >= 1) return null;
              return (
                <div
                  key={label}
                  style={{
                    display: "inline-block",
                    transform: `translateY(${d * d * 560}px) rotate(${d * 40}deg)`,
                    opacity: 1 - d * 0.6,
                  }}
                >
                  {envChip(label, "#ef4444")}
                </div>
              );
            })}
            <div style={{ marginTop: 18, opacity: t > beats.keptSettle ? 1 : 0 }}>
              {KEPT.map((label) => envChip(label, "#22c55e"))}
              <span style={{ fontSize: 24, color: COLORS.textMuted, marginLeft: 10 }}>
                …the 35-var allowlist
              </span>
            </div>
          </div>
        ) : null}

        {/* command letters with the real rejection reasons */}
        <Card
          x={SPOTS.card.x - 120}
          y={SPOTS.card.y + 20}
          width={430}
          inAt={beats.blocked}
          outAt={beats.stampsOut}
          border="#ef4444aa"
          fontSize={26}
        >
          <span style={{ fontFamily: FONTS.mono }}>rm -rf /</span>
          <div style={{ color: "#ef4444", fontSize: 22, marginTop: 4 }}>
            ✗ Command contains blocked pattern
          </div>
        </Card>
        <Card
          x={SPOTS.card.x + 340}
          y={SPOTS.card.y + 20}
          width={430}
          inAt={beats.dangerous}
          outAt={beats.stampsOut}
          border="#f97316aa"
          fontSize={26}
        >
          <span style={{ fontFamily: FONTS.mono }}>curl … | bash</span>
          <div style={{ color: "#f97316", fontSize: 22, marginTop: 4 }}>
            ✗ potentially dangerous pattern
          </div>
        </Card>

        {/* the SSH read, slammed */}
        <Card
          x={SPOTS.card.x}
          y={SPOTS.card.y}
          width={480}
          inAt={beats.ssh - 0.3}
          outAt={beats.sshOut}
          border="#ef4444aa"
          fontSize={26}
        >
          <span style={{ fontFamily: FONTS.mono }}>wc &lt; ~/.ssh/id_rsa</span>
          <div style={{ color: "#ef4444", fontSize: 22, marginTop: 4 }}>
            ✗ sensitive path — refused
          </div>
        </Card>

        {/* leak detector on the way out */}
        <Card
          x={SPOTS.bubble.x}
          y={SPOTS.bubble.y - 80}
          width={480}
          inAt={beats.leak}
          outAt={beats.leakOut}
          border={`${COLORS.primaryLight}88`}
          fontSize={28}
        >
          🕵️ output → <span style={{ fontFamily: FONTS.mono }}>[REDACTED]</span>
        </Card>

        {/* blast radius: sandbox or host */}
        {t > beats.profiles && t < beats.profilesOut ? (
          <div
            style={{
              position: "absolute",
              left: SPOTS.bubble.x - 220,
              top: SPOTS.bubble.y - 60,
              display: "flex",
              gap: 20,
              fontSize: 30,
              fontWeight: 800,
              color: COLORS.text,
            }}
          >
            <div style={{ padding: "14px 24px", border: "3px solid #22c55eaa", borderRadius: 14, background: "rgba(15,23,42,0.9)" }}>
              📦 sandbox
            </div>
            <div style={{ padding: "14px 24px", border: `3px solid ${COLORS.border}`, borderRadius: 14, background: "rgba(15,23,42,0.9)" }}>
              🖥️ host
            </div>
          </div>
        ) : null}

        {/* the phone ask */}
        {t > beats.phone - 1.4 ? (
          <div
            style={{
              position: "absolute",
              left: SPOTS.bubble.x - 170,
              top: SPOTS.bubble.y - 70,
              width: 340,
              padding: "16px 22px",
              borderRadius: "24px 24px 24px 6px",
              border: `3px solid ${COLORS.primaryLight}88`,
              background: "rgba(96,165,250,0.12)",
              transform: `scale(${spring({ frame: frame - Math.round((beats.phone - 1.4) * fps), fps, config: { damping: 12 } })})`,
              fontFamily: FONTS.mono,
              fontSize: 28,
              color: COLORS.text,
            }}
          >
            📱 df -h
            <div style={{ color: "#22c55e", fontSize: 24, marginTop: 4 }}>
              /dev/disk3 68% ✓
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  return { cues, Overlay };
};
