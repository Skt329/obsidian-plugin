---
name: vault-project
description: Start a new project inside the vault, set up the way an existing project already is — a hub note plus named sections such as Documentation, Updates, Decisions and Ideas. Use when someone says start a new project, set up a project like this one, create a new area for a project, or wants a fresh folder structured the same as one they already have.
argument-hint: "[project name]"
---

# New project

This vault's own projects are the template — never a folder taxonomy this plugin invents. If the
vault has no recognizable project pattern yet, say so and offer `vault-setup` instead of guessing one.

## 1. Resolve config and the vault's real pattern

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/config.mjs" summary
```

`NOT_CONFIGURED` → stop, point at `vault-setup`. Otherwise read `profile.projects` (recorded
patterns) — if that is empty, run the live detector before assuming there is nothing to learn from:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/vault-profile.mjs" scan
```

Look at `detectedProjects` in the result. This is a **proposal only** — nothing is written to
config by scanning. If it found projects, show them and use them as exemplars below. If it found
none and `profile.projects` is also empty, this vault has no project-hub pattern to copy: say so
plainly and either ask the user to describe the structure they want (build a spec with
`specFromKinds`-shaped sections by hand) or suggest a single new note via `vault-doc`/`vault-capture`
instead — do not invent a hub-and-sections layout nobody asked for.

## 2. Pick the exemplar and the new name

Ask which existing project to copy the pattern from (if more than one exists and it isn't obvious
from context), and the exact name for the new project. Never reuse a name from an earlier
conversation — confirm it fresh every time. Check it doesn't already exist:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/obsidian-cli.mjs" folders
```

If the name is already a top-level folder, stop and ask what the user actually wants (a different
name, or to add to the existing project instead of creating a new one).

## 3. Build the spec and preview it — never skip the preview

Write a small JSON file with the Write tool (a temp path is fine) shaped like this, using the
**chosen exemplar's own `sections`/`kinds`** — never the vault-wide merged kind pool, since two
projects may spell a section differently:

```json
{
  "name": "NewProjectName",
  "root": "NewProjectName",
  "hub": "00-START-HERE.md",
  "folderReadme": "00-about this folder.md",
  "sections": { "Decisions": "decisions", "Documentation": "documentation", "Updates": "updates" },
  "kinds": {
    "decisions": { "label": "Decisions", "lifecycle": "openClosed" },
    "documentation": { "label": "Documentation", "lifecycle": "reference" },
    "updates": { "label": "Updates", "lifecycle": "appendOnly" }
  }
}
```

If the user wants to drop or add a section compared to the exemplar, edit `sections`/`kinds`
accordingly before previewing — confirm the change with them first.

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/scaffold.mjs" plan <spec.json>
```

This touches nothing. Show the user the exact list of files it will create and why (the folder
about-notes exist only because the CLI has no `mkdir` — a file is what brings a folder into
being). Get an explicit yes before continuing.

## 4. Create it

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/scaffold.mjs" run <spec.json>
```

Report `created` and `skipped` from the JSON result exactly — `skipped` means a file already
existed and was left untouched, which is normal on a re-run, not an error. If `ok` is false, show
the `error` and stop; do not retry blindly.

## 5. Record the new project so other skills pick it up immediately

Read the current config, merge the new project into `profile.projects` (append an entry shaped
like the spec: `name`, `root`, `hub`, `folderReadme`, `sections`) and merge any genuinely new kind
ids into `profile.kinds` (an id already defined stays as-is — do not overwrite an existing kind's
naming/lifecycle from this one project). Show the merged config and write it with the Write tool.
Without this step, `vault-decision`/`vault-doc`/`vault-standup` won't know the new project exists
until someone re-runs `vault-setup`.

## 6. Close the loop

Point at the hub note you just created and suggest the natural next step: a first decision
(`vault-decision`), a documentation page (`vault-doc`), or just leaving it for now. Mention that
`vault-project` is safe to re-run on the same name later — it only fills in whatever is still
missing.

## Guardrails

- Never invent a hub-and-sections structure for a vault that has no such pattern; ask instead.
- Never overwrite an existing file — the executor already refuses to, but never construct a spec
  whose root collides with an existing top-level folder without the user explicitly confirming
  they want to add to it.
- Deleting or renaming a scaffolded project is out of scope for this skill — use `vault-ops` for
  that, and know that removing files leaves their now-empty parent folders on disk (verified live:
  the CLI's `delete` has no matching `rmdir`), which is harmless but worth mentioning if asked.
- This creates real files in the user's vault — always preview with `plan` before `run`.
