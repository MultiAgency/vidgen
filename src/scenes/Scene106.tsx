import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { MascotCue } from "../components/cues";
import { Timings } from "../posts";
import { COLORS, FONTS } from "../theme";
import { Chip, ease, SPOTS, useT, wordTime, Sfx } from "./props";

// 106 — Skills vs Tools vs Use Cases. Three labeled cards build up in turn
// (tool chips, the skill playbook, the use-case goals), then the first two
// slide together to compose the third.
export const buildScene106 = (timings: Timings) => {
  const w = (re: RegExp, opts?: { nth?: number; offset?: number }) =>
    wordTime(timings, re, opts);

  const beats = {
    tool: w(/^do:$/),
    toolChips: [w(/^Slack$/), w(/^pull$/), w(/^spreadsheet\./)],
    sandbox: w(/^sandboxed,/),
    boundary: w(/^security$/),
    skill: w(/^knows:$/),
    skillLines: [w(/^release$/), w(/^report$/), w(/^rules\.$/)],
    useCase: w(/^wanted:$/),
    goals: [w(/^briefing,/), w(/^monitor,/), w(/^assistant\.$/)],
    compose: w(/^composed$/),
    recap: w(/^Teach$/),
  };

  const cues: MascotCue[] = [
  ];

  const CARD = { tool: { x: 900 }, skill: { x: 1240 }, use: { x: 1580 } };
  const TOP = 690;

  const Overlay: React.FC = () => {
    const t = useT();
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const panel = (
      key: "tool" | "skill" | "use",
      inAt: number,
      title: string,
      color: string,
      rows: { label: string; at: number }[],
    ) => {
      if (t < inAt) return null;
      const pop = spring({ frame: frame - Math.round(inAt * fps), fps, config: { damping: 12 } });
      // compose: tool + skill drift toward the use-case card
      const cg =
        key !== "use" && t > beats.compose
          ? ease(Math.min(1, (t - beats.compose) / 0.8))
          : 0;
      const x = CARD[key].x + (key === "tool" ? cg * 380 : key === "skill" ? cg * 210 : 0);
      return (
        <div
          style={{
            position: "absolute",
            left: x - 155,
            top: TOP + (key === "use" ? 0 : cg * 12),
            width: 310,
            padding: "16px 20px",
            borderRadius: 16,
            border: `3px solid ${color}aa`,
            background: "rgba(15,23,42,0.94)",
            transform: `scale(${pop * (1 - cg * 0.25)})`,
            opacity: 1 - cg * 0.55,
            fontSize: 27,
            fontWeight: 800,
            color: COLORS.text,
          }}
        >
          {title}
          <div style={{ fontSize: 23, fontWeight: 600, color: COLORS.textMuted, marginTop: 6, lineHeight: 1.5 }}>
            {rows.map((r) =>
              t > r.at ? <div key={r.label}>{r.label}</div> : null,
            )}
          </div>
        </div>
      );
    };

    return (
      <div style={{ position: "absolute", inset: 0, fontFamily: FONTS.sans }}>
        <Sfx name="pop" at={beats.tool} /><Sfx name="pop" at={beats.skill} /><Sfx name="pop" at={beats.useCase} /><Sfx name="ding" at={beats.compose + 0.6} />
        {panel("tool", beats.tool, "🔧 TOOL — can do", "#60a5fa", [
          { label: "💬 send a Slack message", at: beats.toolChips[0] },
          { label: "🔀 open a pull request", at: beats.toolChips[1] },
          { label: "📊 read a spreadsheet", at: beats.toolChips[2] },
          { label: "🛡 sandboxed · gated", at: beats.sandbox },
        ])}
        {panel("skill", beats.skill, "📖 SKILL — knows", "#22c55e", [
          { label: "your release process", at: beats.skillLines[0] },
          { label: "your report format", at: beats.skillLines[1] },
          { label: "your rules", at: beats.skillLines[2] },
        ])}
        {panel("use", beats.useCase, "🎯 USE CASE — wanted", "#f59e0b", [
          { label: "☀️ morning briefing", at: beats.goals[0] },
          { label: "📈 portfolio monitor", at: beats.goals[1] },
          { label: "✈️ Telegram assistant", at: beats.goals[2] },
        ])}
        {t > beats.compose + 0.7 ? (
          <Chip icon="✨" x={SPOTS.bubble.x + 290} y={TOP - 30} size={56} />
        ) : null}
      </div>
    );
  };

  return { cues, Overlay };
};
