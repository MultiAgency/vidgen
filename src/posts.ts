import meetIronclaw from "../posts/001-meet-ironclaw.json";
import githubNotifications from "../posts/097-github-notifications.json";
import prReviewDigest from "../posts/098-pr-review-digest.json";
import alertDiagnostics from "../posts/099-alert-diagnostics.json";
import bugBountyTriage from "../posts/100-bug-bounty-triage.json";
import safeServerCommands from "../posts/101-safe-server-commands.json";
import releaseTagFanout from "../posts/102-release-tag-fanout.json";
import explainAnyCodebase from "../posts/103-explain-any-codebase.json";
import devWorkflow from "../posts/104-dev-workflow.json";
import architectureReborn from "../posts/108-architecture-reborn.json";
import skillsToolsUseCases from "../posts/106-skills-tools-use-cases.json";
import whyTee from "../posts/107-why-tee.json";

export type DiagramNode = { icon: string; label: string };

export type DiagramSpec = {
  /** Seconds into the video the diagram cuts in. */
  at: number;
  /** Seconds on screen (default 12; clamped to end before the outro). */
  duration?: number;
  /** Pipeline stages, rendered left to right. */
  nodes: DiagramNode[];
};

export type WalkthroughStep = { label: string; at: number };

export type WalkthroughCard = {
  type: "code";
  text: string;
  at: number;
  duration: number;
  /** Code cards only: per-line reveal times (seconds after `at`, one per
   * newline-split line) so output appears WITH the voiceover claim it
   * proves, not before it. Omit for the classic whole-card type-on. */
  lineAt?: number[];
};

export type WalkthroughSpec = {
  steps: WalkthroughStep[];
  cards: WalkthroughCard[];
};

export type Post = {
  slug: string;
  title: string;
  tagline: string;
  outro: string;
  accent: string;
  script: string;
  fallbackDurationSeconds: number;
  /** Animated mechanism pipeline shown mid-video (16:9 only). */
  diagram?: DiagramSpec;
  /** Step rail + timed code/chat cards for walkthrough posts (16:9 only). */
  walkthrough?: WalkthroughSpec;
};

// Register each post here after adding its JSON under posts/.
export const POSTS: Post[] = [
  meetIronclaw,
  githubNotifications,
  prReviewDigest,
  alertDiagnostics,
  bugBountyTriage,
  safeServerCommands,
  releaseTagFanout,
  explainAnyCodebase,
  devWorkflow,
  skillsToolsUseCases,
  whyTee,
  architectureReborn,
];

export type WordTiming = { text: string; start: number; end: number };
export type Timings = { durationSeconds: number; words: WordTiming[] };
