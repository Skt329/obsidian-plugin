# Vault Conventions — Adaptive, Not Prescriptive

**This plugin adapts to the user's vault. It never imposes a system on it.**

Most people arrive with a vault they already live in: folders they chose, tags they
trust, a naming habit built over years. A plugin that renames their folders, invents a
taxonomy, or bolts eight properties onto a plain note is a plugin they uninstall the
same day. Read what is already there, follow it, and propose changes instead of making
them.

Everything below is a **default of last resort** — what to do when a vault genuinely has
no convention yet. The recorded profile and the live vault always win over this document.

---

## 1. Read the profile before you write anything

Two sources, cheapest first:

```bash
# Recorded at setup — fast, no Obsidian round-trip
node "${CLAUDE_PLUGIN_ROOT}/scripts/config.mjs" summary
node "${CLAUDE_PLUGIN_ROOT}/scripts/config.mjs" get profile.folders
node "${CLAUDE_PLUGIN_ROOT}/scripts/config.mjs" get profile.namingStyle

# Live scan — use when the vault may have changed, or before a structural decision
node "${CLAUDE_PLUGIN_ROOT}/scripts/vault-profile.mjs" scan
```

If `config.mjs` prints `NOT_CONFIGURED`, stop and ask the user to run the setup skill.
Never guess a vault name or path.

`config.profile` holds:

| Field | Meaning |
| --- | --- |
| `folders` | The user's own names for notes / daily / templates / attachments / archive. May be partly empty — an empty slot means "this vault has no such place", not "create one". |
| `namingStyle` | `descriptive`, `date-prefixed`, `zettel`, or absent |
| `dailyNoteFormat` | The real date format, e.g. `YYYY-MM-DD` or `YYYY/MM/YYYY-MM-DD` |
| `existingTags` | Tags already in use — reuse before inventing |
| `existingProperties` | Frontmatter keys already in use — match spelling exactly |
| `hasTemplaterPlugin`, `hasTasksPlugin` | Whether richer template/task syntax is safe to emit |

A fresh `scan` adds live truth: top-level `folders`, `noteCount`, `tags`, `properties`,
`templateFolderConfigured`, `dailyNotePath`, and the enabled community plugins.

**Precedence, always:** live scan > `config.profile` > defaults in this document.

---

## 2. Choosing where a new note goes

Do not decide from a folder name. Decide from where similar notes already live.

1. Search for two or three notes of the same kind:
   `obsidian search "<topic or note type>" format=json`
2. Look at the paths that come back. If three retrospectives sit in `Journal/Reviews/`,
   the fourth goes there — even if the profile also lists a `notes` folder.
3. If nothing similar exists, pick the closest existing folder and say why.
4. Only if genuinely nothing fits, propose a new folder — name it, say what will go in
   it, and wait for a yes before creating it.

Never create a folder silently as a side effect of writing a note.

---

## 3. Naming

Detect the style from the neighbours of the note you are about to create (`obsidian files`
on the target folder), then match it. All three of these are correct vaults:

- **Descriptive titles** — `Choosing a mortgage lender.md`, `Why we dropped Redis.md`.
  Write a title that reads as a statement or a subject, capitalised the way its
  neighbours are. Best for vaults where the title is the search key.
- **Date-prefixed** — `2026-09-18 Sprint review.md`, `2026-09-18.md`. Use the vault's
  actual separator and date format; check whether the date is followed by a space, a
  hyphen, or nothing at all.
- **Zettelkasten identifiers** — `202609181432 Compound interest.md` or `3a2b Linking.md`.
  Generate the identifier in the same shape as the existing ones; never mix a timestamp
  ID into a vault using Luhmann-style branching IDs, or vice versa.

Mirror the existing case and separator convention (`Title Case`, `sentence case`,
`kebab-case`) rather than normalising it. If styles are genuinely mixed, follow the most
recent notes — that is where the user's current habit lives.

Use `obsidian unique path=<folder>/<name>` when a collision is plausible, and
`obsidian rename` (never delete-and-recreate) if a title needs to change later.

---

## 4. Frontmatter

For a vault with **no existing properties**, this small core set is a good default:

```yaml
---
type: note          # note | decision | meeting | reading | journal | project | task-list
topic: ""           # the project, course, client, or area of life it belongs to
status: open        # only for things that can be open or closed; omit otherwise
date: 2026-09-18    # ISO; the day it happened, not the day it was typed
tags: []
sensitivity: internal   # public | internal | private — share, report and sync honour this
---
```

Rules that matter more than the set itself:

- **An existing vault's property names always win.** If `profile.existingProperties`
  shows `category` and `created`, use those — do not add parallel `topic` and `date`
  keys. Check exact spelling and case with
  `obsidian properties format=json`.
- **Omit what does not apply.** A journal entry has no `status`. A reading note has no
  project.
- **Do not add heavyweight frontmatter to a vault of plain notes.** If the last twenty
  notes have no frontmatter at all, add none, or at most a single tag line — and say so.
- **Consistency is the whole point.** Property names are what make
  `obsidian property:read`, search filters, and Bases views work months from now. One
  spelling, used everywhere, is worth more than a rich schema used twice.
- Write properties with `obsidian property:set` rather than hand-editing YAML in an
  append, so you do not corrupt an existing block.

---

## 5. Organising systems the user may already have

Identify the system from the folder listing before proposing anything. Work with it.

**PARA** (`Projects/`, `Areas/`, `Resources/`, `Archive/`). Actionable and
time-bound notes go in `Projects/<project name>/`; ongoing responsibilities — health,
finances, a team you run — go in `Areas/`; reference material goes in `Resources/`.
*Adapting means:* ask which bucket a note belongs to when it is ambiguous, move finished
project folders to `Archive/` with `obsidian move` rather than deleting, and never invent
a fifth top-level bucket.

**Zettelkasten** (flat or near-flat, ID-named notes, dense linking). The value is in the
links, not the location. *Adapting means:* one idea per note, an ID in the vault's exact
format, and at least one link to an existing note plus a line saying how it relates —
a Zettelkasten note with no inbound path is worse than no note. Do not introduce topic
folders into a deliberately flat Zettelkasten.

**Johnny Decimal** (`10-19 Finance/11 Tax/11.03 ...`). Numbers are the address and are
not negotiable. *Adapting means:* place the note inside an existing category, take the
next free ID in that category, and never create a new area or category number yourself —
that is a decision the owner makes.

**Flat vault with tags** (everything in root or one folder, organised by `#tag`). *Adapting
means:* put the note where the others are, and spend the effort on tags instead —
reuse an existing tag from `profile.existingTags` rather than coining a near-duplicate.
Do not "clean this up" into folders.

**Folder-per-project** (`Client A/`, `Client B/`, `House/`). *Adapting means:* find the
project folder first, mirror its internal shape (if `Client A/` has `meetings/` and
`decisions/`, so should the note's placement in `Client B/`), and ask before starting a
new top-level project folder.

**No system at all.** Some vaults are a pile, and that is fine. Put the note somewhere
sensible, mention once where you put it, and offer — do not perform — a light structure.

---

## 6. Linking

- Prefer wikilinks: `[[Note title]]`, or `[[Note title|display text]]`. Match the vault's
  existing style if it uses markdown links or path-qualified links instead.
- **Every new note links to at least one existing note.** Check for a home with
  `obsidian search`, and add the link with a short clause explaining the relationship —
  "follows from", "decided against", "supersedes". A link with context survives; a bare
  link does not.
- Verify afterwards: `obsidian unresolved` and `obsidian orphans`. If the new note shows
  up in `orphans`, link it before finishing.
- Use `obsidian move` and `obsidian rename` for relocations and retitles — Obsidian
  updates inbound links automatically. Manual delete-and-recreate silently breaks every
  backlink.
- Before restructuring anything, look at `obsidian backlinks path=<file>` to see who
  depends on it.

---

## 7. Tags vs folders vs properties

This is where vaults get messy. Rough division of labour:

- **Folders — where a thing lives.** One home per note, chosen once. Good for the stable
  spine: project, area of life, note type.
- **Tags — cross-cutting states and themes.** A note can carry several. Good for
  `#needs-review`, `#reading`, `#idea`, a topic that spans projects. Keep the vocabulary
  small; reuse from `profile.existingTags` before coining anything, and prefer an
  existing near-match over a new synonym (`#health` over a new `#wellbeing`).
- **Properties — structured, queryable facts.** Dates, status, people, ratings, links to
  a parent. These are what Bases views and property queries read. Use a property whenever
  you would otherwise encode data into a tag name (`status: done`, not `#status-done`).

Rule of thumb: if you would ever want to sort or filter by it, it is a property. If you
would want to browse a list of everything like it, it is a tag. If it answers "where does
this belong", it is a folder.

---

## 8. Daily notes

Discover, never assume:

```bash
obsidian daily:path        # the real path and format for today
obsidian daily:read        # today's content
```

`daily:path` is authoritative — it reflects the user's Daily Notes or Periodic Notes
settings, including nested `YYYY/MM/` layouts. Cross-check `profile.dailyNoteFormat`, and
if they disagree, trust the CLI and mention the drift.

Treat the daily note as the **default landing place for anything fleeting and
time-bound**: a captured thought, a standup answer, a "call the plumber back", a line
about how the day went. Append with `obsidian daily:append` (or `daily:prepend` when the
vault's daily notes are reverse-chronological) rather than rewriting the file.

Promote out of the daily note when content grows a life of its own — a recurring topic,
a decision, a real project — and leave a wikilink behind pointing to the new note.

If daily notes are not enabled at all, do not enable them; use the capture location from
the profile and say what you did.

---

## 9. What never to do

- **Do not reorganise someone's vault unasked.** Not folders, not tags, not frontmatter.
  Observations are welcome; unsolicited migrations are not.
- **Do not bulk-rename, bulk-move, or bulk-edit without a dry run.** List every affected
  path, show the before and after, get an explicit yes, then act — and prefer `move`/
  `rename` so links survive.
- **Do not invent a tag when a close one exists.** Check `obsidian tags` first. Synonym
  drift (`#book`, `#books`, `#reading`) is how a vault becomes unsearchable.
- **Do not add heavyweight frontmatter to a vault whose owner clearly writes plain notes.**
  Match the weight of what is already there.
- **Do not delete.** Archive or move instead. If a delete is genuinely wanted, show the
  exact paths and confirm; `obsidian history:list` and `history:restore` exist, but do not
  rely on them as an undo.
- **Do not create folders as a side effect.** Ask first, every time.
- **Do not ignore `sensitivity: private`** (or the vault's equivalent flag) when sharing,
  exporting, or publishing anything.

---

Related: `${CLAUDE_PLUGIN_ROOT}/references/obsidian-cli.md` for the full command catalog,
`${CLAUDE_PLUGIN_ROOT}/references/use-cases.md` for per-persona recipes, and
`${CLAUDE_PLUGIN_ROOT}/references/session-context.md` for gathering context before writing.
