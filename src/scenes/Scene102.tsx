import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { MascotCue } from "../components/cues";
import { Timings } from "../posts";
import { COLORS, FONTS } from "../theme";
import { Card, Chip, ease, SPOTS, useT, wordTime, Sfx } from "./props";

// 102 — One Tag, Three Announcements. The tag banner goes up, the approval
// card gates the publish (with the real "safety gate" framing), and the three
// parcels fan out with delivery receipts.
export const buildScene102 = (timings: Timings) => {
  const w = (re: RegExp, opts?: { nth?: number; offset?: number }) =>
    wordTime(timings, re, opts);

  const beats = {
    tag: w(/^release\.\.\.$/, { offset: -0.3 }),
    tagOut: w(/^Hand$/, { offset: -0.2 }),
    approval: w(/^approval$/),
    approved: w(/^publish\.\.\.$/, { offset: 0.4 }),
    approvalOut: w(/^fan-out:$/, { offset: -0.2 }),
    fanout: w(/^fan-out:$/),
    email: w(/^email$/),
    thread: w(/^thread$/),
    receiptsOut: w(/^The$/, { offset: -0.3 }),
    skill: w(/^skill,$/),
    skillOut: w(/^Tag$/, { offset: -0.3 }),
    jog: w(/^Announce$/, { offset: -0.3 }),
  };

  const cues: MascotCue[] = [
  ];

  const Overlay: React.FC = () => {
    const t = useT();
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const approved = t >= beats.approved;

    const receipt = (label: string, at: number, x: number) => {
      if (t < at) return null;
      const fly = ease(Math.min(1, (t - at) / 0.5));
      return (
        <div
          style={{
            position: "absolute",
            left: x,
            top: SPOTS.bubble.y - 60 - fly * 30,
            width: 330,
            padding: "14px 20px",
            borderRadius: 14,
            border: "3px solid #22c55eaa",
            background: "rgba(15,23,42,0.92)",
            transform: `scale(${spring({ frame: frame - Math.round(at * fps), fps, config: { damping: 12 } }) * (t > beats.receiptsOut ? Math.max(0, 1 - (t - beats.receiptsOut) / 0.6) : 1)})`,
            fontSize: 26,
            fontWeight: 700,
            color: COLORS.text,
          }}
        >
          {label}
        </div>
      );
    };

    return (
      <div style={{ position: "absolute", inset: 0, fontFamily: FONTS.sans }}>
        <Sfx name="ding" at={beats.approved} /><Sfx name="pop" at={beats.fanout + 0.3} /><Sfx name="pop" at={beats.email + 0.3} /><Sfx name="pop" at={beats.thread + 0.3} />
        {/* the tag banner */}
        <Card
          x={SPOTS.card.x}
          y={620}
          width={360}
          inAt={beats.tag}
          outAt={beats.tagOut}
          border={`${COLORS.primaryLight}88`}
          fontSize={30}
        >
          <span style={{ fontFamily: FONTS.mono }}>🏷 v0.22.0</span>
        </Card>

        {/* the approval gate, real framing from the design mockup */}
        <Card
          x={SPOTS.card.x}
          y={620}
          width={520}
          inAt={beats.approval}
          outAt={beats.approvalOut}
          border={approved ? "#22c55eaa" : "#f97316aa"}
          fontSize={30}
        >
          {approved ? "✅ Approved — publishing release" : "✋ create_release — safety gate"}
          <div style={{ fontSize: 22, color: COLORS.textMuted, marginTop: 4 }}>
            {approved ? "external write · granted once" : "Approve ▢ always"}
          </div>
        </Card>

        {/* the three parcels */}
        {t > beats.fanout ? (
          <Chip icon="📝" x={SPOTS.bubble.x - 320} y={SPOTS.bubble.y - 180} size={64} />
        ) : null}
        {receipt("📝 release notes → GitHub ✓", beats.fanout + 0.3, SPOTS.bubble.x - 420)}
        {receipt("✉️ draft saved in Gmail", beats.email + 0.3, SPOTS.bubble.x - 60)}
        {receipt("🧵 Delivered to your chat", beats.thread + 0.3, SPOTS.bubble.x - 240)}

        {/* the skill playbook */}
        <Card
          x={SPOTS.bubble.x}
          y={SPOTS.bubble.y - 100}
          width={460}
          inAt={beats.skill}
          outAt={beats.skillOut}
          border={`${COLORS.primaryLight}88`}
          fontSize={28}
        >
          📖 release-announcement.md
          <div style={{ fontSize: 22, color: COLORS.textMuted, marginTop: 4 }}>
            your tone · your structure · your rules
          </div>
        </Card>
      </div>
    );
  };

  return { cues, Overlay };
};
