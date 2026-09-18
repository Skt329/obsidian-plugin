---
name: vault-sync
description: Review and commit/push changes in the Obsidian vault's git repo, with a content-aware commit message. Invoke with /vault-sync, or when the user says "sync my vault", "commit my notes", "push my vault".
allowed-tools: Bash, Read
shell: bash
---

# Vault sync

This is the **only** skill that commits or pushes the vault. A `PreToolUse` hook blocks any other direct `git push` against the configured vault or org repo path.

## 1. Status and diff — read-only, always first
```
node "${CLAUDE_PLUGIN_ROOT}/scripts/git-helpers.mjs" status
node "${CLAUDE_PLUGIN_ROOT}/scripts/git-helpers.mjs" diff-stat
```
If there's nothing to commit, say so and stop.

## 2. Screen for anything that shouldn't be committed
Before staging, check the changed files for:
- Anything under a note marked `confidential: true` that looks unintentionally included.
- Obvious secret-shaped strings (API keys, tokens, passwords) accidentally pasted into a note.
- Noisy Obsidian internals (`.obsidian/workspace*.json`) — these should already be gitignored by `/vault-setup`; if they show up anyway, flag it rather than silently committing UI-state churn.
If anything looks off, stop and ask before staging it.

## 3. Draft a content-aware commit message
Use the recent activity log for signal, not just the raw diff:
```
node "${CLAUDE_PLUGIN_ROOT}/scripts/git-helpers.mjs" recent-activity
```
Summarize what actually changed in one line, e.g. `Add decision: adopt Kafka for event bus; close 2 Phoenix to-dos; standup 2026-09-18` — not a generic "update notes."

## 4. Commit — with confirmation
Show the exact message and file list, then:
```
git -C "<vaultPath>" add -A
git -C "<vaultPath>" commit -m "<message>"
```

## 5. Push — with confirmation, and an explicit remote choice
```
node "${CLAUDE_PLUGIN_ROOT}/scripts/git-helpers.mjs" remotes
```
If there's more than one remote, **ask the user which one** before doing anything — never assume. Once confirmed:
```
VAULT_COPILOT_CONFIRMED_PUSH=1 git -C "<vaultPath>" push <remote> <branch>
```
The `VAULT_COPILOT_CONFIRMED_PUSH=1` prefix is required — it's what tells the `PreToolUse` push guard this went through review. Never omit it, and never add it to a push you haven't actually shown the user and gotten a yes on.

## What this skill never does
- Never changes a repo's visibility (public/private) — that's the user's own action.
- Never picks a remote for the user when more than one exists.
- Never runs on a schedule or automatically — always a deliberate, reviewed action.
