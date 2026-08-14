#!/usr/bin/env node
// npm test — bundle the pure compiler tests with esbuild (already a remotion
// dependency) and run them under plain node. Type-only imports keep React,
// remotion, and the posts JSON out of the bundle.
import { build } from "esbuild";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const outfile = join(mkdtempSync(join(tmpdir(), "vidgen-test-")), "resolve.test.mjs");
await build({
  entryPoints: ["src/scenes/resolve.test.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile,
});
await import(pathToFileURL(outfile).href);
