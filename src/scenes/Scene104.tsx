import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { MascotCue } from "../components/cues";
import { Ico } from "../components/icons";
import { Timings } from "../posts";
import { COLORS, FONTS } from "../theme";
import { staticFile } from "remotion";
import { ClipMascot } from "../components/ClipMascot";
import { AT, Card, CaughtIcon, Chip, FootagePanel, IssueCard, SPOTS, Sfx, useT, wordTime } from "./props";
import { CameraKey } from "./index";

// 104 — From Install to Autopilot (flagship cut). Every sentence has a beat:
// vault seal on "encrypted at rest", the front door knocks open, the issue
// physically arrives before the loop runs on it, the skill book types its
// playbook lines — and the film ends on the sleep payoff: celebrate on
// "From prompt to PR", then the knight sits asleep while the routine's
// digest arrives. Camera reframes per section.
const SURFACES = ["session timeline", "logs", "file browser", "approval gates"];
const FLOW: { icon: string; label: string }[] = [
  { icon: "bug", label: "issue" },
  { icon: "branch", label: "branch" },
  { icon: "note", label: "fix" },
  { icon: "branch", label: "PR" },
  { icon: "chat", label: "comment" },
];

export const buildScene104 = (timings: Timings) => {
  const w = (re: RegExp, opts?: { nth?: number; offset?: number }) =>
    wordTime(timings, re, opts);

  const beats = {
    vault: w(/^encrypted$/),
    vaultOut: w(/^typing$/, { offset: -0.2 }),
    surfaces: [w(/^session$/), w(/^logs,$/), w(/^file$/), w(/^approval$/)],
    surfacesOut: w(/^Next,$/, { offset: -0.2 }),
    door: w(/^Telegram$/),
    // Early enough that the open-door + message state HOLDS before the
    // section fade — with the knock on the word itself, the reveal only ever
    // happened mid-fadeout (why the old door always read as an empty box).
    knock: w(/^front$/, { offset: -0.9 }),
    doorOut: w(/^Then$/, { offset: -0.05 }),
    gate: w(/^reads$/),
    gateOut: w(/^Now$/, { offset: -0.3 }),
    issue: w(/^issue\.$/, { offset: -0.3 }),
    flow: w(/^Branch,$/),
    flowOut: w(/^Put$/, { offset: -0.3 }),
    footageType: w(/^Put$/, { offset: -0.1 }),
    footageTypeOut: w(/^approve$/, { offset: -0.5 }),
    footageGate: w(/^approve$/, { offset: -0.4 }),
    footageGateOut: w(/^playbooks$/, { offset: -0.3 }),
    approval: w(/^approve$/),
    approvalOk: w(/^once\.$/, { offset: 0.3 }),
    approvalOut: w(/^Teach$/, { offset: -0.2 }),
    book: w(/^playbooks$/),
    bookLines: [w(/^Markdown$/), w(/^skills$/)],
    bookOut: w(/^From$/, { offset: -0.3 }),
    riser: w(/^box\.$/, { offset: -0.4 }),
    equipOk: w(/^Forty-nine$/, { offset: -0.1 }),
    selfFix: w(/^itself$/),
    prompt: w(/^From$/, { nth: -1 }),
    sleep: w(/^while$/, { offset: -0.1 }),
  };

  const cues: MascotCue[] = [
    // The payoff: the standing idle hides and the takeover clips run —
    // celebrate jump on "From prompt to PR", then the sleeping clip (slowed
    // to cover the window) for "while you sleep".
    { at: beats.prompt - 0.1, kind: "hide", durationSeconds: 14 },
  ];

  // Camera: neutral open → gentle push through setup → tight on the loop
  // section → settle wide as the film goes to sleep.
  const camera: CameraKey[] = [
    { at: 0, scale: 1 },
    { at: w(/^Day$/), scale: 1.02 },
    { at: w(/^Then$/), scale: 1.04, x: -10 },
    { at: w(/^Now$/), scale: 1.07, x: -18, y: -8 },
    { at: w(/^Put$/), scale: 1.03, x: -6 },
    { at: beats.prompt - 0.4, scale: 1, x: 0, y: 0 },
  ];

  const Overlay: React.FC = () => {
    const t = useT();
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    return (
      <div style={{ position: "absolute", inset: 0, fontFamily: FONTS.sans }}>
        <Sfx name="riser" at={beats.riser} volume={0.45} />
        {/* One consistent "success" sound for every confirmation moment:
            installed:true, the post-edit check paying off, the auth approve —
            and a hit under the celebrate pose. */}
        <Sfx name="ding" at={beats.equipOk} volume={0.42} />
        <Sfx name="ding" at={beats.selfFix} volume={0.42} />
        <Sfx name="ding" at={beats.approvalOk} volume={0.5} />
        <Sfx name="stamp" at={beats.prompt} volume={0.45} />

        {/* the vault seals on "encrypted at rest" */}
        <Card
          x={1560}
          y={250}
          width={420}
          inAt={beats.vault}
          outAt={beats.vaultOut}
          border="#22c55eaa"
          fontSize={26}
        >
          {t < beats.vault + 0.9 ? "🗝 API key" : "🔒 sealed — encrypted at rest"}
        </Card>

        {/* WebUI surfaces: the real console, not a bullet list — the chips
            below become labels under actual product pixels (cut review, note 5). */}
        <FootagePanel
          src={staticFile("demo/typing.mp4")}
          inAt={beats.surfaces[0] - 0.4}
          outAt={beats.surfacesOut}
          x={1040}
          y={110}
          width={1280}
        />
        {t < beats.surfacesOut ? (
          <div
            style={{
              position: "absolute",
              left: 400,
              top: 22,
              width: 1280,
              textAlign: "center",
            }}
          >
            {SURFACES.map((label, i) => {
              const at = beats.surfaces[i];
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
        ) : null}

        {/* the front door: knocks, then opens */}
        {t > beats.door && t < beats.doorOut ? (
          <>
            <Sfx name="stamp" at={beats.knock + 0.05} volume={0.3} />
            <Sfx name="stamp" at={beats.knock + 0.38} volume={0.3} />
            <FrontDoor at={beats.door} knockAt={beats.knock} outAt={beats.doorOut} />
          </>
        ) : null}

        {/* reads allow / writes ask */}
        <Card
          x={SPOTS.bubble.x - 80}
          y={690}
          width={600}
          inAt={beats.gate}
          outAt={beats.gateOut}
          border={`${COLORS.primaryLight}88`}
          fontSize={26}
        >
          <div style={{ fontFamily: FONTS.mono, lineHeight: 1.7, textAlign: "left" }}>
            <div style={{ color: "#22c55e" }}>github.list_issues → allow</div>
            <div style={{ color: "#f97316" }}>github.create_issue → ask</div>
          </div>
        </Card>

        {/* the issue physically arrives */}
        <CaughtIcon
          icon="🐛"
          t={t}
          fallAt={beats.issue}
          rest={{ x: AT.shield.x - 10, y: AT.shield.y - 24 }}
          fromX={470}
        />

        {/* the issue has a body: a stylized issue card drops onto the stage
            at "Give it an issue." and hands off to the pipeline (plan W3). */}
        <IssueCard
          inAt={beats.issue}
          outAt={beats.flow + 0.6}
          x={1080}
          yRest={300}
          id="issue #412"
          title="retries drop queued jobs"
        />

        {/* the loop: issue → branch → fix → PR → comment, with a pulse */}
        {t > beats.flow && t < beats.flowOut ? (
          <div
            style={{
              position: "absolute",
              left: 860,
              top: 660,
              right: 60,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {FLOW.map((step, i) => {
              const at = beats.flow + i * 0.35;
              const p = interpolate(t, [at, at + 0.35], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              const pulseT = ((t - beats.flow) * 1.4) % 1;
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
        ) : null}

        {/* REAL footage, demo-focus: the console owns the frame */}
        <FootagePanel
          src={staticFile("demo/typing.mp4")}
          inAt={beats.footageType}
          outAt={beats.footageTypeOut}
          x={1040}
          y={110}
          width={1280}
        />
        <FootagePanel
          src={staticFile("demo/gate.mp4")}
          inAt={beats.footageGate}
          outAt={beats.footageGateOut}
          x={1040}
          y={110}
          width={1280}
          clipStart={0.8}
        />

        {/* the skill book types its playbook lines */}
        <Card
          x={SPOTS.bubble.x - 80}
          y={690}
          width={560}
          inAt={beats.book}
          outAt={beats.bookOut}
          border="#22c55eaa"
          fontSize={26}
        >
          📖 release-announcement.md
          <div style={{ fontFamily: FONTS.mono, fontSize: 22, color: COLORS.textMuted, marginTop: 6, textAlign: "left" }}>
            {t > beats.bookLines[0] ? <div># your release format</div> : null}
            {t > beats.bookLines[1] ? <div># your triage rules</div> : null}
          </div>
        </Card>

        {/* Sleep payoff: the standing idle hands over to the takeover clips —
            celebrate jump, then asleep while the routine's digest arrives. */}
        <ClipMascot
          name="celebrate"
          at={beats.prompt}
          durationSeconds={1.35}
        />
        <ClipMascot
          name="doze"
          at={beats.sleep + 0.1}
          durationSeconds={4.3}
          playbackRate={0.62}
        />
        <Card
          x={1150}
          y={270}
          width={700}
          inAt={beats.sleep + 1.0}
          outAt={beats.sleep + 12}
          border={COLORS.primaryLight}
          sound="ding"
        >
          📬 Daily digest — open PRs triaged
        </Card>
        {t > beats.sleep + 0.6
          ? [0, 1].map((i) => {
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
            })
          : null}
      </div>
    );
  };

  // Both real-footage beats run in demo-focus: the console owns the frame,
  // captions drop to the lower third, the host leans in from the corner.
  const focus = [
    { from: beats.surfaces[0] - 0.4, to: beats.surfacesOut },
    { from: beats.footageType - 0.15, to: beats.footageGateOut },
  ];

  return { cues, Overlay, camera, focus };
};

// The chat front door: knocks twice, then swings open to reveal the bubble.
const FrontDoor: React.FC<{ at: number; knockAt: number; outAt: number }> = ({
  at,
  knockAt,
  outAt,
}) => {
  const t = useT();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
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
        left: 1000,
        top: 300,
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
