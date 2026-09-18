---
name: vault-guide
description: Explain how to use the Obsidian vault plugin for a specific situation or role, show what each skill does, and set up a personalized workflow. Use when someone asks how to use this plugin, how to organize their vault, what they can do with it, how to adapt it to their job or personal life, or says they are new to it.
argument-hint: "[topic]"
shell: bash
---

# Vault guide

The front door. Your job is to orient one specific person — not to recite the manual. Figure out what they actually do all day, recommend a small starting workflow, and offer to write it into their vault.

This plugin works with **any** vault: a 4,000-note system someone has kept for years, a vault made this morning, or no vault at all yet. It never requires reorganizing anything.

## First, check state

!`node "${CLAUDE_PLUGIN_ROOT}/scripts/config.mjs" summary`

- `NOT_CONFIGURED` → fine. This skill still runs in full. Explain and recommend first, then point at **vault-setup** at the end. Do not send a new person to setup before they know what they are setting up.
- Configured → you already know their vault, use cases and audience. Skip questions the config answers, and tailor examples to the folders and tags already in `profile`.

If a `[topic]` argument was passed (e.g. `journaling`, `templates`, `standup`, `sync`), answer that narrowly and skip the situation interview.

## The skills

| Skill | What it does | Say something like |
|---|---|---|
| **vault-guide** | This. Orientation, help, personalized workflow | "how do I use this", "how do I do X with my notes" |
| **vault-setup** | Attach to an existing vault, or create a new one; saves config | "set this up", "connect my vault" |
| **vault-ops** | Read, search, browse, edit anything; the shared conventions reference | "find my notes on X", "what's in my vault about Y" |
| **vault-capture** | Fast inbox capture — idea, link, quote, errand, thought | "jot this down", "save this for later" |
| **vault-template** | Build and apply reusable templates for your own recurring notes | "make a template for client calls", "apply my meeting template" |
| **vault-doc** | Write real documentation from the context already in this session | "document what we just did", "write this up" |
| **vault-decision** | Record a decision: options, trade-offs, the call, why | "record why we chose X", "log this decision" |
| **vault-task** | Add, list, complete tasks across the vault | "add a to-do", "what's open", "mark that done" |
| **vault-standup** | Daily check-in: yesterday / today / blockers, or a personal daily log | "write my standup", "what did I do yesterday" |
| **vault-report** | A polished status write-up for whoever needs it | "draft my weekly update", "summarize this for my client" |
| **vault-review** | Weekly or monthly review and planning from what actually happened | "do my weekly review", "plan next month" |
| **vault-diagram** | Mermaid, Canvas or Excalidraw diagrams inside a note | "diagram this", "draw how this connects" |
| **vault-sync** | Back up / sync the vault (git, Obsidian Sync, cloud folder, or none) | "back up my notes", "sync my vault" |
| **vault-share** | Send one note out — export, or a PR to a shared repo | "share this with the team", "export this note" |

Two subagents run in the background when a skill needs them: **context-harvester** (what happened in this session, this repo, connected tools) and **activity-collector** (activity across several projects or tools).

## Tell me about your situation

Ask, conversationally or with `AskUserQuestion` — two or three questions, not a form:

1. **What do you spend your days on?** Building things, running a team or product, research or study, writing, client work, running a household and personal projects, or a mix.
2. **What do you want the vault to carry?** Work only, personal only, or both in one place.
3. **Who reads what comes out of it?** Only them, a manager, a team, clients, a professor, nobody.

Then read the matching recipe before you advise:

- `${CLAUDE_PLUGIN_ROOT}/references/use-cases.md` — per-persona recipes (engineer, PM, designer, student, researcher, writer, founder, freelancer, manager, personal life). Read the relevant section, don't guess.
- `${CLAUDE_PLUGIN_ROOT}/references/conventions.md` — how folders and frontmatter adapt to a vault that already exists.
- `${CLAUDE_PLUGIN_ROOT}/references/obsidian-cli.md` — the full command catalog, if they ask what is technically possible.

If a vault is already configured, run `node "${CLAUDE_PLUGIN_ROOT}/scripts/vault-profile.mjs" scan` and ground every suggestion in what is really there — their folder names, their tags, their daily note format. Suggest one new folder at most, and only if nothing existing fits.

## Recommend a starting workflow — 3 to 5 skills, never 14

Name a concrete loop with a rhythm attached. Examples of the shape:

- **Building software:** vault-capture (as things occur) → vault-doc and vault-decision (after real work) → vault-standup (each morning) → vault-review (Friday).
- **Product or managing:** vault-capture → vault-task → vault-report (for whoever asks) → vault-review.
- **Study or research:** vault-template (a source-note template) → vault-capture → vault-ops to search and connect → vault-review to consolidate.
- **Personal life:** vault-capture (inbox) → vault-standup as a daily journal → vault-decision for real-life choices (a move, a purchase, a career turn) → vault-review monthly.
- **Freelance or client work:** vault-template (client note) → vault-task → vault-report per client → vault-share to send it.

Say which one skill to use **today**, and what it will feel like after two weeks. Mention that anything not in the starting set is still there the moment they want it.

## Offer to save the plan

Offer once — do not insist:

> Want me to write this into your vault as **How I use my vault**, so the plan lives with your notes and you can change it later?

If yes (requires a configured vault):
- Place it where the user's own notes live — ask if there is no obvious home; do not invent a folder.
- Include: their situation in one line, the chosen loop with its rhythm, the trigger phrase for each chosen skill, and a "not using yet" list of the rest.
- Write it with the vault-ops create/append commands through `node "${CLAUDE_PLUGIN_ROOT}/scripts/obsidian-cli.mjs" ...`.
- Tell them to re-run this skill any time to revise it.

If the vault is not configured yet, offer the plan as chat output now and suggest running **vault-setup**, then re-running this to save it.

## Troubleshooting

- **"Obsidian isn't running."** The CLI is a remote control for the running app, not a headless tool. Ask them to open Obsidian and retry.
- **A command hangs.** Obsidian blocks the CLI while it is starting up or checking for updates — sometimes for minutes. The wrapper cuts calls off at 20 seconds. Wait until the app is idle, then retry; it is not broken.
- **`NOT_CONFIGURED`.** No vault is attached yet. Run **vault-setup** — it handles both an existing vault and a brand-new one.
- **"Error: No template folder configured."** Obsidian's Templates core plugin has no folder set. Either set one in Obsidian's settings, or use **vault-template**, which can work without it.
- **Several vaults open.** Normal. Every call in this plugin passes `vault=` from the config, so the wrong vault is never touched. To work in a different one, re-run **vault-setup** to point at it.
- **A task refuses to toggle.** Line numbers move between reads. **vault-task** re-resolves the task immediately before changing it — re-run it rather than reusing an old reference.

## Re-runnable

This is not a one-time onboarding. Whenever someone asks "how do I do X with my notes", "which of these should I use for Y", or "can this handle Z", run this skill again with that as the `[topic]` and answer just that.
