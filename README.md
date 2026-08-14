# IronClaw video kit

Remotion project that produces the IronClaw video series: word-anchored scene
choreography over a generated 3D mascot, real console footage, synthesized
(zero-rights) music and SFX, NEAR AI branding, and a QA gate on every render.

## The pipeline

```
posts/NNN-slug.json          script, walkthrough, claims manifest
        │  npm run voiceover -- posts/NNN-slug.json     (ElevenLabs; key in .env;
        ▼                                                delete the mp3 to re-voice)
public/audio/NNN-slug.{mp3,words.json}
        │
        ▼  src/scenes/data/NNN.ts — the scene as declarative beats
           (word-anchored via {word: "^regex$"}; re-voicing re-anchors
           everything; a missing anchor throws at render; bespoke visuals
           register in src/scenes/custom/NNN.tsx)
        │
        ▼  npm run ship -- NNN-slug   (or --all)
           render → loudnorm (canonical chain lives ONLY in scripts/ship.mjs)
           → npm run qa (duration vs voiceover, frame-0 silence, LUFS window,
             true peak ≤ −1 dBTP, bed-outlasts-video)
        ▼
out/NNN-slug.mp4             the shippable final
```

Also: `npm run lint:claims` — posts carry `claims[] {text, source}` pinned to
paths in `../ironclaw`; a dead source path fails the build.

## Scenes as data

New scenes are declarative: a typed data module (`src/scenes/data/NNN.ts`,
`satisfies SceneSpec`) compiled by `fromSpec()` into the same
`(timings) => SceneBuild` contract hand scenes use. 097 and 104 are the
proof — both converted and verified **bit-identical** to their hand-written
TSX before the TSX was deleted.

- **Anchors**: `{word: "^regex$", nth?, offset?}` against the voiceover words
  (fail-loud), `{ref: beatId, offset}` for beat-relative timing, `{at: s}`
  as the discouraged absolute escape.
- **Beats** `{id, in, out, slot, prop, note}` — prop kinds: card (states +
  RichLines with mono/color/size/gap/align and typed-on reveals), chip,
  issue, footage, clip (`hideMascot: true` auto-pairs the hide cue),
  caught, swatted, sfx, custom.
- **Slots** (`src/scenes/stage.ts`): named zones replace raw x/y; the
  compiler's overlap checker throws at build time when interval-intersecting
  beats claim intersecting slots or the reserved caption band. Point slots
  (mascot landmarks) are exempt; fading props don't occupy their last 0.5s.
- **Customs**: per-scene registry (`src/scenes/custom/NNN.tsx`) for visuals
  the schema shouldn't absorb; params carry anchors that arrive resolved.
  A custom used by a second scene is a candidate for promotion to a prop
  kind. Sizing rule: a scene needing more than ~4 customs means the schema
  is missing a kind.

The compiler core (anchor resolution, overlap checking, cue pairing) is
pure and lives in `src/scenes/resolve.ts` — `npm test` covers it. The ten
remaining hand TSX scenes convert on-touch only.

## The mascot

The mascot is the **generated 3D figurine** — clips only:

- `Mascot3D` (src/components/Mascot3D.tsx): the standing presence, a
  ping-pong idle loop. Scenes hide it with `{kind:"hide"}` cues when a
  takeover clip plays.
- `ClipMascot` (src/components/ClipMascot.tsx): plays takeover clips
  (celebrate, doze, …) with defaults matching the standing mascot box.
- Clip intake: drop generations (solid navy background) in `art/clips/`,
  optionally describe multi-action takes in `art/clips/segments.json`, run
  `npm run clips` (chroma-key → transparent VP9 + ping-pong `-loop` variants).
  Pre-flight a candidate with `npm run clip-check -- file.mp4`.
- Missing clips (regenerate in the same style, first frames in
  `art/clips/first-frames/`): walk-in-place, talk, point-RIGHT, wake.

The 2D warp rig (`CanvasMascot` + `solve.ts`) is **retired from posts** and
kept only for the dev compositions `mascot-sample` and `clip-source` (the
latter renders rig stand-ins for testing clip intake without spending a
generation). Its sprite `public/mascot-full-vec.svg` regenerates with:
`vtracer --input public/mascot.png --output public/mascot-full-vec.svg
--colormode color --hierarchical stacked --mode spline --filter_speckle 8
--color_precision 7 --gradient_step 12` (then swap width/height for a viewBox).

## Layout invariants

- `src/layout.ts` is the single source for the mascot box; scene landmarks
  (`AT`/`SPOTS` in src/scenes/props.tsx) derive from it.
- Captions live in the lower third (top 0.855) — the caption band and the
  rail band (y 60–160) are reserved; keep scene props out of them.
- The title is an opening act: it exits after the first spoken sentence and
  hands the top of frame to the step rail (walkthrough posts) or a kicker.

## Assets

- `public/brand/` — the two NEAR AI marks used at runtime (bug + end-card
  lockup); the full brand kit is vendored in `art/brand/nearai/`.
- `public/thumb-art/` — thumbnail art frames extracted from the 3D clips;
  thumbnails render via the `thumb-<slug>` compositions (`THUMBS` in
  src/Thumb.tsx).
- `art/` holds source material (Veo takes, the pose sheet, raw capture in
  `art/capture-src/`); nothing in `art/` is bundled into renders.
- `npm run bed` / `npm run sfx` regenerate the synthesized music bed (200s —
  must outlast the longest post; QA asserts this) and the six SFX.

## Compositions (src/Root.tsx)

- `NNN-slug` — the twelve posts (plus `-square` variants, unused by choice)
- `thumb-<slug>` — platform thumbnails
- `mascot-sample`, `clip-source` — dev utilities (retired 2D rig)
