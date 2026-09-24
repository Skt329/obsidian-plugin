# Changelog

## 0.3.0 — learns your project structure

### Added
- **Profile schema v2.** `profile.kinds` (a folder + naming + template + lifecycle contract for
  one sort of note — an append-only log, an open/closed record, stable reference material) and
  `profile.projects` (a hub note plus named sections, each pointing at a kind) represent a vault's
  own organizing pattern as structured data instead of free-text prose. A v1 config is migrated
  automatically and losslessly the next time it is read: every field is kept, and the old prose
  moves untouched into `profile.legacyNotes`. Verified live on the real `workspace` vault.
- **`scripts/vault-profile.mjs` detects existing projects.** Given the vault's real file list, it
  finds folders shaped like a project (a hub note and/or several recognizable sections —
  Documentation, Updates, Decisions, Ideas, Meetings, Tasks — under aliases so a vault calling
  Updates "Journal" still matches) and proposes `projects`/`kinds` entries. It is a proposal only;
  nothing is written to config until a skill shows it to the user and they confirm. Verified live:
  correctly found both real projects in the test vault, including a `Meetings` section the old
  free-text profile had already drifted away from recording.
- **`vault-project` skill** and **`scripts/scaffold.mjs`**: start a new project set up the way an
  existing one already is. Clones a named project's own recorded sections and kinds (never the
  vault-wide merged pool, since two projects may spell a section differently), previews every file
  it would create (`scaffold.mjs plan`) before creating anything (`scaffold.mjs run`), and never
  overwrites an existing file. Live-tested end to end against the real vault: created, verified,
  re-ran to confirm idempotency (skips rather than overwrites), then cleaned up. That test also
  surfaced a real Obsidian CLI limitation, now documented in the skill: deleting the last file in a
  folder does not remove the now-empty folder from disk — there is no matching `rmdir`.
- **`scripts/scan-sensitive.mjs`**: a deterministic regex backstop (credential- and PII-shaped
  strings — AWS/GitHub/Slack/Google keys, private key blocks, JWTs, card numbers, emails) run
  alongside the model's own read-through in `vault-sync` before a commit and `vault-share` before
  an export or PR. It never blocks or approves anything by itself — every finding is shown to the
  user, since it also produces false positives.
- `vault-decision`, `vault-doc` and `vault-standup` now route into a recorded project's own
  section (its `decisions`/`documentation`/`updates` kind) when the work belongs to one, and
  `vault-decision`/`vault-doc` offer — never impose — to add a link from the project's hub note
  after writing.

### Known and deliberately deferred
- Subagent MCP tool access (`context-harvester`/`activity-collector` are told to use connected
  tools but their tool allowlists don't include any), a shared preamble reference to cut the
  per-skill boilerplate, and the lint/eval suite from the original roadmap are not in this release.

## 0.2.1 — reliability patch

Everything here was found by using 0.2.0 on a real vault. No new features.

### Fixed
- **The plugin failed to load when installed through `/plugin install`.** `plugin.json` declared
  `hooks/hooks.json`, which Claude Code already loads automatically, so it rejected the duplicate.
- **The SessionStart check reported "vault unreachable" in every session.** `obsidian vaults`
  ignores `format=json`, so the check could never succeed, and it spent 2.6 s failing. It now
  reads `vaults verbose`, is silent when the vault is healthy, finishes in about half a second, and
  never launches Obsidian (the CLI would otherwise open the app at the start of every session).
- **CLI failures looked like success.** The Obsidian CLI prints `Error: …` with exit code 0. The
  wrapper now turns that into a failure, treats `No … found.` as an empty result, strips the leading
  blank line some commands print, and only adds `format=json` for the verbs that honour it.
- **A stale vault name could write to the wrong vault.** An unknown `vault=` silently falls back to
  whichever vault is active. Before the first write, the wrapper now checks that Obsidian reports
  back the vault it was asked for, and that its path matches the config. It refuses writes when no
  vault can be identified.
- **Stray daily notes.** `daily:read` creates today's note as a side effect, and several skills
  defaulted to daily-note commands in vaults that do not keep daily notes. The wrapper now refuses
  `daily`, `daily:read`, `daily:append` and `daily:prepend` unless `profile.dailyNotes` is `"used"`.
- **The privacy flag was never honoured.** Templates wrote `sensitivity:` while skills checked
  `confidential:` / `sensitive:`. Standardised on `sensitivity: public | internal | private` across
  share, report, sync, decision and the references. Older flags still count as private.
- **Push guard gaps.** It now parses the real git subcommand and resolves `cd`, `-C`,
  `--work-tree`, forward slashes, Git Bash `/c/` paths, casing and subfolders; covers the PowerShell
  tool; and no longer blocks `git stash push` or `git log`. Documented honestly as an accident-stopper —
  Claude Code's permission prompt remains the real safeguard.
- **The context harvester could read another session's transcript.** It looked for
  `CLAUDE_SESSION_ID`; the host sets `CLAUDE_CODE_SESSION_ID`. It now uses the right variable and
  says when it had to guess.
- Skill instructions used arguments the CLI does not accept (`vaults format=json`,
  `property:set key=`).

### Changed
- **Removed the global PostToolUse hook.** It ran on every Bash, Write and Edit call in every
  project on the machine (about 155 ms each) and recorded file paths from unrelated projects.
  Vault changes are now logged by the wrapper itself, one JSON record per change — command, note,
  time; never command text or content — capped at 1 MB. The old `activity.log` is left untouched.
- A broken config file is now reported as broken instead of being treated as "not configured".
- Note content can be passed with `content-file=` so it never has to be pasted into a shell string.

### Added
- A regression test suite (`node --test test/*.test.mjs`), zero dependencies.
- `scripts/build.mjs` for repeatable builds, and `.gitattributes` for LF line endings.

### Known and deliberately deferred
- Hook entries accept an `if` condition, but whether it prevents the hook process from starting is
  undocumented. The push guard does not rely on it until that is verified.

## 0.2.0
Universal rewrite: 14 skills, 2 subagents, shared references, 12 starter templates.

## 0.1.0
Initial single-user version.
