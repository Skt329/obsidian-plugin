---
name: vault-standup
description: Generate today's standup update (yesterday/today/blockers) from recent git activity and vault to-dos/decisions, and optionally a forward-looking "next week" section. Use when preparing for standup, or the user asks "what did I do yesterday", "write my standup", "what's my plan for next week".
allowed-tools: Bash, Read
argument-hint: "[weekly]"
shell: bash
---

# Standup

## Gather activity first
Delegate cross-repo git history to the `activity-collector` subagent rather than running `git log` across multiple repos inline — it returns a compact digest instead of flooding this conversation with raw log output. Pass it the time window you need (yesterday for a daily standup, the last 7 days for `weekly`) and the `projectRepos` list from config.

Also pull from the vault itself:
- `obsidian daily:path` to find where daily notes live, then `obsidian daily:read` for anything logged directly there.
- `obsidian tasks status=done` (scoped to the window) for completed to-dos.
- `obsidian tasks status=todo` for what's still open — this becomes "today."
- Anything tagged `#blocked`, with `status: blocked` frontmatter, or found via `obsidian search query="blocked"` — this becomes "blockers."

## Structure (daily, no `weekly` argument)
```
## Standup — <date>
**Yesterday:** ...
**Today:** ...
**Blockers:** ... (omit this line entirely if none)
```

## Structure (`weekly` argument)
Same yesterday/today/blockers for the day, plus:
```
**Next week:** ...
```
drawn from upcoming due dates in open tasks and any `status: proposed` decisions awaiting a call.

## Output
1. Print the standup in chat.
2. Append it to today's daily note under a `## Standup` heading: `obsidian daily:append content="..."`.
Never send it anywhere else automatically — Slack/email delivery is outside this skill; that's the user's action (or a future integration once one is authorized).
