import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Ico } from "../../components/icons";
import { COLORS } from "../../theme";
import { CustomBeatProps, CustomRegistry } from "../fromSpec";
import { AT, Chip, useT } from "../props";

// Bespoke visuals for 104 — the four pieces beyond the schema's prop kinds:
// the surface label chips over the console, the chat front door, the
// issue→PR pipeline, and the sleep particles over the dozing figurine.

const SURFACES = ["session timeline", "logs", "file browser", "approval gates"];

const SurfaceChips: React.FC<CustomBeatProps> = ({ in: tIn, slot, params }) => {
  const t = useT();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ats = [tIn, params.at1 as number, params.at2 as number, params.at3 as number];
  return (
    <div
      style={{
        position: "absolute",
        left: slot.x,
        top: slot.y + 12,
        width: slot.w,
        textAlign: "center",
      }}
    >
      {SURFACES.map((label, i) => {
        const at = ats[i];
        if (t < at) return null;
        const p = spring({ frame: frame - Math.round(at * fps), fps, config: { damping: 11 } });
        return (
          <div
            key={label}
            style={{
              display: "inline-block",
              margin: "0 12px 12px 0",
              padding: "10px 22px",
              borderRadius: 999,
              border: `2.5px solid ${COLORS.primaryLight}`,
              color: COLORS.primaryLight,
              fontSize: 24,
              fontWeight: 700,
              transform: `scale(${0.7 + p * 0.3})`,
              opacity: p,
            }}
          >
            {label}
          </div>
        );
      })}
    </div>
  );
};

// The chat front door: knocks twice, then swings open to reveal the bubble.
const FrontDoor: React.FC<CustomBeatProps> = ({ in: at, out: outAt, slot, params }) => {
  const t = useT();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const knockAt = params.knock as number;
  const kLocal = t - knockAt;
  const knock =
    kLocal > 0 && kLocal < 0.7
      ? Math.abs(Math.sin(kLocal * Math.PI * 5.5)) * (1 - kLocal / 0.7) * 6
      : 0;
  const open = interpolate(kLocal, [0.7, 1.2], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const outFade = interpolate(t, [outAt - 0.4, outAt], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pop =
    spring({ frame: frame - Math.round(at * fps), fps, config: { damping: 12 } }) * outFade;
  return (
    <div
      style={{
        position: "absolute",
        left: slot.x + 20,
        top: slot.y + 20,
        transform: `scale(${pop}) translateX(${knock}px)`,
      }}
    >
      <div
        style={{
          width: 300,
          height: 340,
          borderRadius: 22,
          border: `3px solid ${COLORS.primaryLight}`,
          background: "rgba(20,30,56,0.95)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
        }}
      >
        {/* warm light spills out as the leaf swings away */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 80% 60% at 30% 50%, rgba(251,191,36,0.28), transparent 70%)",
            opacity: open,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(115deg, #3b5288, #24356a)",
            border: `2.5px solid ${COLORS.primaryLight}`,
            borderRadius: 18,
            transformOrigin: "left center",
            transform: `perspective(800px) rotateY(${open * -85}deg)`,
            boxShadow: open > 0.05 ? "18px 0 40px rgba(0,0,0,0.45)" : "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: 26,
              top: "47%",
              width: 20,
              height: 20,
              borderRadius: 10,
              background: "#e2e8f0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
            }}
          />
          {/* panel lines so the leaf reads as a door, not a card */}
          <div style={{ position: "absolute", inset: 24, border: "2px solid rgba(226,232,240,0.25)", borderRadius: 10 }} />
        </div>
        <Chip icon="💬" x={150} y={140} size={92} opacity={open} />
      </div>
      <div style={{ textAlign: "center", fontSize: 26, fontWeight: 800, color: COLORS.text, marginTop: 12 }}>
        Telegram · Slack
      </div>
      {/* the message that steps through the open door */}
      <div
        style={{
          position: "absolute",
          left: 240,
          top: 96,
          width: 460,
          padding: "16px 22px",
          borderRadius: "22px 22px 22px 6px",
          border: `2.5px solid ${COLORS.primaryLight}`,
          background: "rgba(13,20,38,0.95)",
          fontSize: 25,
          fontWeight: 600,
          color: COLORS.text,
          opacity: open,
          transform: `translateX(${(1 - open) * -60}px)`,
        }}
      >
        💬 IronClaw: 3 issues triaged overnight ✅
      </div>
    </div>
  );
};

// The loop: issue → branch → fix → PR → comment, with a traveling pulse.
const FLOW: { icon: string; label: string }[] = [
  { icon: "bug", label: "issue" },
  { icon: "branch", label: "branch" },
  { icon: "note", label: "fix" },
  { icon: "branch", label: "PR" },
  { icon: "chat", label: "comment" },
];

const Pipeline: React.FC<CustomBeatProps> = ({ in: tIn, slot }) => {
  const t = useT();
  return (
    <div
      style={{
        position: "absolute",
        left: slot.x,
        top: slot.y + 40,
        width: slot.w,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {FLOW.map((step, i) => {
        const at = tIn + i * 0.35;
        const p = interpolate(t, [at, at + 0.35], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const pulseT = ((t - tIn) * 1.4) % 1;
        const pulseHere = Math.abs(pulseT * FLOW.length - (i + 0.5)) < 0.5;
        return (
          <React.Fragment key={i}>
            {i > 0 ? (
              <div
                style={{ width: 52, height: 3.5, background: "#f43f5e99", transform: `scaleX(${p})` }}
              />
            ) : null}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                opacity: p,
                transform: `translateY(${(1 - p) * 16}px)`,
              }}
            >
              <div
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  background: "rgba(13,20,38,0.92)",
                  border: `2.5px solid ${pulseHere ? "#f43f5e" : "#f43f5e77"}`,
                  boxShadow: pulseHere ? "0 0 18px #f43f5e88" : "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ico name={step.icon} size={54} color="#e2e8f0" />
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.text }}>
                {step.label}
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

// Sleep particles over the dozing figurine (payoff variant: two z's, drifting
// up from the pillow line — tuned differently from 097's sitting sleeper).
const Zzz: React.FC<CustomBeatProps> = () => {
  const t = useT();
  return (
    <>
      {[0, 1].map((i) => {
        const phase = (t * 0.45 + i * 0.5) % 1;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: AT.head.x + 40 + phase * 40 + i * 14,
              top: AT.head.y + 60 - phase * 110,
              fontSize: 30 + i * 12,
              fontWeight: 800,
              color: COLORS.textMuted,
              opacity: Math.sin(Math.PI * phase) * 0.75,
              transform: `rotate(${-10 + i * 9}deg)`,
            }}
          >
            z
          </div>
        );
      })}
    </>
  );
};

export const CUSTOM_104: CustomRegistry = {
  SurfaceChips,
  FrontDoor,
  Pipeline,
  Zzz,
};
