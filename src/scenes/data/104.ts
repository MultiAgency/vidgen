import { SceneSpec } from "../schema";

// 104 — From Install to Autopilot (flagship cut), as pure data. Every
// sentence has a beat: vault seal on "encrypted at rest", the front door
// knocks open, the issue physically arrives before the loop runs on it, the
// skill book types its playbook lines — and the film ends on the sleep
// payoff: celebrate on "From prompt to PR", then the knight sleeps while the
// routine's digest arrives. Camera reframes per section.
export const scene104: SceneSpec = {
  slug: "104-dev-workflow",
  beats: [
    {
      id: "vault-card",
      in: { word: "^encrypted$" },
      out: { word: "^typing$", offset: -0.2 },
      slot: "top-right-card",
      prop: {
        kind: "card",
        width: 420,
        fontSize: 26,
        states: [
          { text: [{ text: "🗝 API key", align: "center" }], border: "#22c55eaa" },
          {
            at: { ref: "vault-card", offset: 0.9 },
            text: [{ text: "🔒 sealed — encrypted at rest", align: "center" }],
            border: "#22c55eaa",
          },
        ],
      },
      note: "the vault seals on 'encrypted at rest'",
    },
    {
      id: "surfaces-footage",
      in: { word: "^session$", offset: -0.4 },
      out: { word: "^Next,$", offset: -0.2 },
      slot: "hero-panel",
      prop: { kind: "footage", src: "demo/typing.mp4" },
      note: "the real console, not a bullet list",
    },
    {
      id: "surface-chips",
      in: { word: "^session$" },
      out: { word: "^Next,$", offset: -0.2 },
      slot: "surfaces-strip",
      prop: {
        kind: "custom",
        component: "SurfaceChips",
        params: {
          at1: { word: "^logs,$" },
          at2: { word: "^file$" },
          at3: { word: "^approval$" },
        },
      },
      note: "labels land under actual product pixels as each is spoken",
    },
    {
      id: "door",
      in: { word: "^Telegram$" },
      out: { word: "^Then$", offset: -0.05 },
      slot: "door-stage",
      prop: {
        kind: "custom",
        component: "FrontDoor",
        // Early enough that the open-door + message state HOLDS before the
        // section fade — with the knock on the word itself, the reveal only
        // ever happened mid-fadeout (why the old door read as an empty box).
        params: { knock: { word: "^front$", offset: -0.9 } },
      },
    },
    {
      id: "knock-1",
      in: { word: "^front$", offset: -0.85 },
      slot: "none",
      prop: { kind: "sfx", name: "stamp", volume: 0.3 },
    },
    {
      id: "knock-2",
      in: { word: "^front$", offset: -0.52 },
      slot: "none",
      prop: { kind: "sfx", name: "stamp", volume: 0.3 },
    },
    {
      id: "gate-card",
      in: { word: "^reads$" },
      out: { word: "^Now$", offset: -0.3 },
      slot: "stage-right-low",
      prop: {
        kind: "card",
        width: 600,
        fontSize: 26,
        lineHeight: 1.7,
        states: [
          {
            text: [
              { text: "github.list_issues → allow", mono: true, color: "#22c55e" },
              { text: "github.create_issue → ask", mono: true, color: "#f97316" },
            ],
          },
        ],
      },
      note: "reads allow / writes ask",
    },
    {
      id: "issue-catch",
      in: { word: "^issue\\.$", offset: -0.3 },
      slot: "mascot-shield",
      prop: { kind: "caught", icon: "🐛", rest: "shield", restOffset: { x: -10, y: -24 }, fromX: 470 },
    },
    {
      id: "pipeline",
      in: { word: "^Branch,$" },
      out: { word: "^Put$", offset: -0.3 },
      slot: "pipeline-band",
      prop: { kind: "custom", component: "Pipeline" },
      note: "issue → branch → fix → PR → comment, with a traveling pulse",
    },
    {
      id: "issue-card",
      in: { word: "^issue\\.$", offset: -0.3 },
      out: { ref: "pipeline", offset: 0.6 },
      slot: "stage-right-high",
      prop: { kind: "issue", id: "issue #412", title: "retries drop queued jobs" },
      note: "the issue has a body — drops on 'Give it an issue.' and hands off to the pipeline",
    },
    {
      id: "footage-typing",
      in: { word: "^Put$", offset: -0.1 },
      out: { word: "^approve$", offset: -0.5 },
      slot: "hero-panel",
      prop: { kind: "footage", src: "demo/typing.mp4" },
      note: "REAL footage, demo-focus: the console owns the frame",
    },
    {
      id: "footage-gate",
      in: { word: "^approve$", offset: -0.4 },
      out: { word: "^playbooks$", offset: -0.3 },
      slot: "hero-panel",
      prop: { kind: "footage", src: "demo/gate.mp4", clipStart: 0.8 },
    },
    {
      id: "book-card",
      in: { word: "^playbooks$" },
      out: { word: "^From$", offset: -0.3 },
      slot: "stage-right-low",
      prop: {
        kind: "card",
        width: 560,
        fontSize: 26,
        states: [
          {
            border: "#22c55eaa",
            text: [
              { text: "📖 release-announcement.md", align: "center" },
              { text: "# your release format", mono: true, size: 22, gap: 6, color: "#94a3b8", at: { word: "^Markdown$" } },
              { text: "# your triage rules", mono: true, size: 22, color: "#94a3b8", at: { word: "^skills$" } },
            ],
          },
        ],
      },
      note: "the skill book types its playbook lines",
    },
    {
      id: "riser",
      in: { word: "^box\\.$", offset: -0.4 },
      slot: "none",
      prop: { kind: "sfx", name: "riser", volume: 0.45 },
    },
    // One consistent "success" sound for every confirmation moment:
    // installed:true, the post-edit check paying off, the auth approve.
    {
      id: "ding-equip",
      in: { word: "^Forty-nine$", offset: -0.1 },
      slot: "none",
      prop: { kind: "sfx", name: "ding", volume: 0.42 },
    },
    {
      id: "ding-selffix",
      in: { word: "^itself$" },
      slot: "none",
      prop: { kind: "sfx", name: "ding", volume: 0.42 },
    },
    {
      id: "ding-approve",
      in: { word: "^once\\.$", offset: 0.3 },
      slot: "none",
      prop: { kind: "sfx", name: "ding", volume: 0.5 },
    },
    {
      id: "stamp-prompt",
      in: { word: "^From$", nth: -1 },
      slot: "none",
      prop: { kind: "sfx", name: "stamp", volume: 0.45 },
    },
    // Sleep payoff: the standing idle hands over to the takeover clips —
    // celebrate jump on "From prompt to PR", then asleep (slowed to cover
    // the window) while the routine's digest arrives.
    {
      id: "celebrate",
      in: { word: "^From$", nth: -1 },
      out: { ref: "celebrate", offset: 1.35 },
      slot: "none",
      prop: { kind: "clip", name: "celebrate" },
    },
    {
      id: "doze",
      in: { word: "^while$" },
      out: { ref: "doze", offset: 4.3 },
      slot: "none",
      prop: { kind: "clip", name: "doze", playbackRate: 0.62 },
    },
    {
      id: "digest-card",
      in: { word: "^while$", offset: 0.9 },
      out: { word: "^while$", offset: 11.9 },
      slot: "high-wide",
      prop: {
        kind: "card",
        width: 700,
        sound: "ding",
        states: [
          { text: [{ text: "📬 Daily digest — open PRs triaged", align: "center" }], border: "#60a5fa" },
        ],
      },
    },
    {
      id: "zzz",
      in: { word: "^while$", offset: 0.5 },
      out: { word: "^while$", offset: 30 },
      slot: "none",
      prop: { kind: "custom", component: "Zzz" },
    },
  ],
  cues: [
    // The takeover window: the standing idle hides for the whole payoff.
    { at: { word: "^From$", nth: -1, offset: -0.1 }, kind: "hide", durationSeconds: 14 },
  ],
  // Camera: neutral open → gentle push through setup → tight on the loop
  // section → settle wide as the film goes to sleep.
  camera: [
    { at: { at: 0 }, scale: 1 },
    { at: { word: "^Day$" }, scale: 1.02 },
    { at: { word: "^Then$" }, scale: 1.04, x: -10 },
    { at: { word: "^Now$" }, scale: 1.07, x: -18, y: -8 },
    { at: { word: "^Put$" }, scale: 1.03, x: -6 },
    { at: { word: "^From$", nth: -1, offset: -0.4 }, scale: 1, x: 0, y: 0 },
  ],
  // Both real-footage beats run in demo-focus: the console owns the frame,
  // captions drop to the lower third, the host leans in from the corner.
  focus: [
    { from: { word: "^session$", offset: -0.4 }, to: { word: "^Next,$", offset: -0.2 } },
    { from: { word: "^Put$", offset: -0.25 }, to: { word: "^playbooks$", offset: -0.3 } },
  ],
};
