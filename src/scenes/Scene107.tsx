import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { MascotCue } from "../components/cues";
import { Timings } from "../posts";
import { COLORS, FONTS } from "../theme";
import { Card, CaughtIcon, AT, SPOTS, useT, wordTime, Sfx } from "./props";

// 107 — Why Your Agent Needs a TEE. The secrets land on the shield, the
// "who can see?" onlookers each get denied as the vault seals, and the
// attestation check flips green before any secret is sent.
export const buildScene107 = (timings: Timings) => {
  const w = (re: RegExp, opts?: { nth?: number; offset?: number }) =>
    wordTime(timings, re, opts);

  const beats = {
    secrets: [w(/^messages,/), w(/^calendar,/), w(/^keys\.$/)],
    who: w(/^who$/),
    whoOut: w(/^ordinary$/, { offset: -0.2 }),
    server: w(/^ordinary$/),
    serverOut: w(/^trusted$/, { offset: -0.3 }),
    vault: w(/^hardware-sealed$/),
    deny: [w(/^operating$/), w(/^cloud$/), w(/^administrator$/)],
    vaultOut: w(/^hardware$/, { offset: -0.3 }),
    attest: w(/^prove$/),
    attestOk: w(/^secret\.$/),
    attestOut: w(/^standard$/, { offset: -0.2 }),
    verify: w(/^verify$/),
    proud: w(/^IronClaw$/),
  };

  const cues: MascotCue[] = [
    { at: beats.deny[0], kind: "swat" },
    { at: beats.deny[2], kind: "swat" },
  ];

  const DENIED = ["operating system", "cloud provider", "administrator"];

  const Overlay: React.FC = () => {
    const t = useT();
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    return (
      <div style={{ position: "absolute", inset: 0, fontFamily: FONTS.sans }}>
        <Sfx name="stamp" at={beats.deny[0]} /><Sfx name="stamp" at={beats.deny[1]} /><Sfx name="stamp" at={beats.deny[2]} /><Sfx name="ding" at={beats.attestOk} />
        {/* what the agent holds: secrets land on the shield */}
        <CaughtIcon icon="💬" t={t} fallAt={beats.secrets[0]} rest={{ x: AT.shield.x - 28, y: AT.shield.y - 20 }} fromX={430} />
        <CaughtIcon icon="📅" t={t} fallAt={beats.secrets[1]} rest={{ x: AT.shield.x + 10, y: AT.shield.y - 36 }} fromX={520} />
        <CaughtIcon icon="🗝️" t={t} fallAt={beats.secrets[2]} rest={{ x: AT.shield.x + 44, y: AT.shield.y - 14 }} fromX={470} />

        {/* the uncomfortable question */}
        <Card x={SPOTS.card.x} y={SPOTS.card.y} width={420} inAt={beats.who} outAt={beats.whoOut} border="#8b5cf6aa">
          👁 who can see what it sees?
        </Card>

        {/* ordinary server */}
        <Card x={SPOTS.card.x} y={SPOTS.card.y} width={470} inAt={beats.server} outAt={beats.serverOut} border="#ef4444aa" fontSize={28}>
          🖥 ordinary server
          <div style={{ fontSize: 22, color: "#ef4444", marginTop: 4 }}>
            visible to whoever runs the machine
          </div>
        </Card>

        {/* the vault: onlookers denied one by one */}
        {t > beats.vault ? (
          <div
            style={{
              position: "absolute",
              left: SPOTS.bubble.x - 240,
              top: SPOTS.bubble.y - 190,
              width: 480,
              padding: "18px 26px",
              borderRadius: 16,
              border: "3px solid #8b5cf6aa",
              background: "rgba(139,92,246,0.1)",
              transform: `scale(${spring({ frame: frame - Math.round(beats.vault * fps), fps, config: { damping: 12 } }) * (t > beats.vaultOut ? Math.max(0, 1 - (t - beats.vaultOut) / 0.5) : 1)})`,
              fontSize: 28,
              fontWeight: 800,
              color: COLORS.text,
            }}
          >
            🔒 TEE — hardware-sealed vault
            <div style={{ fontSize: 23, fontWeight: 600, marginTop: 8, lineHeight: 1.6 }}>
              {DENIED.map((label, i) =>
                t > beats.deny[i] ? (
                  <div key={label} style={{ color: COLORS.textMuted }}>
                    <span style={{ color: "#ef4444", fontWeight: 900 }}>✗</span> {label} — can't read
                  </div>
                ) : null,
              )}
            </div>
          </div>
        ) : null}

        {/* attestation flips green */}
        <Card
          x={SPOTS.bubble.x}
          y={SPOTS.bubble.y - 40}
          width={500}
          inAt={beats.attest}
          outAt={beats.attestOut}
          border={t >= beats.attestOk ? "#22c55eaa" : "#8b5cf6aa"}
          fontSize={28}
        >
          {t >= beats.attestOk ? "✅ code verified — secrets unlocked" : "🔍 prove what code is running…"}
        </Card>
      </div>
    );
  };

  return { cues, Overlay };
};
