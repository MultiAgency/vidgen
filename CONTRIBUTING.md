# Contributing to vidgen

Videos in this repo are **data, not code**. A release is two files plus optional visuals:

- `posts/NNN-slug.json` — the script: voiceover text, title, tagline, and a `claims[]` manifest.
- `src/scenes/data/NNN.ts` — the choreography as a `SceneSpec`: word-anchored beats (`{ word: "^regex$" }`), props, slots. Hand visuals the schema can't express go in `src/scenes/custom/NNN.tsx`. Roughly 4 framer-motion customs is the ceiling; past that the schema is missing a kind.

`src/scenes/data/097.ts` and `104.ts` are the exemplars — read them before writing anything.

## Claims: verify, don't assert

Every factual claim a script makes gets an entry in the post's `claims[]`:

```json
{ "text": "...", "source": "crates/path/that/proves/it" }
```

The source path must exist in the `nearai/ironclaw` source tree. If you can't find a source, **cut the claim** — a dead path fails the build.

## The CI gates every PR must pass

All three run as CI checks on the workflow run for your branch:

- `tsc --noEmit` — types and data-module validity.
- `npm test` — the schema compiler: anchors, overlaps, cue pairing.
- `npm run lint:claims` — every claim's source path exists in the ironclaw source tree.

The compiler is fail-loud: a missing anchor, forward ref, or slot collision throws with an exact message. Trust the throw; fix the data.

## Pull-request workflow

1. Branch from `main` — never commit to `main` directly.
2. Edit only `posts/`, `src/scenes/data/`, `src/scenes/custom/`. Everything else (pipeline scripts, components, audio, brand, workflows) is off-limits; propose changes there in prose instead.
3. Open a PR saying what the video says, which claims were added and which source file each was verified against, and which beats changed.
4. Watch the checks; fix until every gate is green. A red check is your reviewer — read the job logs and fix the data.

A PR is "ready" only when its gates are green. If a gate fails and you can't fix it, say exactly what failed rather than calling the PR ready.

Render, voiceover, and frame QA run only on the maintainer's host (they need Chrome, ffmpeg, and the ElevenLabs key) — a change awaits a host render.
