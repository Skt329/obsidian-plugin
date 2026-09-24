---
name: vault-ops
description: Read, search, organize, or edit notes in an Obsidian vault — find notes, list tags, links, folders or properties, create or update a note, move and rename files, inspect vault structure. Use for general vault requests that are not specifically capture, templates, documentation, decisions, tasks, standups, reports, reviews, diagrams, syncing or sharing.
argument-hint: "[what to find or change]"
---

# Vault Ops

The general-purpose worker for an Obsidian vault, and the shared conventions anchor other
skills in this plugin defer to.

## 1. Resolve config first — always

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/config.mjs" summary
```

If it prints `NOT_CONFIGURED`, stop. Tell the user: "No vault is configured yet — run the
vault-setup skill and I'll attach to your existing vault or help you start a new one."
Do not guess a vault name, path, or folder. Read single values with
`config.mjs get profile.folders.daily` style dot paths.

## 2. Always go through the wrapper

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/obsidian-cli.mjs" <command> [key=value ...]
```

The wrapper injects `vault=<name>` from config (the user may have several vaults open, so the
"active vault" is never safe to assume) and enforces a 20s timeout. Raw `obsidian ...` calls
can block for **minutes** when the app is busy starting up or checking for updates — prefer the
wrapper every time. Obsidian must be running; the CLI is a remote control, not a headless tool.
If a call times out, say so plainly and suggest checking that Obsidian is open, rather than
retrying in a loop.

## 3. Cheat-sheet — the common 80%

Most commands accept `format=json`; use it whenever you need to parse rather than show.

**Find**
- `search query="topic" format=json` — note-level hits
- `search:context query="topic" format=json` — hits with surrounding lines, better for "where did I write about X"
- `tags` / `tag name=<tag>` — all tags, or notes carrying one
- `properties` / `property:read path=<note>` — frontmatter keys in use, or one note's values
- `files` / `folders` / `folder path=<dir>` — structure
- `outline path=<note>` — heading map of a long note
- `links path=<note>` / `backlinks path=<note>` — outgoing and incoming
- `unresolved` / `orphans` / `deadends` — broken links, unlinked notes, dead ends

**Read and write**
- `read path=<note>`
- `create path=<note> content="..."` (`unique` when a name may collide)
- `append path=<note> content="..."` / `prepend path=<note> content="..."` — prefer these over
  rewriting a whole note
- `property:set name=<k> value=<v> path=<note>` / `property:remove name=<k> path=<note>`
- `aliases path=<note>`

**Organize**
- `move path=<from> to=<dir>` and `rename path=<from> to=<new>` — these keep wikilinks intact.
  Never move or rename by editing paths on disk or rewriting links by hand; use these verbs.
- `delete path=<note>` — see Safety below.

## 4. Discovery before creation

Before creating a note or folder, find out where the user already puts this kind of thing:

1. `search` for two or three similar notes; look at the folder they sit in and how they are named.
2. Read `config.profile.folders` and `config.profile.namingStyle` and follow them.
3. Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/vault-profile.mjs" scan` when you need the live picture —
   real folders, tags, properties, template folder, daily note path, note count.

Reuse the existing location and naming style. Only propose a new folder when nothing fits, and say
why before creating it. An established vault with its own system is the normal case.

Same rule for metadata: run `tags` and `properties` before inventing anything. If the user says
"tag it reading" and the vault already uses `#books/reading`, reuse the close match and mention it.
See `${CLAUDE_PLUGIN_ROOT}/references/conventions.md` for frontmatter conventions.

The full command catalog — bases, bookmarks, workspaces, history and recovery, publish, sync,
themes and plugin management — lives in `${CLAUDE_PLUGIN_ROOT}/references/obsidian-cli.md`.

## 5. Power moves

- **Rescue orphans.** `orphans` to list unlinked notes, then for each one `search` for the topic,
  and `append` a link from the hub note that should have pointed at it. Works the same for an
  abandoned project note or a half-forgotten recipe.
- **Query a Bases view.** `bases` then `base:views name=<base>` then `base:query ...` pulls a
  structured list straight out of a database view — reading list by status, applications by stage,
  clients by renewal date — without re-deriving it from search.
- **Recover something "lost".** When the user thinks a note is gone or was overwritten:
  `history:list path=<note>`, `history:read` the promising version, show it, then
  `history:restore` only after they confirm which version.
- **Switch context.** `workspaces` then `workspace:load name=<w>` re-arranges Obsidian panes for a
  mode — writing, research, planning — so the user lands where they need to be.
- **Map a tangled topic.** `backlinks` plus `outline` across the three or four notes a search
  returns gives you the real shape of what the user already wrote before you add more to it.
- **Fix the drift.** `unresolved` surfaces links pointing nowhere; offer to create the missing notes
  as stubs or to correct the link text — ask which.

## 6. Safety

- **Bulk operations** — moving, renaming, retagging, or deleting more than a couple of notes — get a
  dry run first: list every affected path and the exact change, then wait for explicit confirmation.
  No partial starts.
- **Deletes** are shown individually and confirmed individually. Prefer moving to the archive folder
  from `config.profile.folders.archive` when one exists.
- Never use `eval` or the generic `command` runner when a dedicated verb exists. Reach for them only
  when nothing in the catalog covers the need, and say what you are running and why first.
- `templates` returns "Error: No template folder configured." until the Templates core plugin has a
  folder set. Treat that as a normal answer: tell the user how to set it, or hand off to vault-template.
- Task line numbers shift between reads. If you touch a task with `ref=path:line`, re-resolve it with
  a fresh `tasks` call immediately before mutating. For anything beyond a one-off, use vault-task.

## 7. When another skill owns it

Hand off rather than improvising: quick capture → vault-capture, templates → vault-template,
write-ups from work just done → vault-doc, decisions → vault-decision, to-dos → vault-task,
check-ins → vault-standup, status for anyone → vault-report, weekly or monthly reviews →
vault-review, diagrams → vault-diagram, backup and sync → vault-sync, sharing outward → vault-share.
Unsure which fits the user's situation → vault-guide.
