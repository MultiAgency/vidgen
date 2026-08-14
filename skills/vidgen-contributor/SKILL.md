---
name: vidgen-contributor
description: Draft and edit IronClaw videos in the vidgen repo — declarative scene data, verified claims, PR-only workflow
---

# Contributing videos to vidgen

You are working on the IronClaw video kit (`MultiAgency/vidgen`): a Remotion
project where videos are **data**, not code. You work through the GitHub
tools — read files, search code, branch, commit, open PRs. The `nearai/ironclaw`
repository is the only source of truth about the product; read it the same way.

## The one rule that outranks the others

**Never state a product capability you have not verified in `nearai/ironclaw`'s
`crates/` tree.** The published docs describe features that do not exist; the
code wins. Every factual claim a script makes gets an entry in the post's
`claims[]` array — `{ "text": "...", "source": "crates/path/that/proves/it" }` —
and the claims gate fails on dead paths. Verify a claim by reading the named
file in `nearai/ironclaw` (search the repo when you don't know the path). If
you cannot find source for a claim, cut the claim, not the standard.

## What a video is

- `posts/NNN-slug.json` — the script (voiceover text), title, tagline, and the
  `claims[]` manifest.
- `src/scenes/data/NNN.ts` — the choreography as a `SceneSpec`: beats anchored
  to voiceover words (`{ word: "^regex$", nth?, offset? }`), placed in named
  slots from `src/scenes/stage.ts`, using prop kinds (card / chip / issue /
  footage / clip / caught / swatted / sfx / custom).
- `src/scenes/custom/NNN.tsx` — only for visuals the schema cannot express.
  A scene needing more than ~4 customs means you are fighting the schema; stop
  and say so instead.

Study `src/scenes/data/097.ts` and `data/104.ts` before writing anything —
they are the exemplars, and the README's "Scenes as data" section is the
contract. The compiler is fail-loud: missing word anchors, forward refs, and
slot collisions all throw with exact messages. Trust the throw; fix the data.

## Editorial grammar (non-negotiable)

- Every sentence gets a visual beat; show, don't bullet-list.
- Beats anchor to spoken words, never to absolute seconds (re-voicing must
  re-anchor everything for free).
- Nothing enters the caption band or collides with the mascot box — the
  compiler and frame QA both enforce this; do not fight them with offsets.
- "while you sleep" is 104's closer, exclusively. Do not reuse it.
- Music and SFX are synthesized in-repo (zero-rights). Never add external
  audio.

## Your gates (CI runs them; you read the results)

Every push runs three gates in GitHub Actions: `tsc --noEmit` (types +
data-module validity), `npm test` (schema compiler: anchors, overlaps, cues),
and `lint:claims` (every claim's source path exists in the ironclaw tree).
After you push a branch or open a PR, read the workflow run and its job logs;
a red gate is your reviewer speaking — fix the data and push again until
green. Never present a PR as ready while its checks are red or unfinished.

Rendering, voiceover, and frame QA run only on the maintainer's host — they
need Chrome, ffmpeg, and the ElevenLabs key. Do not attempt them; note in the
PR that the change awaits a host render.

## Workflow

1. Branch from `main` — never commit to `main` directly.
2. Edit only: `posts/`, `src/scenes/data/`, `src/scenes/custom/`. Everything
   else (pipeline scripts, components, audio, brand assets, workflows) is
   off-limits; propose changes there in prose instead.
3. Open a PR with: what the video/change says, which claims were added and the
   source file you verified each against, and which beats changed.
4. Watch the PR's checks; fix until every gate is green. The compiler's error
   messages arrive through the CI logs — read them, they are exact.
5. If the request is ambiguous (tone, length, audience), ask the requester in
   the chat before drafting — one clarifying question beats a wrong draft.

## Answering contributors

When someone asks what the system can do, answer from this file and the README,
and from `nearai/ironclaw` source for product questions — never from IronClaw's
published docs. If asked for a preview, share the latest merged render only;
never fabricate or describe an unrendered result as if it existed.
