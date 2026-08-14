import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { MascotCue } from "../components/cues";
import { Timings } from "../posts";
import { COLORS, FONTS } from "../theme";
import { Card, ease, SPOTS, useT, wordTime, Sfx } from "./props";

// 103 — Explain Any Codebase. The 200k-line pile becomes a knowledge graph
// (nodes wire up as the voiceover says so), the wiki pages fan out, and the
// weekly PR card carries the real no-auto-merge policy.
const GRAPH_NODES = [
  { x: 0, y: 0 }, { x: 130, y: -50 }, { x: 250, y: 10 },
  { x: 90, y: 70 }, { x: 220, y: 110 }, { x: 330, y: -40 },
];
const GRAPH_EDGES: [number, number][] = [
  [0, 1], [1, 2], [0, 3], [3, 4], [1, 5], [2, 5], [2, 4],
];
const WIKI_PAGES = ["quickstart", "overview", "crates", "setup", "testing", "workflows"];

export const buildScene103 = (timings: Timings) => {
  const w = (re: RegExp, opts?: { nth?: number; offset?: number }) =>
    wordTime(timings, re, opts);

  const beats = {
    pile: w(/^Two$/, { offset: -0.2 }),
    pileOut: w(/^move:$/, { offset: -0.2 }),
    point: w(/^point$/),
    graph: w(/^graph$/),
    graphOut: w(/^writes$/, { offset: -0.2 }),
    pages: w(/^finds:$/),
    pagesOut: w(/^And$/, { offset: -0.4 }),
    wiki: w(/^wiki$/),
    pr: w(/^pull$/),
    merged: w(/^merge\.$/),
    prOut: w(/^Point\.$/, { offset: -0.2 }),
    proud: w(/^Point\.$/),
    jog: w(/^Docs$/),
  };

  const cues: MascotCue[] = [
  ];

  const Overlay: React.FC = () => {
    const t = useT();
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    return (
      <div style={{ position: "absolute", inset: 0, fontFamily: FONTS.sans }}>
        <Sfx name="ding" at={beats.merged} />
        {/* the inherited pile */}
        <Card
          x={SPOTS.card.x}
          y={SPOTS.card.y}
          width={420}
          inAt={beats.pile}
          outAt={beats.pileOut}
          border={`${COLORS.border}`}
          fontSize={30}
        >
          🗄 200,000 lines
          <div style={{ fontSize: 22, color: COLORS.textMuted, marginTop: 4 }}>
            3 READMEs · all stale
          </div>
        </Card>

        {/* knowledge graph wiring itself up */}
        {t > beats.graph && t < beats.graphOut ? (
          <svg
            width={420}
            height={200}
            style={{ position: "absolute", left: SPOTS.card.x - 180, top: SPOTS.card.y - 60, overflow: "visible" }}
          >
            {GRAPH_EDGES.map(([a, b], i) => {
              const drawAt = beats.graph + 0.15 + i * 0.18;
              if (t < drawAt) return null;
              const d = ease(Math.min(1, (t - drawAt) / 0.3));
              const n1 = GRAPH_NODES[a];
              const n2 = GRAPH_NODES[b];
              return (
                <line
                  key={i}
                  x1={n1.x + 40}
                  y1={n1.y + 90}
                  x2={n1.x + 40 + (n2.x - n1.x) * d}
                  y2={n1.y + 90 + (n2.y - n1.y) * d}
                  stroke={COLORS.primaryLight}
                  strokeWidth={3}
                  opacity={0.7}
                />
              );
            })}
            {GRAPH_NODES.map((n, i) => {
              const popAt = beats.graph + i * 0.15;
              if (t < popAt) return null;
              const p = spring({ frame: frame - Math.round(popAt * fps), fps, config: { damping: 11 } });
              return (
                <circle
                  key={i}
                  cx={n.x + 40}
                  cy={n.y + 90}
                  r={12 * p}
                  fill={COLORS.primaryLight}
                />
              );
            })}
          </svg>
        ) : null}

        {/* wiki pages fan out */}
        {WIKI_PAGES.map((page, i) => {
          const at = beats.pages + i * 0.25;
          if (t < at || t > beats.pagesOut) return null;
          const pop = spring({ frame: frame - Math.round(at * fps), fps, config: { damping: 12 } });
          const fade = t > beats.pagesOut - 0.5 ? Math.max(0, 1 - (t - (beats.pagesOut - 0.5)) / 0.5) : 1;
          return (
            <div
              key={page}
              style={{
                position: "absolute",
                left: 1010 + (i % 3) * 300,
                top: 700 + Math.floor(i / 3) * 100,
                padding: "12px 22px",
                borderRadius: 12,
                border: `3px solid ${COLORS.primaryLight}66`,
                background: "rgba(15,23,42,0.92)",
                transform: `scale(${pop * fade}) rotate(${(i % 3) - 1}deg)`,
                fontFamily: FONTS.mono,
                fontSize: 26,
                color: COLORS.text,
              }}
            >
              📄 {page}.md
            </div>
          );
        })}

        {/* the weekly PR, human-reviewed */}
        <Card
          x={SPOTS.bubble.x}
          y={SPOTS.bubble.y - 120}
          width={560}
          inAt={beats.pr - 0.3}
          outAt={beats.prOut}
          border={t >= beats.merged ? "#22c55eaa" : "#f97316aa"}
          fontSize={26}
        >
          🔀 docs: update OpenWiki wiki
          <div style={{ fontSize: 22, color: COLORS.textMuted, marginTop: 4 }}>
            {t >= beats.merged
              ? "✅ human-approved · merged"
              : "⏰ 0 8 * * 1 · NOT auto-merged — a human approves"}
          </div>
        </Card>
      </div>
    );
  };

  return { cues, Overlay };
};
