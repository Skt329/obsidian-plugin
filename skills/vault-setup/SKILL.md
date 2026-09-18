---
name: vault-setup
description: Set up or reconfigure the Obsidian vault plugin — attach it to an existing vault or create a new one, detect how that vault is already organized, and record preferences. Use when someone wants to get started with their vault, connect a vault, change vault settings, or when no vault is configured yet.
argument-hint: "[reconfigure]"
shell: bash
---

# Vault setup

Setup **reads and records**. It never modifies, moves, renames or reorganizes anything already in the user's vault. Say this out loud early — most people arrive with a vault they have spent years building and they are right to be protective of it.

## Current configuration
!`node "${CLAUDE_PLUGIN_ROOT}/scripts/config.mjs" get`

- `NOT_CONFIGURED` → first-time setup, continue below.
- A JSON config and no `reconfigure` argument → summarise what is already configured (vault, use cases, audience, sync mode) and ask what they want to change. Support changing **one field**: read the existing config, replace just that key, write the merged result back. Do not replay the whole flow.

## 1. Find out what already exists
```
node "${CLAUDE_PLUGIN_ROOT}/scripts/obsidian-cli.mjs" vaults format=json
```
This lists vaults Obsidian already knows about. The CLI talks to the running Obsidian app, so if it errors or hangs, the app is probably closed or still starting — say so and offer to retry rather than guessing.

Show the real list, then ask which route they want. **Never pick silently, and never touch a vault they did not choose.**

| Route | When |
|---|---|
| a. Use an existing vault | The common case. Works at any size; nothing gets reorganized. |
| b. Point at an existing folder of markdown notes | Notes exist but Obsidian has never opened that folder. |
| c. Create a brand-new vault | They are starting fresh. |

For route (b), treat it as route (c) from the "open folder as vault" step onward — the folder already has content, so skip any starting structure.

## 2. Route a or b — profile the vault
```
node "${CLAUDE_PLUGIN_ROOT}/scripts/vault-profile.mjs" scan
```
Show the user what came back, in plain language: folders, roughly how many notes, tags already in use, frontmatter properties already in use, whether a template folder and daily-note folder are configured, which community plugins are enabled.

This profile is the contract every other skill follows. So:
- Confirm where new notes of each kind should land — daily notes, longer write-ups, captures, templates, archive — and **default every answer to a folder the vault already has**. If they keep daily notes in `Journal/`, that is the answer; do not suggest `Daily/`.
- Match their existing naming and casing rather than introducing a second style.
- Reuse tags and properties that already appear in the scan instead of inventing parallel ones.
- Only propose creating a folder when the scan shows nothing suitable, and ask before creating it. Propose, do not impose.
- If the vault has no discernible system at all, say so honestly and offer a light default — still as a suggestion they can decline.

Record all of this under `profile` in the config (folders, namingStyle, dailyNoteFormat, existingTags, existingProperties, hasTemplaterPlugin, hasTasksPlugin) and set `setupMode: "existing"`.

## 3. Route c — create a new vault
1. Confirm the exact parent folder and vault name, then `mkdir -p "<path>"`. Never reuse a path from an earlier conversation.
2. The CLI has **no create-vault command**. Tell the user to open Obsidian and use **File → Open folder as vault** on that exact path, and wait for them to confirm they have done it.
3. Verify: re-run `obsidian-cli.mjs vaults format=json` and check the new name and path appear. If not, the likely causes are Obsidian not running or a different folder picked — re-check rather than proceeding on an unverified vault.
4. Offer a light starting structure (somewhere for daily notes, longer notes, templates, archive) and let them decline it or rename every folder. Set `setupMode: "new"`.

## 4. What they will use it for
Ask which of these apply — several is normal, and work and personal usually mix:
work projects · personal life and journaling · study · research · writing · client work · leading a team · household and admin

Store as `useCases`. This decides which starter templates get installed and what `vault-guide` recommends, so it is worth a real answer rather than a shrug.

## 5. Who updates are for (optional)
Ask who status updates usually go to, if anyone: a manager, a client, a team, a study group, a partner — or **just themselves**, which is a perfectly normal answer and the right default when they hesitate. Store `audienceLabel` and optionally `audienceName`. Also capture `timezone` if daily or weekly rhythms matter to them.

## 6. Backup and sync (optional, no default)
Present honestly as four real options, with none pushed:
- **git** — offer to `git init` in the vault and write a `.gitignore` covering `.obsidian/workspace.json`, `.obsidian/workspace-mobile.json`, `.obsidian/plugins/*/data.json`, `.trash/`. Creating a remote is a separate, explicit confirmation and always defaults to **private** — a personal vault can hold health notes, finances, journal entries, client or employer material. If they ask for public, state that plainly and get an unambiguous yes.
- **Obsidian Sync** — if they already use it, record it and do nothing else.
- **a cloud-synced folder** (Drive, iCloud, Dropbox, OneDrive) — record it and do nothing else.
- **nothing** — a legitimate choice. Do not lobby.

Store as `syncMode` (`git` | `obsidian-sync` | `cloud-folder` | `none`), plus `gitRemoteName` if applicable.

## 7. Starter templates (optional)
Offer to copy the subset of `${CLAUDE_PLUGIN_ROOT}/references/templates/` matching their `useCases` into the vault's template folder. Show the list of file names before copying, and skip any name that already exists rather than overwriting.

If `obsidian templates` returns **"Error: No template folder configured."**, that is expected and not a failure — the Templates core plugin has no folder set. Either tell them to set it in **Settings → Templates → Template folder location**, or offer to create a folder and ask them to point the setting at it. Do not copy templates into a folder Obsidian will not read from.

## 8. Optional extras — ask, never assume
- Project or work folders that should feed reports and reviews → `projectRepos: [{name, path}]`. Skip if they have none; this plugin does not require code.
- A shared repo they contribute notes to → `sharedRepoPath`.
- Whether generated reports should also be saved into the vault → `reportsSaveToVault`.

## 9. Write the config
Resolve the home directory portably: `node -e "console.log(require('os').homedir())"`. Then use the **Write** tool to create `<home>/.claude/obsidian-vault-copilot/config.json` with the keys gathered above plus `createdAt` (ISO timestamp). Show the exact JSON and get a yes before writing. The config lives outside the plugin repo so it can never be committed with the plugin's source.

## 10. Confirm
Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/obsidian-probe.mjs"` and show the result. Then point them at `vault-guide` for recipes matched to the use cases they just chose.

## Rules
- Never write a vault name or path the user did not give you in this run.
- Never create, move, rename or delete anything in an existing vault during setup.
- If any step fails, stop and report it — a half-written config is worse than none.
