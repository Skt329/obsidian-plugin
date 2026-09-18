---
name: vault-contribute
description: Curate and share a specific note or excerpt from the private vault into the shared org-knowledge repo via a pull request. Use when the user says "share this with the team", "contribute this to the org repo", "add this to our shared knowledge base".
allowed-tools: Bash, Read
shell: bash
---

# Contributing to the org repo

## Prerequisite
!`node "${CLAUDE_PLUGIN_ROOT}/scripts/config.mjs" get orgRepoPath`

If this is empty, tell the user the org-contribution feature isn't configured yet and stop — suggest `/vault-setup reconfigure` once they have an org repo to point at. Never guess or repurpose an unrelated existing repo without being explicitly told to.

## 1. Read the source note
`obsidian read file="<name>"` (or the specific excerpt the user points to). If frontmatter has `confidential: true`, stop and require an explicit "yes, override" before continuing.

## 2. Mandatory redaction review — nothing leaves the vault before this
Scan the extracted text for anything that shouldn't go to a wider audience: internal codenames, customer/employee names, secret- or token-shaped strings, internal URLs/hostnames, unreleased plans. Show the user the original next to your proposed redacted version and get explicit approval, edits, or a cancel — every time, even for notes that look harmless.

## 3. Stage on a new branch of the org repo — never the default branch, never a direct commit to it
```
git -C "<orgRepoPath>" fetch origin
git -C "<orgRepoPath>" switch -c "contribute/<slug>" origin/<default-branch>
```
Write the approved (redacted) content into the org repo's own existing structure (e.g. `meta/`, `standards/`) rather than inventing a new layout.

## 4. Run the org repo's own validation, if it has one
Check for a contract/lint tool in the org repo (e.g. something under `tools/`) and run it against the new file before proceeding, surfacing any failures.

## 5. Open a PR — never push to the default branch
```
git -C "<orgRepoPath>" add -A
git -C "<orgRepoPath>" commit -m "<message>"
VAULT_COPILOT_CONFIRMED_PUSH=1 git -C "<orgRepoPath>" push -u origin "contribute/<slug>"
gh pr create --repo <org/repo> --base <default-branch> --head "contribute/<slug>" --title "<title>" --body "<body>"
```
Show the exact title/body/diff and get explicit confirmation immediately before the `gh pr create` call — this publishes to a shared repo.

## What this never does
- Never pushes to the org repo's default branch.
- Never scans the whole vault for "what's shareable" — this only acts on a note/excerpt the user names.
- Never modifies anything in the private vault itself. If the user wants a "Shared: <PR URL>" breadcrumb added back to the original note, do that only as an explicit, separate step they ask for.
