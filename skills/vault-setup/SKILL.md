---
name: vault-setup
description: One-time setup wizard for the Obsidian Vault Copilot plugin — creates a brand-new dedicated Obsidian vault, wires up a private GitHub repo, and saves configuration to ~/.claude/obsidian-vault-copilot/config.json. Only run when the user explicitly invokes /vault-setup; never auto-trigger.
disable-model-invocation: true
user-invocable: true
allowed-tools: Bash, Read, Write, AskUserQuestion
argument-hint: "[reconfigure]"
shell: bash
---

# Vault Copilot setup

## Current configuration
!`node "${CLAUDE_PLUGIN_ROOT}/scripts/config.mjs" get`

If the command above printed `NOT_CONFIGURED`, this is a first-time setup. If it printed a JSON config and the user did not pass the `reconfigure` argument, tell them the plugin is already configured (show the vault name and path) and ask whether they want to reconfigure before doing anything else. If they only want to change one field, read the existing config, change just that field, and write the merged result back — don't force them through the whole wizard again.

## Steps, in order

1. **Vault location and name.** Ask for a parent folder and a vault name (e.g. `Engineering`). Never assume or reuse a path from an earlier conversation or another vault (e.g. do not default to anything named "Phoenix" or "SOPs" — those are explicitly out of scope for this plugin). Confirm the exact resulting path before creating anything.

2. **Create the folder and initialize git.**
   - `mkdir -p "<path>"`
   - `git -C "<path>" init`
   - Write a `.gitignore` into it with at least:
     ```
     .obsidian/workspace.json
     .obsidian/workspace-mobile.json
     .obsidian/plugins/*/data.json
     .trash/
     ```
   These are local, reversible actions — do them and tell the user what you did, without a separate confirmation prompt for the mkdir/init themselves.

3. **Manual "open as vault" step.** The Obsidian CLI has no command to register a new vault. Tell the user to open Obsidian and use **File → Open folder as vault** on the exact path just created, and wait for their confirmation that they've done it.

4. **Verify registration.** Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/obsidian-cli.mjs" vaults format=json` and confirm the new vault name appears with the expected path. If it doesn't, say what's likely wrong (Obsidian not running, wrong folder) and re-check — don't proceed with an unverified vault.

5. **GitHub repo.** Ask for a repo name and whether to create it now: `gh repo create <name> --private --source="<path>" --remote=origin`. Always default to `--private`. If the user asks for public, warn clearly that this vault will hold engineering decisions, standups, and reports that may include confidential company information, and get an explicit "yes, public anyway" before running it. State exactly what command will run and get a yes before executing — this creates a real, externally-visible repo.

6. **Manager name and timezone** — used later by `/vault-report` and `/vault-standup`.

7. **Project repos to track.** Ask which of the user's existing project repos should feed standups/reports (e.g. their day-to-day work repos). Save as `projectRepos: [{ "name": "...", "path": "..." }, ...]` — this is what the `activity-collector` subagent walks. Skip if they'd rather add these later.

8. **Org-contribution feature (optional).** Ask if they already have a shared org knowledge repo to contribute into. If yes, get its local clone path (or offer to `git clone` it) and save as `orgRepoPath`. If not ready yet, skip — `/vault-contribute` will just tell them to run `/vault-setup reconfigure` later.

9. **obsidian-git safety net (optional).** Explain: this installs Obsidian's community "Git" plugin configured to auto-*commit only* (never auto-push) on an interval, so notes aren't lost if Claude Code isn't running when the user edits by hand. If they agree:
   `node "${CLAUDE_PLUGIN_ROOT}/scripts/obsidian-cli.mjs" plugin:install id=obsidian-git enable`
   Then tell them explicitly to open Settings → Community plugins → Git in Obsidian and enable an auto-commit interval or "auto backup after file change," and to leave any auto-push setting **off** — this plugin cannot configure a community plugin's internal settings via the CLI, so be explicit that this is a manual follow-up.

10. **Save the config.** Determine the home directory portably: `node -e "console.log(require('os').homedir())"`. Then use the Write tool to create `<that path>/.claude/obsidian-vault-copilot/config.json` containing `vaultName`, `vaultPath`, `githubRepoUrl` (if created), `githubRemoteName` ("origin"), `managerName`, `timezone`, `projectRepos`, `orgRepoPath` (if any), and `createdAt` (current ISO timestamp). Show the user the exact JSON before writing it.

11. **Confirm.** Re-run `node "${CLAUDE_PLUGIN_ROOT}/scripts/obsidian-probe.mjs"` and show the result.

## Notes
- Never write a path or vault name the user didn't just give you in this run.
- Config lives outside this plugin's repo entirely (`~/.claude/...`), so it's never at risk of being committed alongside the plugin's own source.
