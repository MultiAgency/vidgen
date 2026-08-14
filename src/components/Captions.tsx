import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../theme";
import { Timings, WordTiming } from "../posts";

type Line = { words: WordTiming[]; start: number; end: number };

// Group word timings into caption lines, breaking on sentence punctuation or
// around six words — but only at syntactic boundaries: a line must never end
// on a function word ("serves the / web UI") or strand a preposition from its
// noun ("with file / tools"). Cut review, note 9.
const FUNCTION_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "with", "of", "to", "for", "on",
  "in", "at", "as", "then", "so", "your", "my", "every", "one", "before",
]);
const bare = (w: string) => w.replace(/[^a-zA-Z']/g, "").toLowerCase();

const toLines = (words: WordTiming[]): Line[] => {
  const lines: Line[] = [];
  let current: WordTiming[] = [];
  const push = (ws: WordTiming[]) => {
    if (ws.length) lines.push({ words: ws, start: ws[0].start, end: ws[ws.length - 1].end });
  };
  for (const word of words) {
    current.push(word);
    if (/[.!?:—]$/.test(word.text)) {
      push(current);
      current = [];
      continue;
    }
    if (current.length >= 6) {
      let split = current.length;
      // A comma near the end is the best break of all.
      if (/[,;]$/.test(current[split - 2]?.text ?? "")) split -= 1;
      // Never end on a function word — carry the trailing run to the next line.
      while (split > 2 && FUNCTION_WORDS.has(bare(current[split - 1].text))) split--;
      // Don't strand a preposition from the noun it introduces.
      if (split >= 4 && FUNCTION_WORDS.has(bare(current[split - 2].text))) split -= 2;
      push(current.slice(0, split));
      current = current.slice(split);
    }
  }
  push(current);
  return lines;
};

type CaptionsProps = {
  timings: Timings | null;
  accent: string;
  /** Offset (seconds) of audio start within the composition. */
  audioStart: number;
  fontSize: number;
};

export const Captions: React.FC<CaptionsProps> = ({
  timings,
  accent,
  audioStart,
  fontSize,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!timings) {
    return null;
  }
  const t = frame / fps - audioStart;
  const lines = toLines(timings.words);
  const line = lines.find((l) => t >= l.start && t <= l.end + 0.25);
  if (!line) {
    return null;
  }

  return (
    <div
      style={{
        fontFamily: FONTS.sans,
        fontSize,
        fontWeight: 800,
        lineHeight: 1.25,
        textAlign: "center",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "0.3em",
        textShadow: "0 4px 24px rgba(0,0,0,0.6)",
      }}
    >
      {line.words.map((word, i) => (
        // Emphasis must never affect layout: a scale bump on a long word eats
        // the flex gap beside it and words visually merge. Glow instead.
        <span
          key={i}
          style={{
            color: t >= word.start ? accent : COLORS.text,
            textShadow:
              t >= word.start && t <= word.end
                ? `0 0 24px ${accent}aa, 0 4px 24px rgba(0,0,0,0.6)`
                : "0 4px 24px rgba(0,0,0,0.6)",
          }}
        >
          {word.text}
        </span>
      ))}
    </div>
  );
};
