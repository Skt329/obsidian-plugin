---
name: vault-ops
description: Read, search, or make general-purpose edits in the user's Obsidian vault via the Obsidian CLI — finding notes, listing tags/links, creating or appending an ordinary note, checking vault structure. For decisions/trade-offs use vault-decision, for to-dos use vault-todo, for standups use vault-standup, for manager reports use vault-report, for Mermaid diagrams use vault-diagram, for committing/pushing use vault-sync, for sharing to the org repo use vault-contribute.
allowed-tools: Bash, Read
shell: bash
---

# Vault operations reference

This is the shared reference every other Vault Copilot skill assumes. Re-check the configuration below each time — don't rely on memory of a previous session.

## Configuration
!`node "${CLAUDE_PLUGIN_ROOT}/scripts/config.mjs" get`

If this prints `NOT_CONFIGURED`, stop and tell the user to run `/vault-setup` first — never guess a vault name or path.

## Always target the vault explicitly
The user may have more than one vault open in Obsidian. Every `obsidian` CLI call in this plugin passes `vault=<vaultName>` from the config above — never rely on "the active vault." The bundled wrapper does this automatically:
```
node "${CLAUDE_PLUGIN_ROOT}/scripts/obsidian-cli.mjs" <command> [key=value ...]
```
It injects `vault=<configured name>` unless one is already present, and forwards stdout/stderr/exit code as-is. Call `obsidian` directly with an explicit `vault=` argument when you want the exact command visible to the user; use the wrapper for convenience in scripted checks.

## Folder taxonomy (this vault only — created fresh by /vault-setup)
```
Decisions/   ADR-style notes — YYYY-MM-DD-short-slug.md (see vault-decision)
Todos/       inbox.md catch-all; project to-dos live inline in project notes under "## Tasks"
Reports/     optional saved copies of EOD/EOW reports (opt-in, see vault-report)
Diagrams/    standalone Mermaid notes not embedded inline (see vault-diagram)
```
Everything else (project notes, general docs) has no fixed home — follow whatever structure the user already has, and use `obsidian search` / `obsidian folders` to find where similar notes already live before creating a new folder.

## Frontmatter schema
```yaml
type: decision | todo | standup | report | diagram | doc
project: <string>
status: proposed | accepted | superseded | done | blocked | in-progress
date: YYYY-MM-DD
tags: [decision, <project>]
confidential: true | false
```
Only add fields relevant to a given note's `type` — don't force all of them onto plain notes.

## Useful read/search commands
- `obsidian search query="<text>" format=json` / `obsidian search:context query="<text>"` — full-text search.
- `obsidian tags format=json` / `obsidian tags active` — vault-wide or current-file tags.
- `obsidian properties format=json` — every frontmatter property in use, with counts (`counts`) — check before inventing a new property name.
- `obsidian backlinks file="<name>"` / `obsidian links file="<name>"` / `obsidian unresolved` / `obsidian orphans` — link-graph checks. Run `backlinks` after creating a note that should link to/from existing ones, to confirm the link actually resolved.
- `obsidian outline file="<name>" format=tree` — headings, so you can edit one section without re-reading the whole file.
- `obsidian read file="<name>"` — full content when actually needed (prefer `outline` / `search:context` first for large notes).

## Useful write commands
- `obsidian create name="<name>" path="<Folder/name.md>" content="<text>"` — new note. Use `\n` for newlines inside `content=`.
- `obsidian append` / `obsidian prepend` — with `file=` or `path=`, `content=`, `inline` to skip the leading newline.
- `obsidian property:set name="<prop>" value="<v>" type=text|list|number|checkbox|date|datetime file="<name>"` — update one frontmatter field without rewriting the whole note.
- `obsidian move file="<name>" to="<Folder/new-name.md>"` / `obsidian rename` — always use these rather than hand-editing paths, so Obsidian updates links automatically.

## What NOT to do
- Never hardcode a vault name or path — always resolve from config.
- Never use `obsidian eval` (arbitrary JS in the running app) or `obsidian command` (runs any registered Obsidian command) unless no dedicated CLI verb covers what's needed, and never build an `eval` payload by interpolating raw note content into it.
- Never run `git push` directly against the vault or org repo — that's `vault-sync` / `vault-contribute` only (a `PreToolUse` hook blocks unconfirmed direct pushes).
- When mutating a task by `ref=path:line`, re-resolve the ref immediately before the mutation (`obsidian tasks format=json`) — don't reuse a line number read earlier in the conversation; edits shift line numbers.
