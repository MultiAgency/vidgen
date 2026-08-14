import { INTER_500, INTER_700, INTER_900 } from "./interData";

// Inter (OFL) replaces the system stack so renders are identical everywhere.
// Injected as synchronous @font-face CSS with embedded data URIs: FontFace
// load() promises never settle in Remotion's render workers (its delayRender
// then times out on any render longer than ~28s), while data-URI @font-face
// decodes locally before the first frame is captured.
const css = (
  [
    [INTER_500, 500],
    [INTER_700, 700],
    [INTER_900, 900],
  ] as const
)
  .map(
    ([data, weight]) =>
      `@font-face{font-family:'Inter';font-style:normal;font-weight:${weight};src:url(${data}) format('woff2');}`,
  )
  .join("\n");

const style = document.createElement("style");
style.textContent = css;
document.head.appendChild(style);
