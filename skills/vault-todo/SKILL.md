---
name: vault-todo
description: Add, list, or complete engineering to-dos in the Obsidian vault. Use when the user says "add a to-do", "what's on my list", "mark X done", "what do I still owe on this project", or references outstanding work.
allowed-tools: Bash, Read
shell: bash
---

# To-dos

Built entirely on the Obsidian CLI's real task commands — don't invent a separate to-do format.

## Adding a task
- If it belongs to a specific project note, append it inline under a `## Tasks` heading in that note: `obsidian append file="<project-note>" content="- [ ] <task text>"`. Add the heading first if it doesn't exist yet.
- If there's no obvious project home, put it in `Todos/inbox.md` (create it if needed).
- Ask once whether it should also go on today's daily note (`obsidian daily:append content="- [ ] <task text>"`) rather than assuming.

## Listing tasks
- `obsidian tasks format=json` for everything; filter with `todo`, `done`, `status="<char>"`, `file=`/`path=`, or `active`/`daily` for the current or daily note.
- `verbose` groups results by file with line numbers — use this whenever you'll act on the results next, since you need `ref=path:line` for mutation.

## Completing / toggling a task
**Always re-resolve the task's `ref` immediately before mutating it** — run `obsidian tasks format=json verbose` (filtered to the relevant file) right before the mutation, even if you listed tasks earlier in the conversation. Line numbers shift as soon as anything else edits that file.
- `obsidian task ref="<path:line>" done` — mark complete.
- `obsidian task ref="<path:line>" toggle` — flip status.
- `obsidian task ref="<path:line>" status="<char>"` — for vaults using custom task-status characters, if the user has one.

## Reporting back
When asked "what's open for <project>", filter by that project's tag or folder rather than dumping the entire vault's task list.
