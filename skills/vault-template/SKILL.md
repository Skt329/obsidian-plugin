---
name: vault-template
description: Create, edit, list, or apply note templates in the Obsidian vault, and install a starter template library. Use when someone wants a reusable note format, says create a template, make a template for, set up templates, use my template, or wants notes of a certain kind to follow a consistent structure.
argument-hint: "[create|list|install|apply]"
shell: bash
---

# Templates for any kind of recurring note

A template is for anything the user writes more than once: a meeting note, a reading note, a decision record, a workout log, a client brief, a job application, a trip plan, a lecture summary. Never assume the subject matter.

## 1. Resolve config and the real vault first
!`node "${CLAUDE_PLUGIN_ROOT}/scripts/config.mjs" summary`

If that printed `NOT_CONFIGURED`, stop and ask the user to run `/vault-setup`. Never guess a vault.

Then scan the actual vault before proposing anything:
```
node "${CLAUDE_PLUGIN_ROOT}/scripts/vault-profile.mjs" scan
```
Read `templateFolder`, `hasTemplaterPlugin`, `existingTags`, `existingProperties`, `folders`. Reuse the property names and tags already in use — a new template that invents `topic:` when the vault already uses `subject:` quietly breaks every future query.

Full command catalog: `${CLAUDE_PLUGIN_ROOT}/references/obsidian-cli.md`. Folder and frontmatter conventions: `${CLAUDE_PLUGIN_ROOT}/references/conventions.md`. Per-persona recipes: `${CLAUDE_PLUGIN_ROOT}/references/use-cases.md`.

## 2. List what already exists
```
node "${CLAUDE_PLUGIN_ROOT}/scripts/obsidian-cli.mjs" templates
node "${CLAUDE_PLUGIN_ROOT}/scripts/obsidian-cli.mjs" template:read name="<template name>"
```

**Expect this exact failure:** `Error: No template folder configured.` It means Obsidian's Templates core plugin has no folder set. Do not fail silently and do not work around it by writing files somewhere arbitrary. Say plainly what is missing and offer both fixes:
- The user sets it themselves: Obsidian → Settings → Templates → "Template folder location".
- Or you create a folder (suggest one that fits their existing structure, e.g. a `Templates` folder beside their notes) and they point that one setting at it. It is a single setting; say so, so it does not sound like a chore.

Templates will not expand variables until that setting exists, so resolve it before installing or applying anything.

## 3. Install the starter library (`install`)
Starter files live in `${CLAUDE_PLUGIN_ROOT}/references/templates/`. Filter by `useCases` in config, and offer anything else only if the user asks to see the full list.

1. List the exact files you propose to copy, with a one-line description each, and where each will land.
2. Check for name collisions first (`obsidian files` or `obsidian file path="..."`). **Never overwrite an existing template.** On a collision, offer: skip, save under a different name, or show a diff and let the user decide.
3. Get explicit confirmation, then copy with `obsidian create path="<templateFolder>/<Name>.md" content="..."`.
4. Report what was written and what was skipped.

## 4. Create a template (`create`)
Three routes — pick the one that matches what the user actually has.

**(a) From a description.** Ask at most three questions: what kind of note is this, what do you want to be able to find or compare later, and what do you always forget to write down? Draft from the answers, show the draft, then save.

**(b) From a note they already like.** `obsidian read file="..."` (or `obsidian outline file="..." format=tree` for a long one). Keep the structure and the headings; replace the specifics — names, dates, project names, numbers — with placeholders or with a short prompt line saying what belongs there. Show the before/after of one section so the user can see what was generalized.

**(c) From a pattern across several notes.** Use `obsidian search query="..." format=json` or `search:context` to pull the notes of that kind, and `obsidian properties format=json` to see which frontmatter fields co-occur. Propose the skeleton they already converge on, and name the parts that are inconsistent so the user can decide the canonical form.

If this skill is invoked inside a working session where the assistant has just helped produce a note of some kind for the second or third time, say so and offer to capture it as a template — that is often the best moment to catch one.

## 5. Template syntax
**Core Templates plugin (always available once the folder is set):**
- `{{title}}` — the new note's name
- `{{date}}`, `{{time}}`, and with a format string: `{{date:YYYY-MM-DD}}`, `{{time:HH:mm}}`

These expand only when Obsidian *inserts* the template. Writing a template file just stores the literal text, which is correct.

**Templater (community plugin):** richer dynamic syntax — `<% tp.file.title %>`, `<% tp.date.now("YYYY-MM-DD") %>`, interactive prompts. Only use it if the profile scan shows `hasTemplaterPlugin: true` (or `obsidian plugins:enabled` lists it). Otherwise that syntax sits in the note as visible junk text. Check, do not assume.

## 6. Designing a good template
A template is a thinking scaffold, not a form to fill in.
- Few meaningful prompts beat many empty fields. Three headings that ask real questions ("What did I actually decide, and what would change my mind?") produce better notes than ten blanks that rot.
- Write prompts as questions or short instructions, not bare labels.
- Put in frontmatter only what makes the note findable later — typically a type, a date, and one or two fields worth filtering on. Reuse existing property names from the scan.
- Keep headings stable across notes of the same kind. Stable headings are what make two notes comparable, and what make "show me every note where the outcome was X" possible at all.
- Leave room for the note to go off-script; a final open section is usually worth it.

Consistent frontmatter is also what makes Obsidian **Bases** views and property queries useful later (`obsidian bases`, `base:views`, `base:query`, `base:create`). Design the template once, and every note of that kind becomes queryable for free — worth mentioning to the user when they are choosing fields.

## 7. Apply a template (`apply`)
**To a new note** — two routes:
- *Variables expand:* create the note, open it, then `obsidian template:insert name="<template>"`. Use this when `{{date}}`/`{{title}}` should resolve the Obsidian way.
- *Deterministic:* `obsidian template:read name="<template>"`, fill the placeholders yourself with real values from the conversation, then `obsidian create path="<Folder>/<Name>.md" content="..."`. Prefer this when you already know the content — the user gets a filled note, not an empty skeleton. Use `obsidian unique` if a non-colliding name is needed.

**To an existing note — never overwrite it.** Read it first, take its `outline`, and add only the sections that are missing, with `obsidian append` / `obsidian prepend`. For frontmatter, use `obsidian property:set` field by field rather than rewriting the file. Show the user exactly which sections will be added, and where, before writing.

## 8. Rules
- Propose, do not impose: an existing vault with its own structure is the normal case. Fit the template into where similar notes already live.
- Confirm before anything that writes more than one file, overwrites, or bulk-edits existing notes.
- If the Obsidian CLI hangs, the app is busy (startup or update check); the wrapper times out at 20s. Report that rather than retrying blindly.
- Related skills: `/vault-setup` to configure, `/vault-ops` for general reads and edits, `/vault-doc` and `/vault-decision` for notes that have their own purpose-built flows.
