---
name: vault-task
description: Add, list, complete, or reschedule tasks and to-dos in the Obsidian vault, across work and personal life. Use when someone says add a to-do, what is on my list, mark this done, what is still open, remind me to, or asks about outstanding commitments.
argument-hint: "[add|list|done]"
---

# Vault Tasks

Tasks live as ordinary Markdown checkboxes in the user's own notes, and are read and mutated
through the Obsidian CLI's real `tasks` and `task` commands. Never invent a parallel to-do
file, database, or format alongside them — if a checkbox is not in the vault, it does not exist.

A task here is anything the user owes someone, including themselves: ship the migration, call
the pharmacy, renew the passport, reply to the landlord, finish chapter four, book the dentist.
Treat errands and personal commitments exactly as seriously as work items.

## 1. Resolve config first

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/config.mjs" summary
```

If it prints `NOT_CONFIGURED`, stop and tell the user to run the vault-setup skill first. Never
guess a vault. All CLI calls go through the wrapper, which injects `vault=` and enforces a 20s
timeout:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/obsidian-cli.mjs" <command> [key=value ...]
```

Full command catalog: `${CLAUDE_PLUGIN_ROOT}/references/obsidian-cli.md`.

## 2. Adding a task — put it where they will actually see it

A task filed somewhere the user never opens is a lost task. Pick a home in this order:

1. **The relevant project or area note** — `search query="<project or topic>" format=json`, then
   `append path=<note> content="- [ ] <task>"`, under the note's existing tasks heading if it has
   one (`outline path=<note>` to check). This covers "add a to-do for the auth rewrite" and
   "add this to the house move note" equally.
2. **Today's daily note** — for anything tied to today or tomorrow:
   `daily:append content="- [ ] <task>"`.
3. **An inbox note** — when there is no home yet. Use whatever the user already calls it; if
   nothing exists, propose one inside `config.profile.folders.notes` and create it only after
   they agree.

Ask **once** which of these they want as the default, then record the answer in the config at
`~/.claude/obsidian-vault-copilot/config.json` under `profile.taskHome` and stop asking. From
then on, only ask when the task clearly does not fit the default.

Keep the wording the user's own. Add a due date or tag only if they said one or the vault
already uses that convention (`tags` to check) — see
`${CLAUDE_PLUGIN_ROOT}/references/conventions.md`.

When this skill runs inside a working session, the conversation itself is a source of tasks:
follow-ups the user just said out loud, loose ends from the work in progress. Offer to capture
them explicitly rather than silently inventing them —
`${CLAUDE_PLUGIN_ROOT}/references/session-context.md` covers harvesting that context.

## 3. Listing and filtering

- `tasks format=json` — everything. Rarely what someone wants to see whole.
- Filters: `todo`, `done`, `status="<char>"`, `file=<path>`, `path=<folder>`, `daily` (today's
  note), `active` (the note open in Obsidian).
- `tasks format=json verbose` groups by file and includes line numbers — use it whenever you may
  act on the results next, because mutation needs `ref=path:line`.

**Group, do not dump.** Report back by project or life area — one heading per note or folder,
newest or most urgent first — not a flat hundred-line list. When the question is narrow ("what is
still open on the client site", "what do I owe my sister"), filter to that note, folder, or tag
and answer only that. Say how many you hid if you truncate.

## 4. Completing, toggling, rescheduling

**Re-resolve the ref immediately before every mutation.** Line numbers shift the moment anything
edits a file — including an edit you made a minute ago. Run a fresh
`tasks format=json verbose file=<path>` right before the mutation, even if you already listed
tasks earlier in this conversation, and match on the task's text rather than on a remembered line.

- `task ref="<path:line>" done` — complete it.
- `task ref="<path:line>" todo` — reopen it.
- `task ref="<path:line>" toggle` — flip it.
- `task ref="<path:line>" status="<char>"` — custom status characters.

Rescheduling is an edit to the line, not a status change: re-read the line, then rewrite it with
the new date or move it to the new note. Moving a task between notes means appending it to the
destination and clearing it from the source — confirm both halves happened.

## 5. Match the vault's task vocabulary

Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/vault-profile.mjs" scan` when unsure.

- **Tasks community plugin enabled** (`hasTasksPlugin`) — respect its richer status characters
  (`/` in progress, `-` cancelled, and whatever else appears in existing lines) and its date
  syntax (due, scheduled, start, recurrence) exactly as the vault already writes it. Copy the
  shape from a real existing task rather than from memory.
- **Not enabled** — plain `- [ ]` and `- [x]` only. Do not introduce plugin-specific emoji or
  date syntax that will render as literal junk.

## 6. Triage when the list has grown

When a list comes back long or stale, do not just print it. Offer, in one short message:

- **Group it** — by project, by area, or by "this week / someday".
- **Surface what is stale** — tasks in notes untouched for weeks; say how old.
- **Ask what can be dropped.** Closing a to-do the user quietly abandoned is a real service.
  List the candidates with their text and location, get an explicit yes, then mark them done or
  delete the lines. Never bulk-clear on inference alone.

## 7. Handing off

Loose thought that is not yet a commitment → vault-capture. Reviewing the week's open items and
planning the next one → vault-review. "What did I finish yesterday" for a check-in →
vault-standup. General note edits → vault-ops. Unsure what fits their situation → vault-guide.
