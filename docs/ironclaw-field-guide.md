# IronClaw Field Guide

**Verified against the code, not the docs.** How to run the IronClaw agent on your own
machine — every claim here was checked against the source tree or exercised live on a running
instance. Where the published docs disagree with the code, the code won, and the discrepancy
is flagged as a **Trap**.

> Verified 2026-08-12 · binary `1.1.0-rc.1` · repo `nearai/ironclaw @ 307521f15`
> Web edition: https://claude.ai/code/artifact/60393de0-8628-4438-a2b5-f4f64e65b961

## 1. What you're running

IronClaw is a self-hosted personal AI agent: one Rust binary (`ironclaw`) that runs an agent
loop behind a security kernel — every tool call crosses typed authorization, approval gates,
and mediated network/secret boundaries. You talk to it through a local web console; it works
with files, a shell, GitHub, web search, and any MCP server you point it at, and it can run
scheduled jobs while you're away.

The default local profile stores everything in a **libSQL database file** under
`~/.ironclaw/reborn/` — no external database, no cloud service, no Docker required.
*(verified: a live serve held zero Postgres connections)*

> **Trap.** Older bootstrap files may reference `postgres://localhost/ironclaw` — that belongs
> to the previous (v1) generation living directly in `~/.ironclaw/`. The current runtime
> ignores it. Postgres is opt-in via `[storage] backend = "postgres"` in
> `~/.ironclaw/reborn/config.toml`.

## 2. Install and first run

Two paths to a binary:

```bash
# official installer (release binary)
curl --proto '=https' --tlsv1.2 -LsSf \
  https://github.com/nearai/ironclaw/releases/latest/download/ironclaw-installer.sh | sh

# or build from a checkout (what this guide was verified with)
git clone https://github.com/nearai/ironclaw && cd ironclaw
cargo build --release -p ironclaw     # binary at target/release/ironclaw
```

Then initialize and check:

```bash
ironclaw onboard    # first-run setup: home dir, master key, LLM provider + API key
ironclaw doctor     # readiness: home, profile, config, providers, drivers
```

Onboarding writes `~/.ironclaw/reborn/config.toml`, stores your LLM key encrypted (the OS
keychain holds the master key), and marks setup complete. `doctor` should report all checks
passing before you go further. *(verified: 8/8 checks on a real install)*

## 3. Start it: `ironclaw serve`

The web console is the primary surface — chat, a live timeline of what the agent is doing,
**approval prompts**, a logs panel, a workspace file browser, and skills/extensions
management. The terminal REPL has none of those, so gated tools stall there; use the browser.

```bash
cd ~/agent-home        # run from a dedicated directory (see §4)
ironclaw serve         # default http://127.0.0.1:3000  (--port N to change)
```

A bare `ironclaw` with no subcommand also runs `serve`.
*(verified: `crates/app/ironclaw_cli/src/cli.rs`)*

### Signing in

The console requires a bearer token. Setup writes one to `~/.ironclaw/reborn/webui-token`
and the login page accepts it directly:

```bash
cat ~/.ironclaw/reborn/webui-token   # paste into the login form, or open:
http://127.0.0.1:3000/login?token=<your-token>
```

Set `IRONCLAW_REBORN_WEBUI_TOKEN` to supply your own token instead (useful for throwaway
demo sessions). The token grants full operator access — treat it like a password.
*(verified live; `docs/using/webui.mdx` is one of the accurate pages)*

> **Gotcha (good error, undocumented).** If `[identity].default_owner` in config.toml doesn't
> match the WebUI user id, serve refuses to start and tells you exactly why: threads created in
> the UI would be invisible to the runner. Fix by matching `IRONCLAW_REBORN_WEBUI_USER_ID` to
> the configured owner, or removing `default_owner`.

## 4. Where your files go

The agent's workspace is scoped per caller *relative to where you launched serve*:

```
<serve-directory>/tenants/<tenant>/users/<user>/   ← agent-written files land here
```

So run `serve` from a dedicated directory, not your home or a repo — anything the agent
writes (a script it authored, a website you asked for) lands in that tree.
*(verified: asked for a website, found it at `tenants/…/users/…/index.html`)*

## 5. The CLI, honestly

What each subcommand actually does in this build:

| Command | Status | What it does |
|---|---|---|
| `serve` | works | The web console (see §3); the real interface |
| `run -m "…"` | works | One-shot: send a message, print the reply, exit |
| `repl` | works | Minimal terminal loop — no streaming, no tool display, **no approval prompts** |
| `onboard`, `doctor`, `status` | works | Setup and diagnostics |
| `models`, `config`, `profile` | works | List/set model & provider; config get/set; list boot profiles |
| `extension` | works | `search` / `install` / `remove` only — there is *no* `activate` |
| `ironhub` | works | Signed package registry: search/install tools & skills, digest pinning |
| `skills` | works | `list` only; manage skills via chat or the console |
| `service` | works | Install as launchd/systemd service (the unit runs `serve`) |
| `traces`, `completion` | works | TraceCommons opt-in/out; shell completions |
| `logs`, `channels`, `hooks` | stubs | Return "not yet implemented" — logs live in the web console |
| `chat` | absent | Appears in the quickstart docs; the subcommand does not exist |

*(verified: `--help` output + `commands/*.rs` of this build)*

## 6. What the agent can do out of the box

- **Files:** read / write / list / glob / grep / patch, over scoped mounts — allowed by
  default, no prompts. *(verified live: built a website in 80 s, zero approvals)*
- **Shell:** real command execution, *approval-gated*, hard limits of 120 s wall clock and
  1 MiB output (bigger output is saved to a file), with static command screening. On the local
  profile it runs on your host with an *allowlist-scrubbed* environment (your
  `*_KEY`/`*_TOKEN` vars are not passed through). Long-running processes (dev servers) won't
  survive the 120 s cap — build static, serve it yourself.
- **Web:** the `web-access` extension gives search + page fetch with zero configuration.
- **GitHub:** install the extension in the console, paste a fine-grained PAT. 49 tools
  (issues, PRs, branches, files, workflows); reads are allowed, writes ask first.
- **Any MCP server:** ask the agent in chat to register a hosted MCP endpoint URL — HTTP(S)
  only, no stdio servers.
- **Skills:** 32 bundled Markdown playbooks (coding, code-review, commit, github-workflow, …).
  The agent can install more from URLs or IronHub, and learn new ones.
- **Memory:** always on, accumulates across sessions, no setup.
- **Automation:** describe a schedule in chat ("every weekday at 8, triage my PRs…") — it
  becomes a cron trigger; results can push to Slack/Telegram/web-push.

### The compile gate (undocumented gem)

Export `IRONCLAW_POST_EDIT_CHECK` before `serve` and the host runs that command after every
successful file write, feeding only *new* diagnostics back to the agent — it fixes its own
mistakes without being asked:

```bash
IRONCLAW_POST_EDIT_CHECK="npx -y tsc --noEmit" ironclaw serve
```

*(verified: `crates/kernel/ironclaw_host_runtime/src/post_edit_check.rs`)*

## 7. Sandboxing, if you want it

The default `local-dev` profile runs shell commands directly on your machine (scrubbed env,
approval gate, limits). The sandboxed profiles route every process into a per-user Docker
container instead — read-only rootfs, all capabilities dropped, no network, persistent
`/workspace` — and **fail closed**: if Docker is unreachable you get "no shell", never a
silent fallback to your host.
*(verified: `DockerWorkerSecuritySpec` in `crates/lanes/ironclaw_sandbox`)*

## 8. Doc pages vs. this build

Checked directly against the source; trust accordingly:

| Page | Verdict |
|---|---|
| `docs/using/webui.mdx` | **Accurate** — token file, login link, env override all correct |
| `docs/quickstart.mdx` | Partially stale — documents `ironclaw chat`, which doesn't exist |
| `docs/extensions/shell.mdx` | Stale — dead `ALLOW_LOCAL_TOOLS` flag; env model described backwards (it's an allowlist) |
| `docs/extensions/mcp.mdx` | Stale — instructs `ironclaw extension activate`, which doesn't exist |
| `docs/capabilities/routines/` | Aspirational — describes a routines/webhook system with no implementation in the tree |

## 9. Ten-minute proof

The exact session used to verify this guide, end to end:

1. `mkdir ~/agent-demo && cd ~/agent-demo && ironclaw serve --port 3210`
2. Open the console, paste the token from `~/.ironclaw/reborn/webui-token`.
3. Prompt: *"Build a single-page demo website for a coffee shop: one index.html, embedded
   CSS, vanilla JS with a validated contact form. No dependencies."*
4. 80 seconds later: `tenants/…/users/…/index.html` — menu grid rendered from a JS array, an
   hours table highlighting the current day, and a contact form whose validation actually
   works (bad email rejected inline; valid submit thanks you by name).
5. `python3 -m http.server` in that directory to view it.

No approvals were needed — file writes are allowed by default; the shell and GitHub writes
are where the gates live.

---

*Compiled from a source-level survey and a live session on 2026-08-12. Where behavior and
documentation disagreed, behavior won.*
