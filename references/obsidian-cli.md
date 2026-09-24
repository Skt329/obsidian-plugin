# Obsidian CLI Reference

The complete command catalog and usage patterns for the official Obsidian CLI, as verified against
Obsidian **1.13.7** (installer 1.13.4). Every skill in this plugin points here instead of restating
the CLI. Read the section you need; this file is meant to be skimmed, not read end to end.

---

## 1. What this tool actually is

The `obsidian` command is a **remote control for a running Obsidian application**. It is not a
headless markdown processor and it does not read the vault off disk by itself.

| Reality | Consequence for you |
|---|---|
| It talks to the live app over a local channel | If Obsidian is not running, commands fail or hang. Check liveness first. |
| The app is single-threaded UI software | A call can **block for minutes** while the app is starting up, re-indexing, or running its update check. Never assume a call returns promptly. |
| A user can have several vaults open at once | "The active vault" is never safe to assume. Every call must carry `vault=<name>`. |
| Many commands default to *the active file* | The active file is whatever the human happens to be looking at. Never rely on it for writes — always pass `file=` or `path=`. |
| Writes go through the app, not the filesystem | Edits appear instantly in the user's open editor. Treat every write as visible to a human in real time. |

### Always call it through the bundled wrapper

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/obsidian-cli.mjs" <command> [key=value ...]
```

The wrapper does three things that matter:

1. **Injects `vault=<name>`** from the user's config, so the right vault is always targeted.
2. **Enforces a 20 second timeout**, so a busy app cannot stall the session indefinitely.
3. **Spawns without a shell** — arguments are passed as literal strings, so note content containing
   quotes, backticks, `$`, or newlines can never be reinterpreted as shell syntax.

Do not call the bare `obsidian` binary from a skill. If the wrapper exits non-zero, report the real
`stderr` to the user rather than retrying blindly; a timeout usually means the app is busy, and the
right move is to say so and let the user bring Obsidian to the foreground.

### Before doing anything

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/config.mjs" summary     # NOT_CONFIGURED -> run the setup skill, stop
node "${CLAUDE_PLUGIN_ROOT}/scripts/obsidian-probe.mjs"     # is the app alive and reachable?
node "${CLAUDE_PLUGIN_ROOT}/scripts/vault-profile.mjs" scan # what does this vault actually look like?
```

---

## 2. Argument grammar

Arguments are **space-separated `key=value` pairs**. There are no dashes, no `--flags`, and order
does not matter. Boolean options are bare words with no value (`total`, `verbose`, `done`, `open`).

```
obsidian <command> key=value key2="value with spaces" booleanflag vault=MyVault
```

| Rule | Detail |
|---|---|
| `file=` vs `path=` | `file=` resolves **by name, like a wikilink** (`file=Meeting Notes` finds it anywhere). `path=` is the **exact vault-relative path** (`path=Work/Meetings/2026-09-18.md`). Prefer `path=` whenever you already know it — `file=` is ambiguous when two notes share a name. |
| Quoting | Quote any value containing spaces: `name="Q3 Planning"`. The wrapper passes values literally, so no shell escaping is needed beyond normal quoting. |
| Escapes in content | `\n` becomes a newline and `\t` a tab inside `content=` values. This is how you write multi-line markdown in one call. |
| Active-file default | Most read commands fall back to the active file when `file=`/`path=` is omitted. Convenient interactively, unreliable in a skill. |
| Extensions | Markdown paths normally include `.md`. `file=` usually works without it. |
| `total` | Almost every listing command accepts `total` to return just a count — far cheaper than listing and counting yourself. |
| `format=` | Many listing commands accept `format=json` (some also `tsv`, `csv`, `md`, `yaml`). Use JSON whenever the output will be parsed. |

Multi-line content example:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/obsidian-cli.mjs" append \
  path="Journal/2026-09-18.md" \
  content="## Evening\n\n- Finished the loan paperwork\n- Booked the dentist"
```

---

## 3. Command catalog

### Files and folders

| Command | What it does | Most useful options |
|---|---|---|
| `create` | Create a new file | `name=` or `path=`, `content=`, `template=`, `overwrite`, `open`, `newtab` |
| `unique` | Create a uniquely-named note (Unique Note core plugin) | `name=`, `content=`, `open`, `paneType=tab\|split\|window` |
| `append` | Append content to a file | `content=` (required), `file=`/`path=`, `inline` (no leading newline) |
| `prepend` | Prepend content to a file | `content=` (required), `file=`/`path=`, `inline` |
| `move` | Move or rename a file | `to=` (required) — destination folder or full path |
| `rename` | Rename in place | `name=` (required) |
| `delete` | Delete a file | `permanent` — **skips the trash, unrecoverable** |
| `open` | Open a file in the app | `newtab` |
| `files` | List files | `folder=`, `ext=`, `total` |
| `folders` | List folders | `folder=` (parent), `total` |
| `folder` | Folder info | `path=` (required), `info=files\|folders\|size` |
| `file` | File info (size, dates) | `file=`/`path=` |

There is no `mkdir`. Folders come into existence when you `create` a file at a path inside them.

### Reading and searching

| Command | What it does | Most useful options |
|---|---|---|
| `read` | Read a file's full contents | `file=`/`path=` |
| `search` | Search the vault for text | `query=` (required), `path=` (limit to folder), `limit=`, `case`, `total`, `format=text\|json` |
| `search:context` | Search returning the matching lines | same as `search` |
| `search:open` | Open the search view in the UI | `query=` |
| `outline` | Headings of a file | `format=tree\|md\|json`, `total` |
| `wordcount` | Word and character count | `words`, `characters` |
| `recents` | Recently opened files | `total` |
| `random` / `random:read` | Open / read a random note | `folder=` |

`search format=json` returns a **plain array of file paths** — verified:
`["CRM2.md","CRM.md"]`. It is a filename-level search; to see *why* a file matched, `read` it or try
`search:context`. Note: in testing, `search:context` returned empty output where `search` returned
hits. Treat it as best-effort and fall back to `search` plus `read` if it comes back blank.

### Metadata and properties

| Command | What it does | Most useful options |
|---|---|---|
| `properties` | List properties in the vault, or for one file | `file=`/`path=`, `name=`, `counts`, `sort=count`, `total`, `format=yaml\|json\|tsv`, `active` |
| `property:read` | Read one property's value from a file | `name=` (required), `file=`/`path=` |
| `property:set` | Set a property | `name=` + `value=` (required), `type=text\|list\|number\|checkbox\|date\|datetime` |
| `property:remove` | Remove a property | `name=` (required) |
| `tags` | List tags | `counts`, `sort=count`, `total`, `file=`/`path=`, `format=json\|tsv\|csv`, `active` |
| `tag` | Info about one tag | `name=` (required), `total`, `verbose` (lists the files) |
| `aliases` | List aliases | `file=`/`path=`, `total`, `verbose`, `active` |

`properties counts format=json` returns objects with `name`, `type`, and `count` — the `type` field
tells you how the vault already models that property, which is what you should match rather than
inventing a new convention. See `${CLAUDE_PLUGIN_ROOT}/references/conventions.md`.

Always prefer `property:set` over hand-editing YAML frontmatter with `prepend`. It respects the
existing frontmatter block and the property's declared type.

### Links and graph

| Command | What it does | Most useful options |
|---|---|---|
| `links` | Outgoing links from a file | `file=`/`path=`, `total` |
| `backlinks` | Incoming links to a file | `counts`, `total`, `format=json\|tsv\|csv` |
| `unresolved` | Links pointing at notes that do not exist | `counts`, `verbose` (source files), `total`, `format=` |
| `orphans` | Notes with no incoming links | `total`, `all` (include non-markdown) |
| `deadends` | Notes with no outgoing links | `total`, `all` |

`unresolved` is the highest-value command in this group: it is the user's own list of ideas they
meant to write up and never did.

### Tasks

| Command | What it does | Most useful options |
|---|---|---|
| `tasks` | List tasks | `todo`, `done`, `status="<char>"`, `file=`/`path=`, `daily`, `active`, `verbose`, `total`, `format=json\|tsv\|csv` |
| `task` | Show or change one task | `ref=<path:line>` (or `path=` + `line=`), `done`, `todo`, `toggle`, `status="<char>"`, `daily` |

`tasks format=json` returns objects shaped like — verified:

```json
{ "status": " ", "text": "- [ ] Confirm the deposit cleared", "file": "Money.md", "line": "13" }
```

> **Hazard: line numbers move.** A `ref=path:line` is only valid against the file as it was when you
> read it. Any edit above that line — yours or the user's, in the CLI or in the open editor —
> invalidates it. **Always re-run `tasks` and re-resolve the ref immediately before mutating a task**,
> and match on the task's `text`, not on a line number you cached earlier in the conversation.

`status="<char>"` covers custom checkbox states used by themes and the Tasks community plugin
(`/` in progress, `-` cancelled, `>` forwarded, `?` question, and so on). Check what the vault
already uses with `tasks format=json` before introducing a new character.

### Daily notes

| Command | What it does | Most useful options |
|---|---|---|
| `daily` | Open today's daily note (creating it if needed) | `paneType=tab\|split\|window` |
| `daily:path` | Print the path of today's daily note | — |
| `daily:read` | Read today's daily note — **creates it if missing**, so never use it as a read-only check | — |
| `daily:append` | Append to today's daily note | `content=` (required), `inline`, `open` |
| `daily:prepend` | Prepend to today's daily note | `content=` (required), `inline`, `open` |

These depend on the **Daily Notes core plugin** and its configured folder and date format. Get the
real values from `vault-profile.mjs scan` (`config.profile.dailyNoteFormat`, `profile.folders.daily`)
rather than assuming `YYYY-MM-DD` at the vault root. If the plugin is disabled, `daily:*` fails —
fall back to `create`/`append` against a path you build yourself, and tell the user why.

`daily:append` is the single most useful command for quick capture: it is one call, it creates the
note if it does not exist, and it never disturbs what the user is currently editing.

### Templates

| Command | What it does | Most useful options |
|---|---|---|
| `templates` | List available templates | `total` |
| `template:read` | Read a template's content | `name=` (required), `resolve` (expand variables), `title=` |
| `template:insert` | Insert a template into the **active file** | `name=` (required) |
| `create ... template=` | Create a new file from a template | `template=<name>` |

> **Hazard: templates may not be configured at all.** Verified real output:
>
> ```
> Error: No template folder configured.
> ```
>
> This is the default state for a fresh vault and is common in vaults that use Templater instead of
> the core Templates plugin. Always run `templates` first and handle this error: offer to set a
> template folder (Settings → Templates), or write the note without a template. Never assume a
> template exists because the plugin expects one.

`template:insert` acts on the **active file** — it has no `file=`/`path=` option. The safe pattern is
`create path=... template=...` (template applied at creation), or `template:read name=... resolve` to
get the text and then `create`/`append` it yourself, which is what the template skill does.

Core-plugin template variables (`{{title}}`, `{{date}}`, `{{time}}`) are expanded by `resolve`.
Templater syntax (`<%  %>`) is **not** — that is expanded by the Templater plugin inside the app, and
a template containing it will come back through `template:read` unexpanded.

### Bases (Obsidian's database views)

| Command | What it does | Most useful options |
|---|---|---|
| `bases` | List all `.base` files in the vault | — |
| `base:views` | List the views in a base file | — |
| `base:query` | Run a view and return its rows | `file=`/`path=`, `view=`, `format=json\|csv\|tsv\|md\|paths` |
| `base:create` | Create a new item (note) in a base | `file=`/`path=`, `view=`, `name=`, `content=`, `open`, `newtab` |

Bases are the user's own structured queries over their frontmatter. `base:query format=md` gives you
a ready-made markdown table to paste into a report; `format=json` gives you rows to compute over;
`format=paths` gives you a working set of notes to iterate.

If `bases` prints `No base files found in vault`, the user has not made any — do not invent one
without asking.

### Bookmarks

| Command | What it does | Most useful options |
|---|---|---|
| `bookmarks` | List bookmarks | `total`, `verbose` (types), `format=json\|tsv\|csv` |
| `bookmark` | Add a bookmark | `file=`, `subpath=` (heading or block), `folder=`, `search=`, `url=`, `title=` |

Bookmarks are a good place to read the user's own priorities from, and a good place to pin a note you
just created that they will want to come back to.

### Workspaces and tabs

| Command | What it does | Most useful options |
|---|---|---|
| `tabs` | List open tabs | `ids` |
| `tab:open` | Open a new tab | `file=`, `group=`, `view=` |
| `workspace` | Show the current workspace tree | `ids` |
| `workspaces` | List saved workspaces | `total` |
| `workspace:save` | Save the current layout | `name=` |
| `workspace:load` | Load a saved layout | `name=` (required) |
| `workspace:delete` | Delete a saved layout | `name=` (required) |

`tabs` and `recents` are a cheap read of what the user is *currently* working on — useful for
inferring context without asking.

### History and recovery

| Command | What it does | Most useful options |
|---|---|---|
| `history` | List stored versions of a file | `file=`/`path=` |
| `history:list` | List every file that has history | — |
| `history:read` | Read one stored version | `version=<n>` (default 1) |
| `history:restore` | Restore a stored version | `version=<n>` (required) |
| `history:open` | Open the recovery UI | `file=`/`path=` |

This is the **File Recovery core plugin** (local snapshots), independent of Obsidian Sync and of git.
It is your undo for a bad edit: read the version first, show the user the difference, then restore.

### Sync and versions (Obsidian Sync — not git)

| Command | What it does | Most useful options |
|---|---|---|
| `sync:status` | Show sync status | — |
| `sync` | Pause or resume sync | `on` / `off` |
| `sync:history` | Version history for a file from Sync | `total` |
| `sync:read` | Read a synced version | `version=` (required) |
| `sync:restore` | Restore a synced version | `version=` (required) |
| `sync:deleted` | List files deleted through Sync | `total` |
| `sync:open` | Open the sync history UI | `file=`/`path=` |
| `diff` | List or diff local/sync versions of a file | `from=`, `to=`, `filter=local\|sync` |

These only work for users on Obsidian Sync. If the user's `config.syncMode` is `git`,
`cloud-folder`, or `none`, these commands are irrelevant — use `scripts/git-helpers.mjs` or say
nothing about sync.

### Publish

| Command | What it does | Most useful options |
|---|---|---|
| `publish:site` | Show publish site info | — |
| `publish:status` | List pending publish changes | `new`, `changed`, `deleted`, `total` |
| `publish:list` | List published files | `total` |
| `publish:add` | Publish a file, or `changed` for all changed | `file=`/`path=`, `changed` |
| `publish:remove` | Unpublish a file | `file=`/`path=` |
| `publish:open` | Open the file on the live site | `file=`/`path=` |

**`publish:add` puts private notes on the public internet.** Always run `publish:status` first, show
the user the exact list of files, and get an explicit yes before publishing anything.

### Plugins, themes, snippets, hotkeys

| Command | What it does | Most useful options |
|---|---|---|
| `plugins` | List installed plugins | `filter=core\|community`, `versions`, `format=json\|tsv\|csv` |
| `plugins:enabled` | List only enabled plugins | same |
| `plugin` | Info about one plugin | `id=` (required) |
| `plugin:enable` / `plugin:disable` | Toggle a plugin | `id=` (required), `filter=core\|community` |
| `plugin:install` / `plugin:uninstall` | Install or remove a community plugin | `id=` (required), `enable` |
| `plugin:reload` | Reload a plugin (developers) | `id=` (required) |
| `plugins:restrict` | Toggle or check restricted mode | `on` / `off` |
| `themes` / `theme` | List themes / show the active theme | `versions`, `name=` |
| `theme:set` / `theme:install` / `theme:uninstall` | Change themes | `name=` (required), `enable` |
| `snippets` / `snippets:enabled` | List CSS snippets | — |
| `snippet:enable` / `snippet:disable` | Toggle a snippet | `name=` (required) |
| `hotkeys` / `hotkey` | List hotkeys / look one up | `all`, `verbose`, `format=`, `id=` |

`plugins:enabled format=json` is how you discover what the vault can actually do — Templater, Tasks,
Dataview, Excalidraw, Kanban, Periodic Notes. Adapt to what is installed; never install a plugin
without asking, and never touch `plugins:restrict`, which is a security setting.

### Vault info and app control

| Command | What it does | Most useful options |
|---|---|---|
| `vault` | Info about the current vault | `info=name\|path\|files\|folders\|size` |
| `vaults` | List known vaults | `total`, `verbose` (paths) |
| `version` | Obsidian version | — |
| `commands` | List every registered Obsidian command | `filter=<prefix>` |
| `command` | Run a registered Obsidian command | `id=` (required) |
| `web` | Open a URL in Obsidian's web viewer | `url=` (required), `newtab` |
| `reload` | Reload the vault | — |
| `restart` | Restart the app | — |
| `help` | Help, optionally for one command | `help <command>` |

Verified `vault` output is a plain key/tab/value table:

```
name	Research
path	/home/you/Notes/Research
files	34
folders	4
size	771233
```

`vaults verbose` is how setup discovers which vaults exist without asking the user to type a path.

### Developer

`dev:cdp`, `dev:console`, `dev:css`, `dev:debug`, `dev:dom`, `dev:errors`, `dev:mobile`,
`dev:screenshot`, `devtools`, `eval`.

These exist for people building Obsidian plugins. Skills in this plugin should not reach for them.
The one occasionally justified use is `dev:screenshot path=<file>` to capture the app's current
state for a visual report — and even then, ask first, because it captures whatever is on screen.

---

## 4. Recipes

Real multi-command patterns. Each assumes the wrapper; `OBS` below stands for
`node "${CLAUDE_PLUGIN_ROOT}/scripts/obsidian-cli.mjs"`.

### 1. Learn the vault before writing anything

```bash
OBS vault                      # name, path, note count, size
OBS folders                    # the user's real structure
OBS tags counts sort=count     # the vocabulary already in use
OBS properties counts format=json
OBS plugins:enabled format=json
```

Do this once per session before proposing any folder or frontmatter. Everything you write should
look like it belongs beside what is already there. (`vault-profile.mjs scan` bundles this into one
JSON call — prefer it.)

### 2. Audit which tags exist before inventing a new one

```bash
OBS tags counts sort=count
OBS tag name=project verbose     # which notes actually carry it
```

If the user already uses `#work/active`, do not create `#in-progress`. If a tag has a count of 1 it
was probably a one-off, not a convention.

### 3. Find every note missing a property, and fix them

```bash
OBS files folder="Projects" | while read -r f; do
  OBS property:read name=status path="$f" >/dev/null 2>&1 || echo "MISSING: $f"
done
```

Then, per file, after showing the user the list and getting agreement:

```bash
OBS property:set name=status value=active type=text path="Projects/Roof repair.md"
```

Never bulk-set properties without printing the full list of affected files first.

### 4. Turn unresolved links into real notes

```bash
OBS unresolved counts verbose format=json
```

Every unresolved link is a note the user meant to write. Show the top few by count, and for one they
choose:

```bash
OBS create path="Notes/Compound interest.md" content="# Compound interest\n\n"
OBS backlinks file="Compound interest"   # who was pointing here — context for what to write
```

### 5. Find orphans and connect them

```bash
OBS orphans total
OBS orphans
OBS read path="Notes/Stranded idea.md"
OBS append path="Notes/Home.md" content="- [[Stranded idea]] — picked up from the orphan list"
```

Orphans are notes the user wrote and lost. Surfacing three of them in a weekly review is worth more
than creating three new ones.

### 6. Pull a structured table out of a Bases view

```bash
OBS bases
OBS base:views path="Trackers/Reading.base"
OBS base:query path="Trackers/Reading.base" view="Currently reading" format=md
```

`format=md` drops straight into a report or review note. Use `format=json` when you need to compute
(counts, groupings) before writing.

### 7. Every open task across one area of life

```bash
OBS tasks todo path="Work" format=json
OBS tasks todo path="Home" format=json
OBS tasks todo daily            # just today's note
OBS tasks todo total            # how big is the pile, really
```

Group by `file` in the JSON to show the user where their commitments are concentrated.

### 8. Complete a task safely

```bash
OBS tasks todo path="Home/Errands.md" format=json   # re-read NOW
# match the task by its text, take the fresh line number from that same output
OBS task ref="Home/Errands.md:14" done
OBS tasks todo path="Home/Errands.md" format=json   # confirm it moved
```

The re-read before and the verify after are not optional — line numbers shift.

### 9. Recover an earlier version of a note

```bash
OBS history path="Journal/2026-09-18.md"      # what versions exist
OBS history:read path="Journal/2026-09-18.md" version=2
# show the user the old content and what it would replace, then:
OBS history:restore path="Journal/2026-09-18.md" version=2
```

Always read before restoring, and always show the user what they are about to lose.

### 10. Capture into the daily note without disturbing the editor

```bash
OBS daily:path
OBS daily:append content="\n- 14:20 — decided to go with the fixed-rate quote; see [[Mortgage options]]"
```

One call, creates the note if missing, does not steal focus. Add `open` only if the user asked to
see it.

### 11. Create a note from a template, defensively

```bash
OBS templates                                  # may error: "No template folder configured."
OBS template:read name="Meeting" resolve title="Kickoff with the builders"
OBS create path="Meetings/2026-09-18 Kickoff.md" template="Meeting" open
```

If `templates` errors, skip the template entirely and compose the note content yourself — do not stop
the user's task over it. Offer to set up a template folder afterwards.

### 12. Gather context for a weekly review

```bash
OBS recents
OBS tasks done format=json
OBS files folder="Journal"
OBS search query="decided" limit=20 format=json
OBS wordcount path="Journal/2026-09-18.md"
```

Combine with `scripts/session-context.mjs harvest` and `scripts/git-helpers.mjs recent-activity` when
the user has a repo. See `${CLAUDE_PLUGIN_ROOT}/references/session-context.md`.

### 13. Reorganise a folder without surprises

```bash
OBS files folder="Inbox"
OBS backlinks file="Some note"     # who links here — moving will not break wikilinks, but check
OBS move path="Inbox/Some note.md" to="Notes/Reference"
```

Obsidian updates links on move. Still show the user the exact list of moves and get a yes before
running more than one.

### 14. Find where a topic already lives before creating a duplicate

```bash
OBS search query="insurance renewal" format=json
OBS backlinks file="Insurance" counts
OBS outline path="Home/Insurance.md" format=json
```

Appending a section to a note the user already has beats creating a fifth note on the same subject.

---

## 5. Commands that need care

| Command | Why | What to do instead |
|---|---|---|
| `delete` | Goes to the vault's `.trash` by default. **`permanent` is unrecoverable** — File Recovery will not save them. | Never pass `permanent`. For a single delete, name the exact file and get an explicit yes. For bulk, list every file first. |
| `publish:add` | Puts notes on the **public internet**. `changed` publishes everything pending at once. | Run `publish:status` first, show the full list, get explicit confirmation. |
| `restart` / `reload` | Interrupts the user's app mid-work and can lose unsaved editor state. | Almost never needed. Ask first, and say why. |
| `plugin:install` / `plugin:enable` / `plugin:uninstall` | Changes the user's setup and can execute third-party code. | Recommend, do not install. Let the user do it. |
| `plugins:restrict` | This is Obsidian's security boundary for third-party code. | Do not touch it. |
| `theme:set` / `snippet:*` | Changes how the user's app looks. | Only on explicit request. |
| `sync off` | Silently stops the user's notes replicating to their other devices. | Only on explicit request, and remind them to turn it back on. |
| `command id=<id>` | Runs *any* registered Obsidian command, including destructive ones from community plugins. | Last resort, only when no dedicated CLI command exists. Look the id up with `commands filter=` first and tell the user which command you are running. |
| `eval code=<js>` | Executes arbitrary JavaScript inside the user's app with full vault access. | Last resort. **Never build the code string by interpolating note content, search results, file names, or anything else read from the vault** — that is an injection path straight into the user's data. If you cannot write the code as a fixed literal, do not use `eval`. |
| `dev:*`, `devtools` | Developer tooling; `dev:screenshot` captures whatever is on screen. | Avoid. Ask before any screenshot. |

The same rule covers all of them: **anything that leaves the vault, destroys data, or changes the
user's configuration gets shown in full and confirmed before it runs.**

---

## 6. Choosing an output format

`format=json` is available on many listing commands: `tasks`, `tags`, `properties`, `backlinks`,
`unresolved`, `bookmarks`, `plugins`, `plugins:enabled`, `hotkeys`, `search`, `search:context`,
`outline`, `base:query`.

| Situation | Format |
|---|---|
| You will parse, filter, count, or group the output | `format=json` — always |
| You will paste it into a note or a report | `format=md` (bases), `tsv`, or the default text |
| You only need a number | the `total` flag, not a list you count |
| You need a spreadsheet-ready column | `format=csv` or `tsv` |
| `properties` specifically | `format=yaml` is the default and is fine to read; `json` to parse |

Defaults vary by command (`tsv` for most listings, `text` for `search` and `tasks`, `yaml` for
`properties`, `json` for `base:query`, `tree` for `outline`). Be explicit rather than relying on the
default. The wrapper's `runObsidianJson` helper appends `format=json` and parses for you.

---

## 7. When things go wrong

| Symptom | Likely cause | Response |
|---|---|---|
| `Error: …` printed, exit 0 | The CLI reports failures on stdout with a success exit code | The wrapper turns these into exit 1 with the message on stderr — trust the wrapper's exit code. |
| `No … found.` printed | An empty result, even when JSON was requested | The wrapper returns it as an empty result, not text to parse. |
| Call times out at 20s | Obsidian is starting up, updating, or re-indexing | Tell the user to bring Obsidian to the foreground and wait; retry once. Do not loop. |
| Empty output, exit 0 | The command genuinely found nothing, or the feature is not configured | Distinguish with a `total` call or by checking the relevant plugin is enabled. |
| `Error: No template folder configured.` | Core Templates plugin has no folder set | Continue without a template; offer to help set one up. |
| `daily:*` fails | Daily Notes core plugin disabled | Build the path yourself from `config.profile`, or ask the user to enable it. |
| Wrong vault touched | `vault=` was missing, or named a vault that does not exist — an unknown name silently falls back to the active vault | Always go through the wrapper: it injects `vault=` and verifies the vault path before the first write, refusing on a mismatch. |
| `daily:*` refused by the wrapper | The vault is not recorded as using daily notes (`profile.dailyNotes`) | Use the vault's own dated log instead, or set `dailyNotes: "used"` via vault-setup if it really keeps daily notes. |
| `file=` hit the wrong note | Two notes share a name | Re-run with `path=` and the exact path from `files`. |
| Task update hit the wrong line | Cached line number went stale | Re-run `tasks format=json` and re-resolve before every mutation. |

---

## See also

- `${CLAUDE_PLUGIN_ROOT}/references/conventions.md` — adapting to a vault's existing folders and frontmatter
- `${CLAUDE_PLUGIN_ROOT}/references/session-context.md` — harvesting context from the live session, the repo, and connected tools
- `${CLAUDE_PLUGIN_ROOT}/references/use-cases.md` — per-persona recipes
- `${CLAUDE_PLUGIN_ROOT}/references/templates/` — starter template library
