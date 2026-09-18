---
name: vault-sync
description: Back up or sync the Obsidian vault and review what changed — commit and push with git when git is configured, or check the status of another sync method. Use when someone says sync my vault, back up my notes, commit my notes, or asks whether their notes are safely saved.
argument-hint: "[push]"
---

# Vault Sync

Make sure the user's notes are safely saved, whatever they use to save them. Git is **one** option
here, not the assumption — plenty of people back a vault up with Obsidian Sync, a cloud folder, or
nothing at all.

## 1. Resolve config first — always

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/config.mjs" summary
node "${CLAUDE_PLUGIN_ROOT}/scripts/config.mjs" get syncMode
```

If the summary prints `NOT_CONFIGURED`, stop and tell the user to run the vault-setup skill first.
Never guess a vault or a path.

Branch on `syncMode`: `git` → §2, `obsidian-sync` → §3, `cloud-folder` → §4, `none` or empty → §5.
If the value contradicts reality (config says `git`, no `.git` directory exists), say so and ask
rather than improvising.

## 2. syncMode `git`

### 2a. Look before touching anything

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/git-helpers.mjs" status
node "${CLAUDE_PLUGIN_ROOT}/scripts/git-helpers.mjs" diff-stat
```

Both read-only. If the tree is clean, say everything is already committed and stop.

### 2b. Screen the changes before staging

Read the changed notes and look for:

- **Notes marked confidential** — `confidential: true` or the vault's own private property (check
  `config.profile.existingProperties`) heading for a remote. Usually unintentional.
- **Secret-shaped strings** — keys, tokens, passwords, recovery codes, card numbers pasted into a
  note. Journals and reference notes collect these more often than work notes do.
- **Obsidian UI churn** — `.obsidian/workspace*.json` records which panes were open, not content.
  It should already be gitignored; if it appears, flag the noise.

Anything that trips a check: stop, show the file and the offending line, and ask. Do not stage it
on the user's behalf.

### 2c. Draft a message that says what actually changed

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/git-helpers.mjs" recent-activity
```

Use that log plus the diff to write one specific line naming the notes and what happened to them:

> Add decision note on the flat vs house call; 3 reading notes from Deep Work; close 4 tasks; week-38 review

Never `Update notes` or `Sync vault`. The user should be able to scan it in six months and know
what this commit was.

### 2d. Commit — only after the user sees it

Show the exact message and the full file list, then wait for a yes:

```
git -C "<vaultPath>" add -A
git -C "<vaultPath>" commit -m "<message>"
```

If the user wants only some changes, stage those paths explicitly instead of `add -A`.

### 2e. Push — with an explicit remote choice

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/git-helpers.mjs" remotes
```

- **No remote** → the commit is a local backup only. Say that plainly, and offer to walk the user
  through adding a remote themselves. Never create one for them.
- **One remote** → name it and the branch, and confirm.
- **More than one** → **ask which**. Never pick. A vault often has a personal remote and a shared
  one, and pushing private notes to the wrong one is not recoverable.

Once confirmed:

```
VAULT_COPILOT_CONFIRMED_PUSH=1 git -C "<vaultPath>" push <remote> <branch>
```

The `VAULT_COPILOT_CONFIRMED_PUSH=1` prefix is mandatory — a `PreToolUse` hook blocks any push at
the vault that lacks it. It means "the user saw this diff and this remote and said yes." Never add
it to a push the user has not actually approved.

## 3. syncMode `obsidian-sync`

Obsidian Sync already handles this; your job is to report, not replace it.

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/obsidian-cli.mjs" sync:status
```

Report it plainly: up to date, still uploading, or paused. When the picture looks odd,
`sync:deleted` lists files removed on another device, and `sync:history path=<note>` then
`sync:restore` recovers a note the user thinks they lost — show the version and confirm before
restoring. To pause or resume, `sync off` / `sync on`; ask first, and remind the user to turn it
back on if they pause. Do not layer a git workflow on top — wanting version control *as well* is a
change to `syncMode` and belongs in vault-setup.

## 4. syncMode `cloud-folder`

The vault sits inside a folder a cloud client (Drive, Dropbox, iCloud, OneDrive, Syncthing)
mirrors. Confirm `vaultPath` really is under that synced folder — people move vaults and forget.

Then check the failure mode that actually bites: **conflicted copies**. Cloud clients resolve
simultaneous edits by duplicating the file with a marker in the name. Search for names containing
`conflicted copy`, `conflict`, or a device name, list what you find, and offer to reconcile them
one at a time. Never bulk-delete duplicates — one of them may hold the only copy of something.

Mention once that the cloud client's own tray or menu-bar status is the source of truth for whether
the last sync succeeded; you cannot see it from here.

## 5. syncMode `none`

Say the risk once, concretely and without a lecture: the vault exists on one disk, so a failed
drive or a bad delete loses it, and Obsidian's own `history` only reaches back so far. Then lay out
the options — git for version history, Obsidian Sync for hands-off multi-device, a cloud folder for
simplicity, a periodic copy to an external drive for the minimalist — and offer vault-setup.

If the user says no, accept it and do not raise it again this session. Some people genuinely do not
want another system, and a vault of recipes and journal entries is not the risk profile of a decade
of research notes.

## Guardrails

- Every path, vault name and remote comes from config. Nothing is hardcoded.
- Never change a repository's visibility, and never add a remote or a sync account — those are the
  user's own actions in their own account.
- Never sync on a schedule, on session end, or as a side effect of another skill. Always a
  deliberate action the user asked for.
- Deleting history or force-pushing is out of scope. Hand it back to the user with an explanation.
- Sharing one note outward is vault-share. This skill only moves the whole vault to the backup the
  user already chose.
- If an Obsidian CLI call times out the app is busy or closed — say so and offer to retry, rather
  than looping.
