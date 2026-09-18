# Obsidian Vault Copilot

A Claude Code plugin that turns an Obsidian vault into a managed personal
knowledge base and software-engineering work journal: decisions with
trade-offs, to-dos, daily standups, manager-facing status reports, Mermaid
diagrams — all driven through the real [Obsidian CLI](https://obsidian.md/cli)
(Obsidian ≥ 1.12.7) and version-controlled on GitHub.

**Every user runs this against their own private vault and own private
GitHub repo.** There is no shared vault. A separate, optional org-wide repo
lets anyone voluntarily contribute curated notes later (`/vault-contribute`);
that's a secondary feature and is unused until you configure it.

## Requirements

- Obsidian ≥ 1.12.7 with **Settings → General → Command line interface**
  enabled, and Obsidian running.
- Node.js (any recent version) and `git` on `PATH`.
- [`gh`](https://cli.github.com/) on `PATH` and authenticated, if you want the
  setup wizard to create your GitHub repo for you, or if you use
  `/vault-contribute` (which opens PRs).

## Getting started

```
/plugin marketplace add <this-repo>
/plugin install obsidian-vault-copilot
/vault-setup
```

`/vault-setup` creates a brand-new vault folder, initializes it as a git repo
(private GitHub repo by default), and saves your configuration to
`~/.claude/obsidian-vault-copilot/config.json` — never inside this plugin's
own repo, so nothing personal ever ends up in what you share with teammates.
Run `/vault-setup reconfigure` any time to change settings later.

## Skills

| Skill | Purpose |
|---|---|
| `/vault-setup` | One-time (or reconfigure) setup wizard. |
| `vault-ops` | Master reference: CLI conventions, folder taxonomy, frontmatter. Auto-triggers for general vault reads/writes. |
| `vault-decision` | ADR-style decision/trade-off notes. |
| `vault-todo` | To-dos via the CLI's real `task`/`tasks` commands. |
| `vault-standup` | Daily standup (yesterday/today/blockers); `weekly` argument adds a look-ahead. |
| `vault-report` | Polished EOD/EOW manager report — text only, never auto-sent. |
| `vault-diagram` | Mermaid diagrams inside notes. |
| `/vault-sync` | The only skill that commits/pushes the vault — always reviewed. |
| `vault-contribute` | PR-based sharing of one note/excerpt into the org repo, with mandatory redaction review. |

## Subagent

`activity-collector` walks your configured project repos' git history and
returns a compact digest, so `vault-standup`/`vault-report` don't flood the
conversation with raw `git log` output.

## Hooks

- **SessionStart** — confirms the configured vault is actually reachable via
  the CLI, once, early.
- **SessionEnd** — a read-only reminder to run `/vault-sync` if the vault has
  uncommitted changes. Never auto-commits.
- **PostToolUse** — logs vault-mutating CLI calls to a local activity log used
  for commit-message drafting. Informational only.
- **PreToolUse** — blocks any raw `git push` to the vault/org repo that
  didn't go through `/vault-sync` or `/vault-contribute`'s review step.

## Safety notes

- Every repo this plugin creates defaults to **private**. It never changes a
  repo's visibility itself.
- Nothing is ever pushed or PR'd without you seeing the diff and confirming —
  there is no unattended auto-push anywhere in this plugin.
- The optional `obsidian-git` community plugin (offered during setup) is
  configured **commit-only**, as a crash safety net for hand-edits made while
  Claude Code isn't running — it is never the path that pushes.
- Sending a standup/report anywhere (Slack, email) is intentionally outside
  this plugin's scope — no messaging integration is wired up, so you always
  send it yourself.

## Sharing this with teammates

Push this repo to GitHub, then each teammate:

```
/plugin marketplace add <org-or-repo>
/plugin install obsidian-vault-copilot
/vault-setup
```

Nothing in the plugin source references a specific vault, path, or GitHub
URL — everything is resolved from each user's own
`~/.claude/obsidian-vault-copilot/config.json`.
