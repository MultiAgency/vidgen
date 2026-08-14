import { SceneSpec } from "../schema";

// 097 — Never Miss an Issue Again, as pure data (the schema pilot).
// Expressed from the hand TSX version; must render pixel-identical to it
// before the TSX is deleted.
export const scene097: SceneSpec = {
  slug: "097-github-notifications",
  beats: [
    {
      id: "sleep-clip",
      in: { at: 0 },
      out: { word: "^With$", offset: 0.15 },
      slot: "none",
      prop: { kind: "clip", name: "doze-loop", playbackRate: 0.8, loopSeconds: 5.26, hideMascot: true },
      note: "the film opens on the 3D figurine sleeping; idle takes over on wake",
    },
    {
      id: "zzz",
      in: { at: 0.4 },
      out: { word: "^With$", offset: -0.2 },
      slot: "mascot-head",
      prop: { kind: "custom", component: "Zzz" },
    },
    {
      id: "overnight-issue",
      in: { at: 1.2 },
      out: { word: "^With$", offset: 1.2 },
      slot: "beside-mascot",
      prop: { kind: "issue", id: "issue #347", title: "login flaky after retry", width: 480, size: 0.9 },
      note: "the inciting incident has a body — lands while he sleeps",
    },
    {
      id: "routine",
      in: { word: "^routine$" },
      out: { word: "^New$", offset: -0.4 },
      slot: "center-low",
      prop: {
        kind: "card",
        width: 560,
        fontSize: 26,
        lineHeight: 1.7,
        states: [
          {
            text: [
              { text: "» check my repos for anything new", mono: true },
              { text: "⏰ every 2 hours", mono: true, color: "#8ea0bd" },
            ],
          },
        ],
      },
      note: "plain words plus a schedule, exactly as spoken",
    },
    {
      id: "catch-issue",
      in: { word: "^New$" },
      slot: "mascot-shield",
      prop: {
        kind: "caught", icon: "🐛", rest: "shield", restOffset: { x: -26, y: -18 }, fromX: 420,
        deliver: { at: { word: "^delivers", offset: 0.8 }, to: "chat-target" },
      },
    },
    {
      id: "catch-pr",
      in: { word: "^pull$" },
      slot: "mascot-shield",
      prop: {
        kind: "caught", icon: "🔀", rest: "shield", restOffset: { x: 10, y: -34 }, fromX: 560,
        deliver: { at: { word: "^delivers", offset: 1.1 }, to: "chat-target" },
      },
    },
    {
      id: "catch-comment",
      in: { word: "^comments:", offset: 0.6 },
      slot: "mascot-shield",
      prop: {
        kind: "caught", icon: "💬", rest: "shield", restOffset: { x: 42, y: -12 }, fromX: 500,
        deliver: { at: { word: "^delivers", offset: 1.5 }, to: "chat-target" },
      },
    },
    {
      id: "swat-bot",
      in: { word: "^bots,", offset: 0.6 },
      slot: "none",
      prop: { kind: "swatted", icon: "🤖" },
    },
    {
      id: "swat-driveby",
      in: { word: "^drive-by", offset: 0.6 },
      slot: "none",
      prop: { kind: "swatted", icon: "💬" },
    },
    {
      id: "digest",
      in: { word: "^delivers", offset: -0.2 },
      out: { word: "^refreshing,", offset: 2.6 },
      slot: "chat-bubble",
      prop: {
        kind: "custom",
        component: "DigestBubble",
        params: { deliver: { word: "^delivers", offset: 0.8 } },
      },
      note: "the digest assembles line by line as the caught icons arrive",
    },
    {
      id: "approval-ding",
      in: { word: "^default," },
      slot: "none",
      prop: { kind: "sfx", name: "ding", volume: 0.5 },
    },
    {
      id: "approval",
      in: { word: "^asks$" },
      out: { word: "^remember\\.", offset: 0.6 },
      slot: "center-high",
      prop: {
        kind: "card",
        width: 420,
        states: [
          { text: [{ text: "✋ risky action — approve?" }], border: "#f97316aa" },
          { at: { word: "^default," }, text: [{ text: "✅ approved — proceed" }], border: "#22c55eaa" },
        ],
      },
    },
  ],
  cues: [
    { at: { word: "^bots,", offset: 0.6 }, kind: "swat" },
    { at: { word: "^drive-by", offset: 0.6 }, kind: "swat" },
  ],
};
