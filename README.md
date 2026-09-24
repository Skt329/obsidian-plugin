# Obsidian Vault Copilot

A plugin that turns an Obsidian vault into a working system for documenting your
work and your life — notes, tasks, decisions, documentation, standups, reports,
reviews, templates and diagrams. You describe what you want in plain language
from your AI coding assistant, and it reads and writes your vault through
Obsidian's official [command line interface](https://obsidian.md/cli).

It is not another way to organize your notes. It is a way to get things *into*
your notes, correctly filed and actually grounded in what you did.

## Who it is for

Anyone who keeps notes. Engineers, product managers, designers, researchers,
students, writers, founders, freelancers, team leads — and for personal life as
much as for work. A decision record works the same whether you are choosing a
message queue or choosing a school. A weekly review works the same whether the
week was sprints or coursework or client calls.

## It works with the vault you already have

This is the core promise, so it comes first.

On setup, the plugin **scans your real vault** — your folders, your tags, your
frontmatter properties, your daily-note format, your template folder, your
enabled plugins — and records what it finds. After that, every skill follows
*your* conventions. New notes land in folders you already use, with properties
you already use, named the way you already name things.

It does not reorganize your vault. It does not impose a folder taxonomy. It does
not rename your files. When something genuinely new is needed, it proposes and
asks first.

Creating a brand-new vault is supported too — it is just the less common case.

## Requirements

| Needed | For what |
|---|---|
| Obsidian 1.12.7 or later, with **Settings → General → Command line interface** enabled | Everything. The CLI drives a *running* Obsidian app, so keep Obsidian open. |
| Node.js (any recent version) | The bundled helper scripts. |
| `git` and a code-host CLI such as `gh` | Only if you want git-based backup or want to open pull requests to a shared repo. Both are optional — the plugin works fine with Obsidian Sync, a cloud folder, or no sync at all. |

## Getting started

```
/plugin marketplace add <this-repo>
/plugin install obsidian-vault-copilot
/vault-setup
```

Setup asks which vault to use (existing or new), scans how it is organized,
confirms what you use it for, and asks who your updates usually go to and how
you back things up. It writes all of that to
`~/.claude/obsidian-vault-copilot/config.json` — outside the plugin, so nothing
personal is ever committed here.

Not sure what to do with it? Run **`/vault-guide`**. It asks about your
situation and walks you through a workflow that fits it, with real examples.

📖 **[Read the complete guide](docs/USAGE.md)** — a walkthrough of your first
fifteen minutes, every skill with example phrases to try, daily and weekly
rhythms, quickstarts by role, configuration, and troubleshooting.

## Skills

| Skill | What it does | Say something like |
|---|---|---|
| `vault-guide` | Explains how to use the plugin for *your* role and life, and sets up a personal workflow. | "how do I use this as a student?" |
| `vault-setup` | Attaches to an existing vault or creates a new one; detects your conventions. | "connect my vault" |
| `vault-ops` | General reading, searching, organizing and editing. The fallback for anything not covered below. | "find my notes about the API redesign" |
| `vault-capture` | Fast capture — an idea, meeting note, link, book note, person, journal entry — filed in the right place. | "capture this: …" |
| `vault-template` | Create, edit, list and apply your own note templates; install a starter library. | "make me a template for client calls" |
| `vault-doc` | Documentation from real context — a project, codebase, process, runbook or how-to. | "document how this deploy works" |
| `vault-decision` | Decision records with context, options and trade-offs. Technical, product, or personal. | "record why we chose Postgres" |
| `vault-task` | Add, list, complete and reschedule to-dos across work and personal life. | "what's still open this week?" |
| `vault-standup` | A daily check-in: done, next, blocked — assembled from what actually happened. | "write my standup" |
| `vault-report` | A status write-up for any audience: manager, client, team, or yourself. | "draft my weekly update" |
| `vault-review` | Weekly, monthly or quarterly review plus planning for the period ahead. | "run my weekly review" |
| `vault-diagram` | Mermaid diagrams inside a note, or a Canvas / Excalidraw drawing. | "diagram this flow" |
| `vault-sync` | Backup and sync — commit and push with git, or check another sync method. | "are my notes backed up?" |
| `vault-share` | Share outward: a pull request to a shared repo, or a redacted export. | "export this to send to my client" |

Most skills trigger from ordinary phrasing. You can also invoke any of them by
name, for example `/vault-review monthly`.

## Subagents

| Subagent | Purpose |
|---|---|
| `context-harvester` | Digests the current work context — the live session, the repository, recent file changes, project instruction files and connected tools — into a compact summary, so notes are grounded in what happened rather than guessed. |
| `activity-collector` | Gathers activity across several projects and tools — commits, changed files, pull requests, ticket movement — into one digest, so a standup or report does not flood the conversation with raw logs. |

## Hooks

| Hook | What it does |
|---|---|
| **SessionStart** | Silent when your vault is healthy. Speaks up only if the vault was renamed or moved, or Obsidian is running but not answering. Never launches Obsidian. |
| **SessionEnd** | Reminds you to back up if the vault has uncommitted changes. Read-only. It never commits for you. |
| **PreToolUse** | Stops an accidental push of your vault or shared repo that skipped the reviewed sync or share flow (Bash and PowerShell). |

## How it uses context

This is what makes the output worth keeping.

When a skill runs inside a working session, the assistant usually already knows
a great deal: what you have been doing, which files changed, what you decided
and why, what went wrong on the way. Most note tools throw that away and make
you retype it.

This one harvests it. Before writing a document, decision, standup, report or
review, it pulls from:

- **the live session** — the work just done and the reasoning behind it
- **the repository or working folder** — status, recent commits, changed files
- **project instruction files** such as `CLAUDE.md`, and any plugin memory
- **connected tools** — if you have connectors or MCP tools attached to your
  session (issue trackers, docs, chat, calendars), they are treated as context
  sources too
- **the vault itself** — your open tasks, recent notes and prior decisions

The result is a note that reflects what actually happened, not a blank template
you have to fill in. Nothing is invented: if context is thin, the skill tells
you what it could not find and asks.

## Safety and privacy

- **Nothing leaves your vault without your explicit say-so.** Every push, pull
  request, export or publish shows you exactly what will happen first and waits
  for confirmation. There is no unattended auto-send anywhere in this plugin.
- **A hook stops accidental unreviewed pushes.** It is a guard rail, not a lock — Claude Code's own permission prompt, which asks before every push, is the real safeguard. The hook catches a stray command so it cannot slip past that
  review.
- **Git repositories default to private.** The plugin never changes a
  repository's visibility on its own.
- **Notes can be marked `sensitivity: private`** (or `internal`) in their frontmatter; private notes are excluded
  from anything that shares or exports.
- **No messaging integration is wired up.** A standup or report is text handed
  back to you — you decide where it goes.
- **Your configuration lives outside the plugin**, in
  `~/.claude/obsidian-vault-copilot/config.json`. No vault name, path, folder,
  person or company is baked into this repository.

## Adapting it

- **Templates:** run `/vault-template` to create templates for your own kinds of
  notes — client calls, lab entries, lesson plans, recipes, whatever you write
  often. A starter library ships in `references/templates/` and you can install,
  edit or ignore it.
- **Conventions:** the reference documents in `references/` are plain Markdown.
  Edit `conventions.md` to change how notes get named, filed and tagged;
  `use-cases.md` holds per-role recipes; `obsidian-cli.md` is the command
  catalog; `session-context.md` describes how context is gathered. Your edits
  take effect immediately — no code changes needed.

## Sharing it

Anyone can install this plugin. Each person runs `/vault-setup` against their
own vault, and their answers stay on their own machine.

```
/plugin marketplace add <this-repo>
/plugin install obsidian-vault-copilot
/vault-setup
```

There is no shared vault, no central server and no configuration baked into the
source. Run `/vault-setup reconfigure` any time to change your answers.

## License

MIT.
