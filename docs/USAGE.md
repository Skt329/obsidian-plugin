# Obsidian Vault Copilot — Complete Guide

How to set this up, what every skill does, and how to get real value out of it day to day.

If you only read one thing, read **[Your first fifteen minutes](#your-first-fifteen-minutes)**.
If you are not sure how this fits your situation, ask in the session: *"how do I use this
as a researcher?"* — the `vault-guide` skill answers that directly and can write the
answer into your vault.

---

## Contents

- [What this plugin actually does](#what-this-plugin-actually-does)
- [Before you start](#before-you-start)
- [Installing](#installing)
- [Your first fifteen minutes](#your-first-fifteen-minutes)
- [How setup works, in detail](#how-setup-works-in-detail)
- [Skill reference](#skill-reference)
- [vault-guide](#vault-guide)
- [vault-setup](#vault-setup)
- [vault-ops](#vault-ops)
- [vault-capture](#vault-capture)
- [vault-template](#vault-template)
- [vault-doc](#vault-doc)
- [vault-decision](#vault-decision)
- [vault-task](#vault-task)
- [vault-standup](#vault-standup)
- [vault-report](#vault-report)
- [vault-review](#vault-review)
- [vault-diagram](#vault-diagram)
- [vault-sync](#vault-sync)
- [vault-share](#vault-share)
- [What runs automatically](#what-runs-automatically)
- [How it knows what you did](#how-it-knows-what-you-did)
- [Daily, weekly and monthly rhythms](#daily-weekly-and-monthly-rhythms)
- [Power patterns](#power-patterns)
- [Working with an existing vault](#working-with-an-existing-vault)
- [Quickstarts by role](#quickstarts-by-role)
- [Configuration reference](#configuration-reference)
- [Troubleshooting](#troubleshooting)
- [Privacy and safety](#privacy-and-safety)
- [Frequently asked questions](#frequently-asked-questions)

---

## What this plugin actually does

Three ideas, and everything else in this guide follows from them.

**You talk in plain language.** There is no syntax to learn and no command set to
memorise. You say "capture this: the vendor call moved to Thursday and they want pricing
first" or "add a to-do to renew the car insurance before the 30th", and the right skill
picks it up. You can also call a skill by name — `/vault-capture`, `/vault-review` — when
you already know which one you want.

**It reads and writes your real vault through Obsidian's own command line interface.**
Not a copy, not an export, not a separate database. The same notes you have open in
Obsidian right now. Writes go through the running app, so a note appears in your editor
the moment it is written — if you have the file open, you will see it change. That is
also why Obsidian has to be running: the CLI is a remote control for the app, not a
headless tool that reads files off disk.

**It grounds what it writes in what actually happened.** This is the part that makes the
output worth keeping. Before writing a document, a decision record, a standup or a
report, it pulls from the live session (what you have been doing and why), the repository
or working folder if there is one, project instruction files, any connected tools you
have attached to the session, and your existing notes. Then it writes a note that
reflects real events. If the context is thin, it says what it could not find and asks
rather than inventing filler.

### How this differs from a template or snippet plugin

A template plugin gives you an empty structure and you fill it in. That is a formatting
problem, and formatting was never the hard part.

The hard part is the gap between something happening and it being written down. You
finish a two-hour debugging session, or a call with a contractor about the roof, and the
useful record of it exists only in your head for about twenty minutes. This plugin closes
that gap: it takes what it already knows, writes it up properly, files it where your
similar notes live, names it the way you name things, tags it with tags you already use,
and links it to the note it belongs beside.

So the value here is not another way to organise. It is getting things *into* the vault,
correctly filed. Your organising system stays exactly as it is.

### What it does not do

It does not reorganise your vault, rename your files, or impose a folder taxonomy. It
does not send anything anywhere — a standup or report is text handed back to you, and
there is no messaging integration wired up. It does not push, publish or export without
showing you exactly what will happen and waiting for a yes. And it does not require you
to write code, use git, or have a manager.

---

## Before you start

Four things. Only the first two are required.

| What | Why |
|---|---|
| **Obsidian 1.12.7 or later** with the command line interface enabled | This is how everything reaches your vault. Without it, nothing works. |
| **Obsidian running**, with your vault open | The CLI drives the live app. A closed app means commands fail or hang. |
| **Node.js** (any recent version) | The plugin's bundled helper scripts — the CLI wrapper, the vault scanner, the context harvester — are small Node scripts. |
| **`git`, and a code-host CLI like `gh`** | Optional. Only needed if you want git-based backup or want to open a pull request to a shared repo. Obsidian Sync, a cloud folder, or no sync at all are all fine. |

### Turning the CLI on

In Obsidian, open **Settings → General → Command line interface** and enable it.

Then open a *new* terminal window — if you had one open already, it will not have picked
up the change — and check that it works:

```
obsidian version
obsidian vaults
```

`obsidian version` should print your Obsidian version. `obsidian vaults` should list the
vaults Obsidian knows about, by name. If you see your vault in that list, you are ready.

If `obsidian` is not found, the setting is not on yet, or your terminal was opened before
you turned it on. If the command just sits there doing nothing, Obsidian is probably
starting up or running its update check — see the note below.

### One thing worth knowing up front

The Obsidian CLI can block for a long time while the app is starting, re-indexing, or
checking for updates. Sometimes minutes. The plugin's bundled wrapper cuts every call off
at 20 seconds, so a skill will tell you the app looks busy rather than hanging your
session forever. If that happens, bring Obsidian to the foreground, let it settle, and
try again. It is not broken.

### If you keep more than one vault

That is normal and fine. Setup records which vault you chose, and every call the plugin
makes names that vault explicitly. It never works on "whichever vault happens to be
active", so having three vaults open cannot cause a note to land in the wrong one.

---

## Installing

```
/plugin marketplace add <this-repo>
/plugin install obsidian-vault-copilot
/vault-setup
```

The important thing about install: **everyone installs the same plugin, and each person
runs setup against their own vault.**

No vault name, path, folder, tag, person or company is baked into the plugin. Your
answers from setup are written to `~/.claude/obsidian-vault-copilot/config.json`, which
lives outside the plugin directory entirely. That means nothing personal can be committed
along with the plugin's source, and nothing personal travels with it when you share it
with a colleague, a friend, or your team.

If someone hands you this plugin, you run `/vault-setup` once and it becomes yours.
There is no shared vault, no central server, and no configuration to inherit.

---

## Your first fifteen minutes

Do these five things in order. Each one is small, and by the end you will have a real
note, a real task, and a real daily update in your own vault.

**Before you start:** open Obsidian, with the vault you want to use.

### 1. Run setup

Type:

```
/vault-setup
```

It starts by listing the vaults Obsidian actually knows about and asking which one you
want — or whether you want to point at a folder of notes Obsidian has not opened yet, or
create something new. It will not pick for you and it will not touch a vault you did not
choose.

### 2. Let it scan, and read what it found

Once you pick an existing vault, setup scans it and shows you what is really there: your
top-level folders, roughly how many notes you have, the tags already in use, the
frontmatter properties already in use, whether a template folder and daily-note folder
are configured, and which community plugins you have enabled.

Read that list. This is the moment to correct it. Setup will ask where new notes of each
kind should go — daily notes, longer write-ups, captures, templates, archive — and it
defaults every answer to a folder you already have. If you keep daily notes in
`Journal/`, say `Journal/`. Don't let it talk you into `Daily/`, and it won't try.

It will also ask what you use the vault for, who your updates usually go to (answering
"just me" is completely normal), and how you back things up. Then it shows you the exact
JSON it is about to write and waits for a yes.

Nothing in your vault is moved, renamed or reorganised at any point in this step.

### 3. Capture one real thing

Pick something that actually happened today and type it. A work example:

> "capture this: the vendor call moved to Thursday and they want pricing before the
> meeting, not after"

Or a personal one:

> "capture this: the plumber says the boiler is fine but the pressure valve needs
> replacing, quote is coming Friday"

What happens: it works out what kind of thing this is (a meeting note, a reference, a
passing thought), finds where notes like it already live in your vault, writes it there
with light frontmatter using tags and property names you already use, and links it to one
or two obviously related existing notes. Something fleeting goes into today's daily note
instead of becoming a file of its own.

You get back one line telling you exactly where it landed, like:

> Captured to `Meetings/2026-09-19 Vendor call.md`, linked to [[Vendor evaluation]].

If it chose the daily note and you wanted a standalone note, say so — it offers the
other option in the same breath.

### 4. Add one task

> "add a to-do: send the revised pricing sheet before Thursday"

Or:

> "remind me to book the boiler service once the quote comes in"

Tasks here are ordinary Markdown checkboxes in your own notes — `- [ ] send the revised
pricing sheet`. There is no separate task database, and nothing is stored outside your
vault. It puts the task in the project or area note it belongs to, or today's daily note
if it is tied to today.

The first time, it will ask once where you want tasks to go by default, remember the
answer, and stop asking.

Later, try:

> "what's still open?"

It groups what comes back by note or area rather than dumping a flat list. And when you
mark something done, it re-reads the task and finds it again immediately before changing
it — line numbers move as notes get edited, so a remembered line number is never trusted.

### 5. Ask for a standup at the end of the day

> "write my standup"

It assembles three things — what moved, what is next, what is stuck — from the
conversation you have been having, your repository if you have one, any connected tools,
and your vault's tasks and daily notes. It prints the update in chat so you can copy it
straight out, and appends it to today's daily note under a `## Standup` heading.

It never sends it anywhere. Not to chat, not to email, not to a ticket. You send your own
update.

If the day was quiet, it will say the day was quiet rather than padding it out.

---

**Then, when you want a workflow rather than individual commands:**

```
/vault-guide
```

It asks two or three questions about what you actually do all day, what you want the
vault to carry, and who reads what comes out of it — then recommends a small starting
loop of three to five skills with a rhythm attached, not all fourteen. It can write that
plan into your vault as a note so you can come back and change it. Run it again any time
with a topic, like `/vault-guide templates`, to get a narrow answer to one question.

---

## How setup works, in detail

Setup **reads and records**. It never modifies, moves, renames or reorganises anything in
a vault you already have. Worth saying plainly, because most people arrive with a vault
they have built over years and are right to be protective of it.

### Three routes in

Setup begins by running the real vault list from Obsidian and showing you what came back.
Then it asks which of three routes you want. It never picks silently.

| Route | When you want it |
|---|---|
| **a. Use an existing vault** | The common case. Works at any size, and nothing gets reorganised. |
| **b. Point at a folder of markdown notes** | You have notes on disk, but Obsidian has never opened that folder as a vault. |
| **c. Create a brand-new vault** | You are starting fresh. |

Route (b) is handled like route (c) from the "open folder as vault" step onward — your
notes are already there, so no starting structure is proposed on top of them.

### What the profile scan looks at, and why it matters

For routes (a) and (b), setup scans the vault and shows you, in plain language:

- your top-level **folders**, and roughly how many notes you have
- the **tags** already in use
- the **frontmatter properties** already in use, and how each one is typed
- whether a **template folder** is configured, and where your **daily notes** actually go
- which **community plugins** are enabled — Templater, Tasks, and so on

This is not a diagnostic report. It is the contract every other skill follows afterwards.
When you later ask for a capture, a decision record or a weekly review, the skill reads
this profile and writes a note that looks like it belongs beside what is already there:
your folder names, your naming and capitalisation style, your existing tags rather than
near-duplicates, your property spellings rather than parallel ones.

Two specific consequences worth knowing:

- If your last twenty notes have no frontmatter at all, new notes get none either, or at
  most one tag line. It matches the weight of what is already there.
- If nothing suitable exists for a new kind of note, it *proposes* a folder and waits.
  It never creates a folder as a side effect of writing a note.

If your vault genuinely has no system — some vaults are a pile, and that is fine — setup
says so honestly and offers a light default you are free to decline.

Everything it learns is recorded under `profile` in the config: folders, naming style,
daily-note format, existing tags, existing properties, and whether the Templater and
Tasks plugins are enabled.

### The new-vault route needs one manual step

If you are creating a new vault, there is a step the plugin cannot do for you: **the
Obsidian CLI has no create-vault command.** Obsidian has to register the vault itself.

So setup will confirm the exact parent folder and vault name, create the folder, and then
ask you to go into Obsidian and use **File → Open folder as vault** on that exact path.
You confirm when you have done it, and setup verifies by re-reading the vault list and
checking the new name and path are actually there. If they are not — usually because
Obsidian is not running, or a different folder got picked — it stops and re-checks rather
than writing a config for a vault that does not exist.

After that it offers a light starting structure (somewhere for daily notes, longer notes,
templates, an archive) which you can rename entirely or decline.

### What setup asks you

**What you will use it for.** Several answers is normal, and work and personal usually
mix: work projects, personal life and journaling, study, research, writing, client work,
leading a team, household and admin. This is worth a real answer rather than a shrug — it
decides which starter templates get offered and what `/vault-guide` recommends later.

**Who your updates are for.** A manager, a client, a team, a study group, a partner — or
just yourself, which is a perfectly normal answer and the right one if you hesitate. It
sets the tone of reports and standups later. It can also record your timezone if daily or
weekly rhythms matter to you.

### Sync is optional, with four honest choices

Setup presents four options and pushes none of them:

| Option | What setup does |
|---|---|
| **git** | Offers to run `git init` in the vault and write a `.gitignore` covering Obsidian's workspace and plugin-data files. Creating a remote is a separate, explicit confirmation and always defaults to **private** — a personal vault can hold health notes, finances, journal entries and client material. |
| **Obsidian Sync** | Records that you use it. Nothing else happens. |
| **A cloud-synced folder** (Drive, iCloud, Dropbox, OneDrive) | Records it. Nothing else happens. |
| **Nothing** | A legitimate choice. You will not be lobbied. |

### Starter templates, if you want them

Setup can copy the starter templates matching your use cases into your template folder.
Twelve ship with the plugin, covering daily notes, meetings, one-on-ones, decisions,
retrospectives, weekly reviews, project briefs, runbooks, reading notes, people, ideas
and goals. It shows you the filenames before copying, and **skips any name that already
exists** rather than overwriting your version.

If Obsidian replies `Error: No template folder configured.`, that is expected rather than
broken — it means the core Templates plugin has no folder set yet. Setup either walks you
through setting one in **Settings → Templates → Template folder location**, or offers to
create a folder for you to point that setting at. It will not copy templates into a
folder Obsidian would never read from.

### A few optional extras

Setup asks, and skips them entirely if they do not apply to you:

- **Project or work folders** that should feed reports and reviews. Skip this if you have
  none — the plugin does not require code or repositories.
- **A shared repo** you contribute notes to, if you use one.
- Whether generated reports should also be **saved into the vault**, or just handed back
  to you in chat.

### Writing the config

Setup shows you the exact JSON before writing it, and waits for a yes. It lands at
`~/.claude/obsidian-vault-copilot/config.json` — outside the plugin, so it can never be
committed with the plugin's source. Then it runs a quick reachability check against your
vault and points you at `/vault-guide`.

If any step fails, setup stops and tells you, rather than leaving a half-written config.

### Changing one thing later

You do not have to redo the whole interview to change one answer.

```
/vault-setup
```

With a config already in place, this summarises what is currently set — vault, use cases,
audience, sync mode — and asks what you want to change. Change one field and it reads the
existing config, replaces just that key, and writes the merged result back. The rest is
left alone.

```
/vault-setup reconfigure
```

This runs the full flow again. Use it when you are switching to a different vault
entirely, or when enough has changed that starting over is simpler than editing.

## Skill reference

There are fourteen skills. You almost never need to remember their names — say what you want in ordinary words and the right one triggers. "capture this: …" reaches vault-capture. "what's still open?" reaches vault-task. "record why we chose this" reaches vault-decision.

When you do want to be explicit, invoke one by name with a leading slash, optionally with an argument: `/vault-guide templates`, `/vault-setup reconfigure`, `/vault-review monthly`.

Skills also hand off to each other rather than improvising. If you ask vault-ops for something that really wants a template, it hands you to vault-template. If a capture turns out to be a decision, it says so. If nothing is configured yet, whichever skill you reached stops and points you at vault-setup instead of guessing at a vault.

The first seven skills are covered below; the rest continue in the next section.

---

## vault-guide

**What it's for**

The front door, and the one to run when you are not sure what to run. It works out what you actually spend your days on, then recommends a small starting loop — three to five skills, never all fourteen — with a rhythm attached. It is not a manual recital; it is orientation for one specific person.

**Reach for it when**

- "I just installed this. What do I do with it?"
- "How would this work for someone who doesn't write code?"
- "Which of these should I use for my house renovation?"
- "Can it handle reading notes?"
- You want a written plan for how you use your own vault.

**Try saying**

> "how would I use this as a PhD student?"

It asks two or three short questions, reads the per-persona recipe for research and study, and comes back with a loop like: a source-note template, capture as you read, vault-ops to search and connect, vault-review to consolidate. Nothing is written to the vault unless you say yes.

> "I'm a freelancer with four clients — what should my weekly rhythm look like?"

Same shape, different recipe: a client-note template, tasks per client, a report per client, vault-share to send it. It names the one skill to start with today and what it will feel like after two weeks.

> "/vault-guide templates"

Passing a topic skips the interview entirely and answers just that.

> "write that plan into my vault so I don't lose it"

It offers this once, and only once. If you accept, it writes a **How I use my vault** note containing your situation in a line, the chosen loop and its rhythm, the trigger phrase for each skill, and a "not using yet" list of the rest. It asks where to put it rather than inventing a folder.

**Good to know**

If a vault is already configured, vault-guide scans the real thing first and grounds every suggestion in your actual folder names, your tags and your daily-note format. It will suggest at most one new folder, and only if nothing you already have fits.

If no vault is configured, it still runs in full. It deliberately does not send you to setup first — the reasoning being that nobody should configure a thing before they know what it is. It points at vault-setup at the end.

It also carries a troubleshooting list: Obsidian not running, a hanging command, the "No template folder configured" message, several vaults open at once, a task that refuses to toggle. It is re-runnable — come back with "which skill should I use for X" any time.

---

## vault-setup

**What it's for**

Attaching the plugin to a vault and recording how that vault is already organized. This is the walkthrough covered in detail earlier in this guide, so the short version here is just the shape of it and how to change your answers later.

Setup **reads and records**. It does not modify, move, rename or reorganize anything already in your vault — worth knowing if you arrived with years of notes you are protective of.

**Reach for it when**

- "Connect my vault."
- "I want to change who my reports are addressed to."
- "I've started using a different vault."
- Any skill told you `NOT_CONFIGURED`.

**Try saying**

> "set up my vault"

It lists the vaults Obsidian already knows about, asks which route you want (use an existing vault, point at a folder of markdown Obsidian has never opened, or create a new one), scans and confirms your conventions, and asks what you use notes for, who your updates go to, and how you back things up.

> "/vault-setup reconfigure"

Reconfigure changes **one field** — it reads the existing config, replaces just that key and writes the merged result back. It does not replay the whole interview.

> "I want my reports saved into the vault as well as shown in chat"

A single-field change like this is exactly the reconfigure case.

**Good to know**

Everything lands in `~/.claude/obsidian-vault-copilot/config.json`, outside the plugin, so nothing personal ever ships with or gets committed alongside the plugin's source. You see the exact JSON and approve it before it is written.

Two hard rules: it never writes a vault name or path you did not give it in that run, and if any step fails it stops and reports rather than leaving a half-written config.

There is no create-vault command in the Obsidian CLI. For a brand-new vault, setup makes the folder and then asks you to do **File → Open folder as vault** in Obsidian yourself, and verifies it afterwards.

---

## vault-ops

**What it's for**

The general-purpose worker, and the fallback for anything none of the named skills own. Reading, searching, browsing, creating, editing, moving, renaming, recovering. It is also the shared conventions anchor that the other skills defer to, which is why its habits — find where similar notes already live before creating anything — show up everywhere else.

**Reach for it when**

- "Where did I write about that?"
- "What tags am I actually using?"
- "Tidy these three notes into the right folder."
- "I think I wrecked that note — can you get the old version back?"
- Anything that is clearly a vault job but not a capture, a doc, a decision, a task, a standup, a report, a review, a diagram, a sync or a share.

**Try saying**

> "find everything I've written about the mortgage"

Searches the vault and comes back with the matching notes, grouped so you can see which folder they live in.

> "where did I write about the rate limiting problem?"

This is the "I know I wrote it down somewhere" case. It uses the context search that returns the surrounding lines, so you get the sentence, not just the filename. Honest caveat: that context search is best-effort and occasionally returns nothing where a plain search returns hits, so the skill falls back to a normal search plus reading the file.

> "what tags am I actually using, and how often?"

Lists your real tags with counts. Useful before you invent a new one — the plugin's whole approach to tagging is reuse over synonym drift, and this is how you check.

> "which of my notes have nothing linking to them?"

Lists orphans. The follow-up is the useful part: for each one it can search for the topic and add a link from the hub note that should have pointed at it. Works the same for an abandoned project note and a half-forgotten recipe. There is a companion for the opposite problem — links pointing at notes that do not exist yet, which is effectively your own list of things you meant to write.

> "move the three vendor notes into Projects/Procurement, and rename the one called 'Untitled 4'"

Moves and renames go through Obsidian's own verbs, which update inbound wikilinks automatically. The plugin never relocates a note by editing paths on disk or rewriting links by hand, because that silently breaks every backlink. Anything touching more than a couple of notes gets a dry run first: every affected path and the exact change, listed, then it waits for your yes. No partial starts.

> "I think I overwrote yesterday's journal entry — can you get it back?"

It lists the stored versions of that note, reads the promising one, shows it to you, and restores only after you confirm which version. This reads Obsidian's File Recovery core plugin — local snapshots, independent of Obsidian Sync and of git.

**Good to know**

Every Obsidian call goes through a bundled wrapper that injects your configured vault name explicitly and enforces a 20 second timeout. That matters for two reasons: if you have several vaults open, the "active" one is never assumed, and if Obsidian is busy starting up or checking for updates, you get told the app looks busy instead of watching the call hang for minutes.

What it will not do: delete casually. Deletes are shown and confirmed one at a time, and if your profile records an archive folder it will offer to move there instead. It also won't reorganize your vault on its own initiative — observations are offered, migrations are not.

There is a lot more in the command catalog than the common cases above: heading outlines of long notes, backlinks, aliases, frontmatter properties, Obsidian Bases views (querying a database view directly, like a reading list by status or applications by stage), bookmarks, workspaces. Ask for what you want in plain language; if it exists, vault-ops will find it.

---

## vault-capture

**What it's for**

Getting something into the vault fast, correctly filed, without an interview. Capture is the highest-frequency thing anyone does with a vault, so this skill is tuned for speed: one or two questions at most, then it writes and tells you where it went in a single line.

**Reach for it when**

- "Save this before I forget."
- "Note this down."
- "Log that."
- Something in this conversation is worth keeping and you do not want to retype it.

**Try saying**

> "capture this: the vendor call moved to Thursday and they want pricing first"

Short and time-bound, so it goes into today's daily note as a line — and it tells you so, and offers the alternative in the same breath: "Appended to today's note — want it as its own note under Meetings/ instead?"

> "save that decision we just worked through"

This is the point of the skill. It takes the content from what is already in the conversation rather than making you restate it. If the work is happening right now in a project folder, it can also pull the surrounding facts — recent prompts, files touched, repository state — so the note says what actually happened.

> "log this: finished chapter 4 of Thinking Fast and Slow, the anchoring bit is the useful one"

Recognised as a reading note, which is something with a life of its own, so it gets its own note with light frontmatter (title, author, date) rather than a line in the daily note.

> "note down mum's new address, she's moved to the flat on Carlisle Road"

A reference capture. Same machinery, no work context required — the plugin does not assume you are documenting a job.

> "jot this down — idea for a weekend project: a shared grocery list that reads the fridge whiteboard"

An idea. Fleeting ideas land in the daily note; ideas you will clearly develop get their own note.

**Good to know**

It infers a type from what you said — idea, meeting or call, link or article, book or reading note, person, journal entry, task, quote, reference — and if nothing fits, it writes a plain note and tells you which it picked rather than stalling on classification.

The daily-note-versus-own-note call is the one judgement it makes for you, and it always states the choice in one clause and offers the other. Fleeting and time-bound goes in the daily note; anything with follow-ups, anything you will keep adding to, anything you will want to link from elsewhere gets its own note.

Destination comes from your real vault, never a fixed map. It looks at where similar notes already live before placing anything, and it will never silently create a new top-level folder in an established vault.

Frontmatter stays light — typically type, date and tags, plus a field that genuinely earns its place (a URL for a link, an author for a book, attendees for a meeting). It checks your existing tags and property names first and reuses a close match, saying so when it introduces something new.

Before finishing, it links the capture to one or two clearly related notes and verifies the link resolved. A capture nobody finds again is wasted, and a broken wikilink is worse than none — it fixes the name rather than leaving one dangling.

A task-shaped capture ("remind me to call the plumber back") goes in as a `- [ ]` line in wherever your vault keeps tasks. If you later want it managed properly, that is vault-task.

If your vault has no template folder configured, capture does not stop and does not ask you to go fix an Obsidian setting mid-thought. It writes a clean minimal note and mentions once, at the end, that vault-template can set templates up.

---

## vault-template

**What it's for**

Reusable structure for anything you write more than once — a meeting note, a reading note, a workout log, a client brief, a job application, a trip plan, a lecture summary. A good template is a thinking scaffold, not a form: three headings that ask real questions beat ten blank fields that rot.

**Reach for it when**

- "I keep writing this same kind of note badly."
- "Make a template for client kickoff calls."
- "What templates do I already have?"
- "Set me up with some sensible starting templates."
- "Use my meeting template for this."

**Try saying**

> "what templates do I have?"

Lists them. If it comes back with **"Error: No template folder configured."**, see below — that is a normal state, not a breakage.

> "install the starter templates"

Copies a subset of the bundled library matching what you told setup you use the vault for. It lists the exact files it proposes to copy, with a one-line description each and where each will land, checks for name collisions first, and waits for an explicit yes. It **never** overwrites an existing template — on a collision it offers to skip, save under a different name, or show you the difference and let you decide.

> "make me a template for client kickoff calls"

Creating from a description. It asks at most three questions — what kind of note this is, what you want to be able to find or compare later, and what you always forget to write down — then drafts, shows you the draft, and saves on approval.

> "turn last week's retro note into a template, I liked how that one came out"

Creating from a note you already like. It keeps your structure and headings and replaces the specifics — names, dates, project names, numbers — with placeholders or a short prompt line saying what belongs there. It shows you the before and after of one section so you can see exactly what got generalised.

> "I write lab entries the same way every time — make that a template"

Creating from a pattern across several notes. It pulls the notes of that kind, looks at which frontmatter fields co-occur, proposes the skeleton you already converge on, and names the parts that are inconsistent so you decide the canonical form.

> "use my meeting template for the budget call note"

Applying one. To a new note there are two routes: insert the template so Obsidian expands `{{date}}` and `{{title}}` itself, or read the template and fill the placeholders with real values from this conversation and write the finished note. It prefers the second when it already knows the content — you get a filled note, not an empty skeleton.

**The starter library**

Twelve templates ship with the plugin. Install all, some, or none.

| Template | What it is |
|---|---|
| `daily-note` | Focus, work, personal, captures, tasks, loose ends, one line about today |
| `decision` | One-sentence decision, context, options table, trade-offs |
| `goal` | What done looks like, how you'll measure it, checkpoints, why this one |
| `idea` | The idea in a sentence, what sparked it, why it might not work, smallest version |
| `meeting-note` | Purpose, decisions, open questions, actions with an owner and a date |
| `one-on-one` | Since last time, their agenda, my agenda — private by default |
| `person` | How you know each other, how they like to work, shared history, open threads |
| `project-brief` | What this is, why it's worth doing, what done looks like, scope in and out |
| `reading-note` | Why you picked it up, the argument in your own words, where you doubt it |
| `retrospective` | What you set out to do, what went well, what was harder — team, pair or solo |
| `runbook` | When to run this, what you need first, numbered steps, verified date |
| `weekly-review` | What happened, decisions, open loops, energy, commitments for next week |

**Good to know**

**"Error: No template folder configured."** is the one message you will probably meet. It means Obsidian's Templates core plugin has no folder set, and templates will not expand variables until it does. Two fixes, both one setting: you set it yourself at **Settings → Templates → Template folder location**, or the skill creates a folder that fits your existing structure and you point that setting at it. The skill will not work around it by writing template files somewhere arbitrary.

On syntax: the core Templates plugin gives you `{{title}}`, `{{date}}`, `{{time}}` and formatted variants like `{{date:YYYY-MM-DD}}`. Richer Templater syntax is only emitted if your profile scan shows Templater is actually installed — otherwise it would sit in your notes as visible junk text. It checks rather than assumes.

Applying a template to an **existing** note never overwrites it. It reads the note, takes its heading outline, adds only the sections that are missing, and sets frontmatter field by field rather than rewriting the file — and shows you exactly which sections go where before writing.

One design note worth acting on: keep headings stable across notes of the same kind and keep frontmatter names consistent. That is what makes two notes comparable, and what makes "show me every note where the outcome was X" possible at all through Obsidian's property queries and Bases views.

---

## vault-doc

**What it's for**

Writing real documentation into the vault from context that already exists, rather than from a blank page. This is where the plugin's context harvesting pays off most: it mines the conversation you are already in, then the repository or working folder, then any connected tools, before it asks you anything.

Documentation here is not only technical. A process you repeat — a monthly reconciliation, a moving checklist, a study routine, how your household handles renewals — is documentation, and belongs in the vault on the same terms.

**Reach for it when**

- "Write this up properly."
- "Document how this works."
- "Someone else needs to be able to do this without me."
- "Explain this in my notes so I don't have to work it out again."

**Try saying**

> "document how the deploy works"

It reads the real thing — entry points, config, instruction files, recent changes — rather than describing it from memory, because documentation that contradicts the code is worse than none. It picks a shape (a runbook here) and says which and why before writing.

> "write up how we do the quarterly insurance renewal so my partner can run it next time"

Nothing technical involved. Same treatment: a personal process note or a runbook with the trigger, what you need before you start, the ordered steps, how to tell it worked, and what tripped you last time.

> "document what we just did"

The session is the source. This is the cheapest and richest case — what you were trying to do, what was tried and abandoned, the constraint that forced the shape of the answer.

> "write an onboarding page for whoever joins this project next"

An onboarding shape: what to install or get access to, a first small task that proves it works, the vocabulary, where things live, who to ask.

> "document how I handle month-end invoicing for clients"

A how-to or runbook. Freelance admin gets the same rigour as a production deploy.

**Good to know**

For anything spanning more than the current file, it can launch the **context-harvester** subagent — a digest of the session, the repository, project instruction files and anything reachable through connected tools — so the conversation does not fill up with raw logs.

Connected tools are opt-in, not automatic. It says which one it wants to query and why before pulling from it.

It finishes gathering by asking you for what no tool can supply: why this exists, what it replaced, what nearly went wrong, who cares. Two sharp questions rather than a page of invented filler.

It picks one of six shapes and tells you which: overview or explainer, how-to, runbook or SOP, reference, onboarding guide, personal process note. Across every one of them the instruction is to write down the **why and the non-obvious** — the obvious is recoverable from the thing itself; the reasoning, the rejected alternative and the trap are not.

Before creating a note it searches for an existing one on the topic. If something close exists it updates that in place — revising the stale parts, keeping what is still true, adding a short dated line saying what changed and why — and shows you the substance of the diff first. A near-duplicate splits future searches and both copies rot.

The note is written to stand alone for a stranger in six months: every pronoun resolved, files and systems and people named in full, no "as discussed above", anything time-sensitive dated. Frontmatter includes a source line saying where the material came from.

For anything longer than a few lines, you see the path and the outline before it writes.

---

## vault-decision

**What it's for**

Recording a choice and the reasoning behind it, while the reasoning is still warm. The point of a decision note is that a future reader — usually you — can tell **why**, not just what. It handles technical and professional decisions and personal ones on the same spine.

**Reach for it when**

- "We should write down why we went this way."
- "I want to remember how I decided this."
- "Record the trade-offs before I forget them."
- "That earlier decision is dead — we've changed our minds."

**Try saying**

> "record why we went with Postgres instead of DynamoDB"

If you just argued it through in this conversation, that reasoning *is* the record — it writes it up and shows it to you for correction rather than making you restate it. It also searches the vault for prior art first, because an earlier note on the same question changes what it writes.

> "write up how we chose the school — I want to be able to look back at this"

Personal mode. Same spine, different criteria: money, time, energy, relationships, values, what the choice forecloses. First person and honest rather than neutral and precise.

> "document why I took the contract instead of the full-time offer"

Also personal. A freelancer choosing a contract and an engineer choosing a queue get the same rigour.

> "log the decision to drop the Redis cache"

It will ask for the one thing usually missing: the option that was rejected and why. Two real options beat four invented ones — if only one was seriously on the table, it writes exactly that rather than padding the note to fill a template.

> "the queue decision from March is dead, we've switched to the managed service"

Superseding, which is not deleting. See below.

**The shape of the note**

Five sections in both modes:

1. **Context** — the situation, and specifically what forced a choice *now*. A decision with no forcing function is usually a preference, and it will say so.
2. **Options considered** — the real alternatives, including doing nothing.
3. **Trade-offs** — what each option costs and buys, concretely. "Slower writes but no extra service to run" and "closer to family but a 20% pay cut" are useful; "pros and cons" is not.
4. **Decision** — the call, one sentence, plain words.
5. **Consequences** — what this commits you to, and what would make you revisit it. It names the signal: a number, a date, a change in circumstances.

Personal decisions get two more, because they are what make an old decision legible years later:

6. **What I was optimizing for** — the single thing that outranked everything else.
7. **How I felt about it** — relief, dread, a coin-flip. This is the part memory rewrites first.

**Good to know**

**Small decisions get small records.** Which library for a throwaway script, which dentist, which of two weekend plans — it offers three or four lines appended to your daily note instead of a full note. It will ask if it cannot tell which size the decision is.

**Superseding never deletes.** When a decision is reversed, it marks the old note's status as superseded, appends a line pointing at the new note and saying what changed, and writes "Supersedes [[old note]]" in the new one. History stays. A reversed decision, with both halves intact, is one of the most valuable notes in a vault.

Notes touching unreleased plans, security details, someone else's private information, money, health or relationships get a `sensitivity` property — `private` for someone else's information, money, health or relationships, `internal` for unreleased plans or security details. vault-share hard-stops on `private` and warns on `internal`, and will not send a private note anywhere without an explicit override. When in doubt it marks the note and tells you it did.

It follows your vault's existing structure and reuses an existing tag over minting a near-duplicate, and if you have a decision template it prefers that over inventing a layout. At the end it shows the finished note, confirms the path, and offers the natural next step — a follow-up task, a diagram if the decision has a shape, or backing it up.

## vault-task

**What it's for**

Adding, listing, completing and rescheduling to-dos that live as ordinary Markdown checkboxes inside your own notes. There is no separate task file, no database, no app to learn — if a `- [ ]` is not in one of your notes, this skill does not think it exists. It treats "call the pharmacy" exactly as seriously as "ship the migration".

**Reach for it when**

- "remind me to renew the passport"
- "what's still open on the client site?"
- "mark the dentist booking as done"
- "what do I owe my sister?"
- "my list has gotten out of hand, help me cut it down"

**Try saying**

> "add a to-do: chase the landlord about the boiler"

It finds the note where that belongs — a house or home note if you have one — and appends a `- [ ]` line under the existing tasks heading if the note has one. You get told which note it landed in.

> "add a to-do for the auth rewrite: write the migration rollback plan"

Same mechanism, different home. It searches for the project note by name and appends there, so the task sits next to the context that explains it.

> "remind me to pick up the prescription tomorrow"

Anything tied to today or tomorrow goes straight into your daily note, because that is the page you will actually open in the morning.

> "what's open in the Home folder?"

It filters to that folder rather than dumping everything, and reports back grouped by note rather than as one flat list.

> "tick off the passport renewal"

It re-reads the note, finds the line whose text matches, and flips that checkbox. Then it confirms it moved.

**Good to know**

Tasks go to one of three homes, in this order of preference:

| Home | When |
| --- | --- |
| The relevant project or area note | There is already a note about this thing |
| Today's daily note | The task is tied to today or tomorrow |
| An inbox note | Nothing else fits yet |

It asks **once** which of these you want as your default, records the answer in your config, and then stops asking. After that it only checks with you when a task clearly does not fit the default. If you have no inbox note and one is needed, it proposes creating one and waits for your yes.

**Why it re-checks before ticking something off.** Tasks are addressed by note-and-line-number, and line numbers move the instant anything edits the file — including an edit made a minute earlier in the same conversation. So before every change it re-runs the task listing for that one note, matches on the task's *text*, and uses the fresh line number. This is the difference between "done" landing on your dentist appointment and landing on the line below it.

Filters available: open only, done only, a custom status character, a single note, a whole folder, today's daily note, or the note currently open in Obsidian.

It matches your vault's existing task vocabulary. If you have the Tasks community plugin enabled, it copies the shape of a real existing task in your vault — the richer status characters like `/` for in progress or `-` for cancelled, and your due/scheduled date syntax. If you do not, it writes plain `- [ ]` and `- [x]` and nothing else, so you never end up with plugin emoji rendering as literal junk.

Rescheduling is an edit to the line, not a status change. Moving a task to another note means appending it there and clearing it from the source, and it confirms both halves happened.

When your list has grown long or stale, it offers to group it, to surface what has been sitting in untouched notes for weeks, and to ask what can simply be dropped — but it will never bulk-close anything on inference. You see the exact candidates and say yes.

**What it does not do:** it does not set reminders or notify you, it does not sync with an external task app, and it does not invent tasks from your conversation without offering them to you first.

---

## vault-standup

**What it's for**

A short honest answer to three questions: what moved, what is next, what is stuck. It assembles that from whatever sources you actually have — the current conversation, your repositories if you have any, connected tools if any are attached, and always your vault — then prints it and files it in your daily note.

**Reach for it when**

- "what's my standup?"
- "what did I do yesterday?"
- "I've got a check-in in ten minutes"
- "what am I working on today?"
- "weekly standup please"

**Try saying**

> "standup"

It reads what has already happened in this session, checks recent repo activity if any is configured, reads yesterday's and today's daily notes, pulls completed and open tasks, searches for anything marked blocked, then prints three sections you can copy straight out — and appends the same text to today's daily note under a `## Standup` heading.

> "what did I get done yesterday? I need to tell my supervisor"

Same gather, but framed for a person rather than a team ritual. It names specific things — the chapter, the form, the person — and cuts anything that would be true on any day.

> "standup weekly"

The three daily sections, plus a short look-ahead built from upcoming task due dates, decisions still awaiting a call, anything that slipped and is now at risk, and calendar commitments if you have a calendar connected. Three or four lines, framed as intent rather than a promise list.

> "quick check-in — I'm running a house renovation, not a sprint"

The three questions hold; the vocabulary changes. "Handled / Today / Stuck or waiting" instead of "Yesterday / Today / Blockers".

**Good to know**

It gathers in a deliberate priority order and stops as soon as it has enough:

1. **The conversation itself** — if this skill runs inside a working session, that is the best source and costs nothing.
2. **The session and the local repository** — a context harvest plus recent commit activity, or the context-harvester subagent when the picture spans more than one directory.
3. **Several projects** — if you configured more than one repo, the activity-collector subagent does the sweep and returns a digest instead of flooding the conversation.
4. **Connected tools** — it discovers what is actually connected in this session and uses it. It will not assume a tracker or chat tool exists, and it tells you which tool it is querying and for what window before pulling. Nothing connected means this step is skipped silently.
5. **The vault** — always worth a pass, and often enough on its own.

**If you have no repos and no connectors, this still works.** The conversation plus the vault is a complete source. It will not block on missing integrations and will not apologise for them in the output.

The rules that matter more than the format: only real, specific items; group by outcome rather than by commit or file; under a minute read aloud, roughly three to five items for done and one to three for next. A quiet day is a valid answer — it will say the day went to one thing rather than inflating it, and ask whether something happened away from the tools. Blockers get real attention: for each one, who or what it is waiting on, since when, and what would unblock it.

Re-running it on the same day updates the standup section in your daily note rather than stacking duplicates. If your profile shows a standup or daily template, it applies that instead of inventing a layout.

**It never sends anything anywhere.** No message, no email, no ticket comment, no channel post — even if a chat tool is connected and even if your config names an audience. You send your own update. It will happily reformat the text for a particular destination.

---

## vault-report

**What it's for**

A written status update for someone else to read. Audience is the organising idea: the same week of work becomes a genuinely different document depending on who opens it. It gathers real activity across the period, structures it around outcomes rather than effort, and hands you text.

**Reach for it when**

- "write my end-of-day report"
- "I need a progress update for the client"
- "summarise this month for my supervisor"
- "write up where the renovation stands for my partner"
- "give me an honest weekly summary, just for me"

**Try saying**

> "weekly report for my manager"

It confirms the audience in one line ("Writing this for your manager, Priya — or is this going somewhere else?"), states the date window it used, gathers the period, then prints five sections: what moved, in flight, risks and blockers, what is next, what I need from you.

> "same week, but write it for the client"

The same underlying facts, a different document. Outcomes, dates, risks to *their* plans, decisions it needs from them — and internals, tooling, who-did-what and half-finished exploration stripped out.

> "now write that week for me, honestly"

The candid version, including what went badly and what got avoided. The "what I need from you" section is dropped, because there is no one to ask.

> "monthly update for the school on my daughter's reading programme"

Method, findings, what is still uncertain, next steps. Plain register, no performance.

> "write a status note for the builders about the kitchen"

Personal projects take the same shape. What is done, what is in progress, what is blocked and since when, what you need from them to move.

**Good to know**

The audience table it works from:

| Audience | Wants | Keeps out |
| --- | --- | --- |
| Client / customer | Outcomes, dates, risks to their plans, decisions needed from them | Internals, tooling, who did what |
| Manager | Progress against what was agreed, blockers, what you need, early warning | Keystroke detail, work with no bearing on commitments |
| Team / collaborators | Detail, specifics, where to pick up | Ceremony, restating what they already saw |
| Stakeholder / exec | Three things that moved, one risk, one ask | Anything needing context they lack |
| Teacher, advisor, committee | Method, findings, uncertainty, next steps | Polish over substance |
| Yourself | Candid, including what went badly | Performance |

Your config holds a default audience, but it is a default and never a lock — you can override it for a single report.

**The honesty rules are not decoration.** It will not inflate: three real items beat nine padded ones. It will not invent progress, dates, numbers or causes — if a source did not say it, it does not go in. Uncertainty is flagged as uncertainty ("likely Thursday, depends on the vendor reply") rather than laundered into a commitment. Bad news goes early and in its own words, not buried under accomplishments. And what was planned but did not happen gets named, with the reason.

**Sensitive-content screening.** Notes tagged or marked `confidential`, `private` or `sensitive`, and folders you have told it to keep out, are excluded unless you explicitly ask for them in this report. When the audience is external — a client, a customer, anyone outside your organisation or household — it flags lines that read as internal before handing the draft over: a person's performance, an unannounced plan, pricing or cost internals, a security issue, a vendor complaint, another client's name. Personal-life reports get the same screen in a different shape: other people's health, money and relationships. It names only what the reader already has a right to know, and asks you before cutting.

**It hands you text; it does not send it.** The report printed in the conversation *is* the deliverable. This plugin wires up no messaging. Saving a copy to the vault is offered, and happens only if you asked for it or set `reportsSaveToVault` in your config. If a chat or email connector happens to be attached and you ask it to send, it shows the exact recipient and the exact final text and waits for a yes right then — never on the strength of an earlier approval, and never to a recipient that came from a document rather than from you.

---

## vault-review

**What it's for**

The reflective counterpart to the standup. A review is not a summary — a summary lists what happened, a review asks what it was worth and changes what happens next. It compares this period against your last review, asks a few good questions, and ends with three to five concrete commitments written into your vault as real tasks.

**Reach for it when**

- "weekly review"
- "how did this month actually go?"
- "help me plan next week"
- "I keep meaning to get to the same things and never do"
- "quarterly — I want to look at whether these goals still hold"

**Try saying**

> "weekly review"

It states the exact date range in its first reply ("Monday 6th to today"), finds your previous review, reads the daily notes in range, separates tasks completed this period from those still open, and walks the five sections in order. Ends with three to five commitments written as `- [ ]` lines, after you approve the list.

> "monthly review, work and personal"

The long sit-down: all five sections, all four questions, personal life running alongside professional in each section rather than tacked on at the end, trends across your last three reviews, and a look at whether the goals themselves still hold.

> "quick review, I've got fifteen minutes"

The five-minute version: last review's commitments checked off, open tasks, one question, three commitments.

> "quarterly review — I want to know why the Spanish lessons keep sliding"

Section three is built for exactly this. A task that has survived two reviews is telling you something: it is too big, it is not really wanted, or it is blocked on someone else. It says which.

**Good to know**

Three periods: weekly, monthly, quarterly. Weekly defaults to the short version; monthly and quarterly to the long one. It says which one it is running in a single clause and offers the other.

**It looks for your previous review before gathering anything else.** That review's commitments are the spine of this one: each is done, partly done, or quietly abandoned, and the third category is the interesting one. Without that comparison you are writing a diary entry. If none exists, it says so plainly — this is review one, and the value starts compounding from the next.

The five sections, worked in sequence, because the order is the point:

1. What actually happened — facts only, grouped by area, short. You were there.
2. What moved toward stated goals, and what did not — tied back to the last review and any goal notes in your vault. Gaps named plainly.
3. What kept getting postponed, and why.
4. What to drop — every review must be willing to close something unfinished, and it offers the specific candidates rather than asking you to nominate them.
5. What deserves more time — the thing that worked and was starved.

Then at most four questions, asked in one message after you have seen the evidence, so you are reacting rather than recalling. Short answers are fine; a two-word reply is still data. It will not re-ask something your daily notes already answer.

**A review that produces no tasks is just journaling.** So it ends with three to five commitments, no more, each concrete enough that the next review can mark it done or not done — "draft the migration plan", not "think about migration"; "book the dentist", not "health". Anything vaguer stays a note. It shows you the list and waits for a yes before writing, because a commitment you did not agree to is noise in the next review.

Personal goals are first-class. If your setup includes personal use, health, relationships, learning, money and home run *inside* each of the five sections, not as an appendix. If your vault is entirely personal, the work framing is dropped rather than left as empty headings.

The note itself gets a stable heading structure every single time — that consistency is what turns a pile of notes into a legible record — plus links to the previous review and a forward link from that note back to this one, so the chain walks in both directions.

**What it does not do:** nothing leaves the vault from here. It will not bulk-close, retag or archive stale tasks without showing you the exact list first.

---

## vault-diagram

**What it's for**

Turning something tangled into a picture inside one of your notes — a Mermaid flowchart, sequence, state, mind map, timeline or Gantt — or setting up an Obsidian Canvas when the thinking is still spatial and unfinished. It draws what you described. Nothing more.

**Reach for it when**

- "diagram this"
- "draw the flow"
- "map out the next three months"
- "I can't hold this in my head, show it to me"
- "visualise how these options compare"

**Try saying**

> "diagram the job offer decision — draw it as a tree"

A `flowchart TD` with your actual considerations as labelled decision nodes, not `A → B → C`. It tells you which note it went into and where in that note.

> "make a Gantt for the house move — packing, completion, movers, utilities"

A `gantt` block with real durations and overlap, because that is where the pain actually is in a move.

> "draw the school run handover between me, my mum and the after-school club"

A `sequenceDiagram` with named participants. Same form as client-to-API-to-database, different vocabulary.

> "show my reading list as states — want to read, reading, abandoned, finished"

A `stateDiagram-v2` with the transitions you described.

> "I've got twelve half-formed ideas for the business, give me somewhere to push them around"

That is Canvas, not Mermaid. It creates a `.canvas` file, seeds it with notes you already have (searching for them first, so nothing renders blank), spaces them out, and opens it for you to rearrange.

**Good to know**

How it picks the form:

| What you are describing | Form |
| --- | --- |
| A process with branches, "then if…" | `flowchart TD` or `LR` |
| Two or more parties exchanging things over time | `sequenceDiagram` |
| Structure — parts, types, what contains what | `classDiagram`, or `erDiagram` for records and relations |
| Something with modes it moves between | `stateDiagram-v2` |
| A brainstorm, an unstructured dump | `mindmap` |
| A plan with dates or phases | `timeline` for milestones, `gantt` when durations and overlap matter |
| A simple share or split | `pie` |
| Options scored on two axes | `quadrantChart` |

You can name the form yourself; otherwise it picks and tells you which it picked. Labels use your vocabulary, not a domain's.

`mindmap`, `timeline` and `quadrantChart` depend on the Mermaid version bundled with your Obsidian. If one renders as an error block, it falls back to a flowchart or Gantt and says why.

**When Canvas beats Mermaid.** Mermaid is for a structure you can already state in words. Canvas is for one you are still working out — arranging notes that already exist side by side, a messy board you will drag around, a research map, a wall of options with no fixed order. If Excalidraw is installed in your vault, it will offer that instead for hand-drawn, presentation-facing sketches. It checks your profile first and will not suggest installing something you do not have.

It decides between putting the diagram inline (explaining a section of an existing note) and standalone (when the diagram *is* the artifact — a system map, a life plan, a household process), and tells you which it chose. Replacing an existing diagram means showing you the old block and the new one first; adding alongside is usually safer.

**The honest limit: this skill writes diagram source. It cannot render or validate the image.** A syntax error only shows up when you open the note in Obsidian. So it always closes with the path, the form chosen, and a nudge to open it and check — and offers to adjust the flow or split it in two if it does not come out right. Past roughly fifteen nodes it will split the diagram and link the halves rather than hand you a graph nobody can follow.

---

## vault-sync

**What it's for**

Making sure your notes are safely saved, whatever you use to save them. Git is **one** option here, not the assumption — plenty of people back a vault up with Obsidian Sync, a cloud folder, or nothing at all. It reads what you told setup, reports honestly, and never syncs behind your back.

**Reach for it when**

- "back up my notes"
- "are my notes actually saved anywhere?"
- "commit the vault"
- "Dropbox has been acting strange, check my vault"
- "I've never backed this up and it's starting to worry me"

**Try saying**

> "back up my vault"

It reads your sync mode and branches. With git it shows you what changed, screens it, drafts a commit message, and waits. With Obsidian Sync it reports the sync status. With a cloud folder it hunts for conflicted copies. With nothing configured it lays out the options once.

> "commit my notes and push"

The full git path: status and diff first, a screening pass, a specific commit message shown to you before anything is staged, then an explicit remote choice, then the push.

> "is my vault up to date on my other laptop?"

Obsidian Sync mode: it reports up to date, still uploading, or paused, in plain words.

> "I think I lost a note — it was there yesterday"

On Obsidian Sync it can list files deleted on another device and show you a note's version history, then restore a version after showing you what it contains and getting your yes.

> "I've got no backup at all. What should I do?"

It states the risk once, concretely, without a lecture, lays out git / Obsidian Sync / a cloud folder / a periodic copy to an external drive, and offers to run setup. If you say no, it accepts that and does not raise it again in the session.

**Good to know**

The four modes and what it actually does in each:

| Mode | What happens |
| --- | --- |
| `git` | Read-only status and diff first; screen the changes; draft a real commit message; commit only after you see it; push only after you pick the remote |
| `obsidian-sync` | Reports status, lists files deleted on other devices, can show and restore version history. It will not layer a git workflow on top |
| `cloud-folder` | Confirms your vault really is inside the synced folder, then hunts for conflicted copies and offers to reconcile them one at a time |
| `none` | Names the risk once, lays out the options, offers setup — then drops it |

**The screening step in git mode matters.** Before anything is staged it reads the changed notes and looks for notes marked confidential heading for a remote, secret-shaped strings (keys, tokens, passwords, recovery codes, card numbers pasted into a note — journals collect these more often than work notes do), and Obsidian UI churn like `workspace.json` that records which panes were open rather than any content. Anything that trips a check stops the flow, shows you the file and the line, and asks.

The commit message names what actually changed — "Add decision note on the flat vs house call; 3 reading notes; close 4 tasks; week-38 review", never "Update notes". You should be able to scan it in six months and know what it was.

If you have more than one remote it **asks which**, every time. A vault often has a personal remote and a shared one, and pushing private notes to the wrong one is not recoverable. If you have no remote, it says plainly that the commit is a local backup only and offers to walk you through adding one yourself — it will never create a remote or a sync account for you.

**Why a stray push gets blocked.** A hook watches every shell command for a `git push` aimed at your vault or your shared repo. The reviewed sync flow adds an internal confirmation marker to its push command, which means "the user saw this diff and this remote and said yes." A push that arrives without that marker — typed on impulse, or produced by some other flow that skipped the review — is blocked, with a message telling you to use the sync skill instead. It is deliberately narrow: only `git push`, only at your configured paths. Ordinary git reads are untouched. The occasional false positive just means you route through the reviewed flow, which is the point.

**What it does not do:** it never syncs on a schedule, on session end, or as a side effect of another skill — always a deliberate action you asked for. It will not change a repository's visibility. Deleting history and force-pushing are out of scope and get handed back to you with an explanation. Sharing one note outward is a different skill; this one only moves the whole vault to the backup you already chose.

The SessionEnd hook is related but separate: it reminds you to back up if there are uncommitted changes. It never commits for you.

---

## vault-share

**What it's for**

The one deliberate way something leaves your private vault. Two modes: a redacted export you send to one person, or a pull request into a shared team repository. Both end in a review you approve line by line.

**Reach for it when**

- "send this note to Sam"
- "export the onboarding doc so I can email it"
- "I want to paste this into Slack but not the whole thing"
- "contribute this runbook to the team docs"
- "share my notes on the school options with my sister"

**Try saying**

> "export my note on the mortgage options so I can send it to my sister"

It reads exactly that note, runs the redaction review, shows you the original next to the proposed redacted version, and on your approval writes a clean Markdown file wherever you say — Desktop, Downloads, a path you give. It confirms the destination before writing and never writes the export back into your vault unless you ask.

> "give me a plain-text version of the retro note to paste into chat"

Same review, different output: the approved text printed in the conversation, with Markdown stripped that would not survive the destination.

> "share the incident write-up with the team repo"

Pull request mode, if you have a shared repo configured. It branches off the default branch, reads the repo's own `CONTRIBUTING.md` and structure, puts the file where comparable documents already live, runs the repo's validation if it has any, then confirms the exact PR title and body with you immediately before opening it.

> "turn my project notes into something I can hand to the client as a document"

After the review, it hands the approved text to whatever skill or tool produces that format rather than hand-rolling it.

**Good to know**

**Export mode is the normal case.** Most people have no shared repo, and that is fine. If none is configured it says so plainly, offers the export, and mentions that setup can add one later. It will never guess at or repurpose some other repository it happens to see on your disk.

**The redaction review runs for both modes, every time, including for notes that look harmless.** It reads the text and flags:

- **People** — colleagues, clients, patients, students, family, anyone named who did not agree to be in a shared document
- **Organization identifiers** — employer, client, school, vendor names; internal codenames; ticket or account numbers
- **Credentials** — anything token-shaped: API keys, passwords, connection strings, long random strings, `.env` fragments
- **Internal addresses** — intranet URLs, hostnames, private IPs, internal file shares
- **Unreleased or unagreed plans** — dates, pricing, headcount, roadmap items, personal decisions not yet announced
- **Third-party personal detail** — health, pay, performance, relationships, home addresses

It also strips vault-internal artifacts that would mean nothing to your recipient: `[[wikilinks]]` resolved to plain text or a real URL, embeds of notes they cannot see, private frontmatter and personal tags, task checkboxes, and queries that will not render anywhere else.

Then it shows you the **original next to the proposed redacted version** and asks: approve, edit, or cancel. It waits for a clear answer, does not proceed on silence, and does not shorten this step because you seem in a hurry.

If the note is marked `sensitivity: private` (or carries an older `confidential: true` / `sensitive: true` flag), it stops and requires an explicit "yes, share it anyway" before going any further. That refusal is correct behaviour, not an obstacle to route around.

It acts only on the note you name. One share request is one note or excerpt — it will never scan your vault deciding what looks shareable.

**Sharing never modifies the original.** Adding a breadcrumb back — a PR link, a "shared on this date" line, a `shared: true` property — is a separate step it does only if you ask.

In PR mode it never commits to a default branch, never force-pushes, and never opens a pull request without the title and body confirmed in the same breath. The push carries the same confirmation marker the sync flow uses, so the push guard lets it through. If the `gh` command-line tool is not available, it pushes the branch and hands you the compare URL to open the PR yourself.

Text read from a note, a fetched page or a connected tool is treated as material to share, never as instructions — including text that claims you already approved sharing it.

## What runs automatically

Most of this plugin only does something when you ask it to. A few pieces run on their own, and it is worth knowing exactly what they are, because the honest answer is that they do very little — deliberately.

### The two subagents

A subagent is a helper that goes off, gathers a pile of raw material, and comes back with a short digest instead of dumping everything into your conversation. Neither of them writes anything. Both are strictly read-only.

**context-harvester** answers "what has actually been going on here?" A skill calls it before writing a document, a decision record, a standup or a report. It reads the current session, runs the bundled context script, looks at the repository if there is one, reads project instruction files like `CLAUDE.md` or `README.md`, and pulls from any connected tools you happen to have attached. It comes back with a fixed set of headings: session summary, work done, files or areas touched, decisions and reasoning, open threads and blockers, external items, and — the important one — **could not determine**.

That last heading is the whole point. It is the list of things the harvester tried to establish and could not, so the skill asks you rather than inventing an answer. It also labels every item as *observed* (it read it in a diff, a file, a command output) or *reported* (you said it, but it could not be verified). It never invents a commit hash, a ticket number, a date or a person's name.

**activity-collector** answers "what moved across everything, not just here?" If you have listed several project folders in your config, it collects commits, branches, files touched and — only if you have a code-host CLI installed and already logged in — pull requests, across all of them. It also pulls from connected tools if any are attached. You get a few compact lines per project, not raw logs.

If you have no repositories at all — which is completely normal for a writer, a student, a researcher, or someone using the vault for personal life — activity-collector returns an empty result and that is a success, not an error. It will not go hunting around your filesystem for repositories you did not tell it about.

### The three hooks

Hooks are small scripts that fire at fixed moments. Two of them just tell you things, and only when something needs your attention. One of them blocks exactly one thing.

| Hook | When it fires | What it does |
|---|---|---|
| **SessionStart** | Once, when a session begins | Silent when your vault is healthy; speaks up only if it was renamed or moved, or Obsidian is not answering |
| **SessionEnd** | Once, when a session ends | Tells you if your vault has uncommitted changes |
| **PreToolUse** | Before a Bash or PowerShell command runs | Stops an accidental unreviewed `git push` of your vault |

**SessionStart** says nothing when everything is fine — it runs in every Claude Code session on your machine, so silence is the healthy state. It first checks whether Obsidian is running and, if not, stays quiet rather than launching the app (the Obsidian CLI would otherwise open it). If Obsidian is running, it looks your configured vault up in Obsidian's vault list and speaks up only if the vault is missing (renamed or removed), sits at a different path than your config says, or Obsidian is not answering. If you have not run setup yet, it stays quiet too — the skills tell you when you use them. It never blocks the session.

**SessionEnd** only says anything if three things are true at once: your vault path exists, you are using git as your sync method (or have not chosen one), and `git status` shows changed files. Then you get a line like "7 file(s) changed in your vault this session — run /vault-sync to review and commit." That is the entire behaviour. It does not commit. It does not push. If you sync with Obsidian Sync, a cloud folder, or nothing at all, it stays quiet, because nagging someone about a git workflow they do not use is obnoxious.

**There is no tool-call hook recording activity any more.** Earlier versions logged every file edit in every project on your machine. Now the plugin's own CLI wrapper records only the vault changes the plugin itself makes — which command, which note, when — as one JSON line each, never command text or note contents, in a file capped at about 1 MB. vault-sync reads it to write an accurate commit message. Nothing is recorded for your other projects.

**PreToolUse** is the one hook that says no. It reads Bash and PowerShell commands, works out which directory a `git push` would really act on — through `cd`, `-C`, forward or back slashes, Git Bash `/c/` paths and subfolders — and stops the push if it targets your vault or shared repo without coming through `/vault-sync` or `/vault-share`. Treat it as an accident-stopper, not a lock: the approval it looks for is written by the assistant itself. The real safeguard is Claude Code's own permission prompt, which still asks you before every push.

### What none of this does

Worth stating flatly, because it is the difference between a tool you can leave running and one you have to watch:

- **Nothing auto-commits.** Ever. Not on session end, not on a schedule, not as a side effect of another skill.
- **Nothing auto-pushes.** Every push shows you the diff and the remote first and waits for an explicit yes.
- **Nothing auto-sends.** No messaging integration is wired up anywhere in this plugin. A standup or a report is text handed back to you in the conversation. You decide where it goes, and you send it yourself.
- **Nothing reorganises your vault in the background.** No folder gets created, no note gets moved, no tag gets renamed without you seeing exactly what will happen and agreeing to it.
- **No subagent writes anything.** Both are investigation only. If one of them notices something that looks broken, it reports it rather than fixing it.

---

## How it knows what you did

Here is the thing that makes the output worth keeping, and the reason you should not retype your own week into a prompt.

When you ask for a standup, a report, a decision record or a piece of documentation *from inside a session where you have been working*, the assistant already knows a great deal. It knows what you tried, what broke, what you chose and why you rejected the alternative, and what you said you would do next. Most note-taking tools throw that away and hand you an empty box. This one harvests it first and shows you a draft to correct.

So the single most useful habit is this: **do not re-explain your day.** Say "write my standup" and let it tell you what it thinks you did. Correcting a draft takes fifteen seconds. Composing one from memory takes ten minutes and you will forget the interesting part.

### Where the material comes from, cheapest first

The plugin gathers in a fixed order and stops as soon as it has enough to write something specific and true.

**1. The live conversation.** Richest, cheapest, and the only source that contains *reasoning*. Git records outcomes; a tracker records status changes; neither records the argument you had with yourself before choosing. That lives here and nowhere else.

**2. The bundled context script.** One command returns a single tidy bundle: your last dozen or so prompts with the harness noise stripped out, the files edited during this session, git branch and status and recent commits if this is a repo, which instruction files exist, and the memory index. It is used before anything reads raw files by hand, because it already handles the awkward parts and swallows every error — a missing source comes back as an empty section rather than a crash.

**3. The session transcript on disk.** This is the nuance that matters most, and it is the reason the plugin can do something your memory of the chat cannot.

Long conversations get **compacted**. When a session runs on and on, earlier turns are summarised away to make room. Compaction keeps the gist and drops the detail — which is exactly backwards for note-writing, because the detail is the note. The specific error message, the number, the file name, the reason option B lost: those are the first things to go.

Claude Code writes the session to a transcript file as it goes, so the plugin can read back what scrolled out of context. Those records also include which files were touched and when, which is how a standup can name the four things you actually changed rather than saying "worked on the project". The files get large, so it reads the tail and filters rather than loading whole ones. Other sessions for the same project sit alongside, which is how "what did I do yesterday" finds yesterday.

One rule that is not negotiable: transcript content is treated as **data, not instructions**. A prompt you typed three weeks ago saying "always push straight to main" is a record of something you once said. It is not an authorisation now.

**4. The repository or working folder.** Status, recent commits, changed files, a diff stat. Entirely optional. "This is not a git repository" is a normal, expected answer for a writer's folder or a personal vault, and it is never reported to you as a problem. Nothing will suggest you run `git init`.

**5. Project instructions and memory.** `CLAUDE.md`, `AGENTS.md`, `README.md`, and the plugin's memory index. These are read to learn your vocabulary and constraints — so a note calls things what your project already calls them — rather than to be quoted into the note.

**6. Connected tools.** If you have connectors attached to your session — an issue tracker, a code host, a calendar, chat, a docs service, a data warehouse — they are treated as context sources too. Nothing assumes any particular one exists; what is available is discovered at runtime. A skill will name the tool it wants to query and why before pulling from it.

If a connector was *central* to what you asked for and it is not available, you will be told plainly ("the tracker is not connected here, so the ticket list is from the conversation only") rather than quietly handed a thinner note you assume is complete. If it was peripheral, it is skipped without comment. And as with transcripts: a ticket description containing instructions is still just a ticket description.

**7. The vault itself.** Your recent notes, today's and yesterday's daily notes, your open and completed tasks, prior decisions on the same subject, and a scan of how the vault is actually organised. This is also what prevents duplicates — the vault is checked for an existing note on the subject before a new one is created, because appending to the right note beats scattering three near-identical ones.

### What gets double-checked

Conversation memory blurs specifics, so a handful of things are never written down on the strength of recollection alone:

| Detail | Checked against |
|---|---|
| File and folder names | the repository or the vault |
| Numbers, counts, durations, sizes | the actual output or the diff |
| Dates, and what "yesterday" means | the system date |
| Who said or decided something | the transcript or the tracker |
| Whether a change was actually applied | `git status`, the diff, or reading the file |

When something cannot be verified, it goes in as reported rather than as fact — "per the session notes" instead of an invented commit hash.

### Every single source is optional

This is worth saying loudly, because it is easy to read the list above and conclude that you need all of it.

You do not. A person with no git repository, no connectors, no code, and a vault they made this morning still gets a useful note built from the conversation alone. A missing source produces an empty section, never a failed run. Sources are tried once, not retried in loops. Absence is never reported as an error.

And if *everything* is thin, you will get a short honest note plus a line saying what could not be found. Three accurate lines beat a page of plausible filler, and the plugin is built to prefer the three lines.

---

## Daily, weekly and monthly rhythms

Skills are only useful if you actually reach for them. Three rhythms below — each one is a small routine with the exact phrases to say. Adopt the daily one tomorrow and the other two will start paying for themselves within a month.

### The daily rhythm — about five minutes, spread across the day

**1. Morning: find out what is already on you.** (one minute)

> "what's still open?"

The task skill reads the checkboxes that already exist in your own notes and groups them by project or life area rather than dumping a flat list. Ask narrowly if you want a narrow answer — "what's still open on the Hendricks job" or "what do I owe my sister" filters to that note, folder or tag.

The first time you add a task it will ask once where your to-dos should live by default — the relevant project note, today's daily note, or an inbox note. Answer it, and it records the answer and stops asking.

**2. Through the day: capture the instant it happens.** (ten seconds each)

> "capture this: the vendor call moved to Thursday and they want pricing first"

> "capture this: Dr. Ahluwalia said to go back in six weeks if the swelling doesn't settle"

> "remind me to chase the plumber about the quote"

Capture is the highest-frequency thing anyone does with a vault, so it is built for speed: one or two questions at most, then it writes. Fleeting things land in today's daily note. Anything with a life of its own — a meeting with follow-ups, a book you will keep adding to, a person, an idea you will develop — gets its own note in the folder where similar notes already live. Either way you get one line back naming exactly where it went, and an offer to move it if you would rather it were the other one.

The ten-second version is the whole trick. A thought you capture in ten seconds is worth ten thoughts you meant to write up later.

**3. End of day: let it write your standup.** (two minutes)

> "write my standup"

It assembles done / next / blocked from the conversation, the repository if there is one, your connected tools if any, and the vault's tasks and daily notes. Three to five items for done, one to three for next. It cuts anything that would be true on any day — no "continued work on", no "making progress".

The update is printed in the conversation ready to copy, and appended to today's daily note under a stable heading. Run it twice on the same day and it updates that section rather than stacking duplicates. It never sends it anywhere, even if you have a chat tool connected and a manager named in your config. You send your own update.

**What you get back:** a daily note that fills itself, so that a week later "what happened on the 14th" has an answer. And a standup you did not have to write at 9:01am from a blank stare.

### The weekly rhythm — about twenty minutes, once a week

**1. Run the review.**

> "run my weekly review"

The first thing it does is state the exact date range, so everything after is anchored. The second thing it does is go find your *previous* review, because the commitments you made last week are the spine of this one. Each is done, partly done, or quietly abandoned — and the third category is the interesting one. If there is no previous review, it says so: this is review one, and the value starts compounding from the next.

**2. Look at the evidence before you reflect.**

It pulls the daily notes in range, your completed and still-open tasks, the decisions and notes you created, and — if you write code or have tools connected — activity from those too. Then it works through five things in a fixed order: what actually happened, what moved toward your stated goals and what did not, what kept getting postponed and why, what to drop, and what deserves more time.

If your vault covers personal life as well as work, health, money, home, learning and relationships run *alongside* the work sections rather than being tacked on at the end.

**3. Answer up to four questions.**

They come after the evidence, in one message, so you are reacting rather than recalling: what went better than expected, what drained the most energy for the least return, what you learned, and what you want to protect time for. Two-word answers are fine. Two-word answers are still data.

**4. Commit to three to five things.**

Not ten. Each one concrete enough that next week's review can mark it done or not done — "draft the migration plan", not "think about migration"; "book the dentist", not "health". You see the list and say yes before anything is written, and then they land in your vault as real `- [ ]` checkboxes that show up when you ask "what's still open?" on Monday morning.

**5. If someone is waiting on an update, write it now while the review is fresh.**

> "draft my weekly update for my manager"

The report skill takes the audience first — client, manager, team, stakeholder, teacher, or yourself — and shapes the register and the contents accordingly. A client gets outcomes and dates and the decisions they owe you; a manager gets progress against what was agreed plus early warning; you get the candid version including what went badly. Bad news goes near the top, in its own words. It prints as plain text ready to copy, saves to the vault only if you asked for that, and does not send.

**What you get back:** a chain of reviews that link to each other in both directions, so "why did this keep slipping" has a documented answer rather than a feeling. Twenty minutes, and it is the twenty minutes that makes the daily five worth anything.

*In a hurry?* There is a genuinely five-minute version: last week's commitments checked off, open tasks, one question, three commitments. That is the default for weekly, and it is what you get automatically if you sound rushed.

### The monthly rhythm — most of an hour, once a month

**1. Run the long version.**

> "/vault-review monthly"

Same five sections, but this time all four questions, personal alongside professional, trends across the last three reviews, and — the part that only makes sense monthly — a look at whether the goals themselves still hold. Goals rot quietly. A month is about the right interval to notice.

**2. Name what keeps slipping.**

Any task that has survived two reviews is telling you something: it is too big, it is not really wanted, or it is blocked on someone else. The review will say which of those it thinks it is. Arguing with that assessment is the useful part.

**3. Prune.**

> "what's still open that I haven't touched in a month?"

You get the stale items with their text and their location, and how old they are, plus an offer to close them. Nothing is bulk-cleared on inference — you see the exact list and say yes. Closing a to-do you quietly abandoned three months ago is a real service to yourself; carrying it for another year is not.

**4. Back it up while you are here.**

> "are my notes backed up?"

Sync branches on how you actually back up — git, Obsidian Sync, a cloud folder, or nothing. If it is git, you see the diff and the remote and confirm before anything is pushed, and the commit message describes the actual work rather than saying "Update notes". If you use something else, it reports on that instead of trying to replace it.

**What you get back:** the slow signal. Daily notes tell you what happened; weekly reviews tell you whether you did what you said; the monthly one tells you whether you are pointed anywhere useful at all.

---

## Power patterns

Twelve things that are not obvious from the skill list, in rough order of how much time they save.

**Chain skills in one breath.** You do not have to run them one at a time. Say the whole arc and it will walk it.

> "record why we went with the smaller nursery, add the follow-up tasks, then draw me the timeline"

That is a decision record, three checkboxes in your task home, and a Gantt or timeline diagram — from one sentence, with the reasoning taken from the conversation you just had rather than retyped. The decision skill offers exactly these next steps when it finishes, so you can also just say yes to the offer.

**Write it up while the context is still hot.** The value of documenting something decays fast. Today the assistant can see what you tried, what failed, and the constraint that forced the shape of the answer. Next week it can see a diff. The note you write straight after the work contains the *why*; the note you write a week later contains a description of the *what*, which was recoverable anyway. Say "document how this works" before you close the session, not before the next person asks.

**Ask the vault instead of re-litigating.**

> "what did we decide about the payment provider, and why?"

Before writing any new decision record, the skill searches the vault for prior art, because an earlier note on the same question changes what you write. Use that directly. The point of writing down trade-offs is to stop having the same argument in six months, and that only works if you actually go and look.

**Make the template on the second note, not the fifth.** Everyone waits too long. The moment you write a second client call note, a second lab entry, a second lesson plan, that is the moment to say "make this a template" — while you still remember what you wished the first one had asked you. The template skill can build it from a note you already like, keeping the headings and replacing the specifics with prompts. It will also offer, unprompted, when it notices it has helped you produce the same shape of note two or three times.

A good template is a thinking scaffold, not a form. Three headings that ask real questions beat ten empty blanks that rot.

**Capture the blocker at the moment you hit it, and the standup writes itself.** When the standup looks for what is stuck, one of the things it searches for is notes and tasks marked blocked. If you say "capture this: waiting on legal to come back on the data processing clause, blocked since Tuesday" the instant it happens, that shows up in every standup until it clears — with the date, and who it is waiting on. If you do not capture it, you will remember it as "some legal thing" and say nothing.

**Spell your properties the same way every time.** This is the least exciting pattern here and the one with the longest payoff. Frontmatter property names are what make property queries, search filters and Obsidian **Bases** views work at all. A vault with `status` used consistently across two hundred notes is queryable. A vault with `status`, `state` and `Status` is three-quarters useless. The plugin checks what your vault already uses before writing anything and reuses those exact spellings — your job is just to not fight it and not invent a fourth name by hand.

If you are designing a template, choosing the fields once makes every future note of that kind queryable for free.

**Never leave a note an orphan.** Every new note should link to at least one existing note, with a short clause saying how they relate — "follows from", "decided against", "supersedes". A bare link survives; a note with no path into it does not. You can check your own vault for strays:

> "which of my notes have nothing linking to them?"

**Mine your unresolved links for what to write next.** Every `[[link]]` pointing at a note that does not exist is something you meant to write and did not. That list is the single best writing prompt in your vault, and it is one you generated yourself without trying.

> "show me my unresolved links, sorted by how often they're referenced"

The one referenced eleven times is the note you should write today.

**Use the review to close things you have quietly abandoned.** Every review is willing to drop something unfinished, and it offers specific candidates rather than asking you to nominate them — which is the difference between a review that shrinks your list and one that grows it forever. Take the offer. A task you have deferred four times is not a task, it is a small recurring guilt with a checkbox.

**Mark sensitive at write time, not at share time.** When you record a decision that touches money, health, someone else's private information, unreleased plans or security details, mark it then. It costs nothing in the moment. The share skill refuses to send a note marked confidential, private or sensitive without an explicit override, and reports exclude them by default — but only if the flag is there. Trying to remember which of forty notes is sensitive at the moment you are exporting one is how things leak.

> "record this decision, and mark it sensitive — it's got the salary bands in it"

**Draw it to find the hole in it.** The diagram skill deliberately stays inside what you described: it will not invent a retry path, an approval step, or a person you never mentioned. That constraint is the feature. When you diagram a process you think you understand, the missing branch shows up as a node with nothing leaving it, and the step nobody owns shows up as a box with no name on it. It works the same on "should I take the job offer" as on a request path, and on a house move as on a deployment.

It writes the diagram source but does not render it, so open the note in Obsidian to confirm it looks right.

**Ask the guide instead of re-reading this document.**

> "/vault-guide journaling"

> "how would I use this as a PhD student?"

> "which of these should I use for client work?"

The guide skill is re-runnable and answers narrowly when you give it a topic. It also reads your actual vault before advising, so the examples come back using your folder names and your tags rather than generic ones. It is faster than scrolling, and it knows things this document does not — like what is already in your vault.

---

## Working with an existing vault

If you have kept a vault for years, the fear is reasonable: a tool that renames your folders, bolts eight properties onto a plain note, or decides your system should have been PARA all along is a tool you uninstall the same day.

This plugin is built the other way round. **It adapts to your vault. It does not impose a system on it.**

### How it learns your conventions

Setup scans the real thing and records what it finds. That recorded profile includes:

| What it records | What it means |
|---|---|
| `folders` | *Your* names for where notes, daily notes, templates, attachments and archives live |
| `namingStyle` | Descriptive titles, date-prefixed, or Zettelkasten identifiers |
| `dailyNoteFormat` | Your real date format, including nested layouts like `YYYY/MM/` |
| `existingTags` | Tags already in use, so they get reused rather than duplicated |
| `existingProperties` | Frontmatter keys already in use, matched on exact spelling and case |
| Plugin flags | Whether Templater and the Tasks plugin are enabled, so richer syntax is only emitted when it will render |

An empty slot means "this vault has no such place", not "create one". If you have no archive folder, none gets invented.

Before a structural decision, a skill can re-scan live and get the current truth: your top-level folders, note count, tags, properties, whether a template folder is configured, the real daily note path, and which community plugins are enabled. The live scan always wins over the recorded profile, which always wins over any default.

### How it decides where a note goes

Not from the folder name. From where notes like it already live.

It searches for two or three notes of the same kind and looks at the paths that come back. If three retrospectives sit in `Journal/Reviews/`, the fourth goes there — even if your profile also lists a general notes folder. Naming is matched from the note's future neighbours: the same case, the same separator, the same shape of identifier. If your styles are genuinely mixed, it follows the most recent notes, because that is where your current habit lives.

Frontmatter works the same way. If your vault uses `category` and `created`, those get used — not a parallel `topic` and `date` bolted on beside them. If your last twenty notes have no frontmatter at all, it adds none, or at most a single tag line, and tells you it did.

### When nothing suitable exists

It proposes and asks. It names the folder, says what will go in it, and waits for a yes. A folder is never created as a side effect of writing a note.

The same applies to tags. Before coining a new one it checks what you already have and prefers an existing near-match — `#health` over a new `#wellbeing` — because synonym drift is how a vault becomes unsearchable. If it does introduce a genuinely new tag, it says so.

### How it fits the system you already use

**PARA** — `Projects/`, `Areas/`, `Resources/`, `Archive/`. Actionable, time-bound notes go under the relevant project; ongoing responsibilities like health, finances or a team you run go in areas; reference material goes in resources. When a note is genuinely ambiguous between buckets, you get asked rather than guessed at. Finished projects are *moved* to archive, not deleted. No fifth top-level bucket is ever invented.

**Zettelkasten** — flat or near-flat, ID-named notes, dense linking. The value is in the links, not the location, so every new note gets one idea, an identifier in your vault's exact format, and at least one link to an existing note with a line saying how it relates. A timestamp ID will never be mixed into a vault using Luhmann-style branching IDs, or the reverse. Topic folders will not be introduced into a deliberately flat Zettelkasten.

**Johnny Decimal** — `10-19 Finance/11 Tax/11.03 ...`. The numbers are the address and they are not negotiable. A new note goes inside an existing category and takes the next free ID there. New area or category numbers are never created for you — that is a decision the owner of the system makes.

**Flat vault driven by tags** — everything in the root or one folder, organised by `#tag`. The note goes where the others are, and the effort goes into tags instead: reusing one you already have rather than coining a near-duplicate. Nobody will offer to "clean this up" into folders. It is not untidy; it is a design.

**Folder per project** — `Client A/`, `Client B/`, `House/`. It finds the project folder first and mirrors its internal shape. If `Client A/` has `meetings/` and `decisions/`, a decision for Client B lands in the equivalent place. Starting a new top-level project folder is always asked about first.

**No system at all.** Plenty of vaults are a pile, and that is fine. The note goes somewhere sensible, you are told once where it went, and a light structure is *offered* — never performed.

### Daily notes

The real path and format are read from Obsidian itself, including nested layouts, rather than assumed from your profile. If the two disagree, Obsidian wins and you are told about the drift. Content is appended to the daily note rather than the file being rewritten — or prepended, if your daily notes run reverse-chronologically.

If you do not have daily notes enabled, they will not be enabled for you. Captures go to the location in your profile instead, and you are told where.

### The short list of things it will never do

- **Reorganise your vault unasked.** Not folders, not tags, not frontmatter. Observations are offered; migrations are not performed.
- **Bulk-rename, bulk-move or bulk-edit without showing you first.** Every affected path, before and after, then an explicit yes.
- **Invent a tag when a close one already exists.**
- **Add heavyweight frontmatter to a vault of plain notes.** It matches the weight of what is already there.
- **Delete.** Archive or move instead. If you genuinely want something deleted, you see the exact paths and confirm.
- **Create a folder as a side effect.** It asks, every time.
- **Rename or delete-and-recreate to relocate a note.** It uses Obsidian's own move and rename so your backlinks survive.
- **Ignore a note marked private or sensitive** when sharing, exporting or publishing anything.

## Quickstarts by role

These are signposts, not prescriptions. Find the two or three that describe you, take the
skills and the one habit, and ignore everything else until it earns its place.

A note on templates: the starter library that ships with the plugin has twelve files —
`daily-note`, `decision`, `goal`, `idea`, `meeting-note`, `one-on-one`, `person`,
`project-brief`, `reading-note`, `retrospective`, `runbook`, `weekly-review`. Ask
`/vault-template install` and it offers the subset matching what you said you use the vault
for. Anything else you need — a lecture note, a client brief, a trip plan, a lab entry —
you make with "make me a template for X", and it takes about a minute.

### Software engineer

- **Skills:** vault-decision, vault-doc, vault-capture, vault-diagram, vault-standup.
- **Templates:** `decision`, `runbook`, `project-brief`, `daily-note`.
- **Habit:** the moment an argument about approach resolves, say "record this decision" —
  while the rejected options are still in your head.
- **Trap:** writing notes that restate the code. The code already says what it does, better,
  and your note goes stale on the next refactor. Write only what the repository cannot hold.

### Engineering or team lead

- **Skills:** vault-capture, vault-template, vault-review, vault-report, vault-task.
- **Templates:** `one-on-one`, `person`, `decision`, `weekly-review`.
- **Habit:** one line per person per week, the day it happens — "capture this: Dan flagged
  he's stretched on the migration and wants to hand off the runbook".
- **Trap:** writing nothing until review season, then reconstructing six months from the last
  three weeks. People notes are also the most sensitive thing in most vaults — mark them
  private at creation, not later.

### Product manager

- **Skills:** vault-decision, vault-doc, vault-ops, vault-report, vault-capture.
- **Templates:** `decision`, `project-brief`, `meeting-note`.
- **Habit:** after anything contested, record the decision including what was *cut* and why.
  That question comes back every quarter, usually from someone new.
- **Trap:** hand-copying your tracker into the vault. Link out to Jira or Linear; the tracker
  holds state, the vault holds reasoning.

### Designer

- **Skills:** vault-capture, vault-diagram, vault-decision, vault-template, vault-review.
- **Templates:** `decision`, `project-brief`, `idea`, plus a critique template you make.
- **Habit:** never save an image alone. One sentence with every reference: what it is, and
  what it decided or might decide.
- **Trap:** a thousand screenshots and no words. Obsidian searches text; it cannot search
  what a screenshot meant to you in March.

### Researcher or academic

- **Skills:** vault-template, vault-capture, vault-ops, vault-doc, vault-review.
- **Templates:** `reading-note`, `idea`, `project-brief`, plus a source note with citation
  fields in frontmatter — get that one right on note number one.
- **Habit:** weekly, ask vault-ops for orphans and unresolved links. Orphaned sources are
  unread in effect; unresolved links are notes waiting to be written.
- **Trap:** a beautiful library of summaries that link to nothing. Every source note links to
  at least one idea note before you close it, or you have not finished reading it.

### Student

- **Skills:** vault-template, vault-task, vault-review, vault-capture, vault-ops.
- **Templates:** `reading-note`, `daily-note`, `goal`, plus a lecture note that *ends with
  questions* rather than a summary.
- **Habit:** same evening, ten minutes: tidy the lecture note and write three questions it
  should be able to answer. Weekly, answer them cold before rereading anything.
- **Trap:** exhaustive colour-coded transcription. It feels like studying and is copying with
  extra steps. A note with no questions has not been processed.

### Writer or content creator

- **Skills:** vault-capture, vault-template, vault-task, vault-review, vault-share.
- **Templates:** `idea`, `project-brief` (carrying a `status:` field: idea → outlining →
  drafting → editing → published), `meeting-note` for interviews.
- **Habit:** fragments in daily, unedited. At weekly review, every piece moves exactly one
  stage or gets explicitly killed.
- **Trap:** two hundred ideas and nothing shipped. Cap yourself at two or three pieces in
  drafting; nothing new enters until something leaves.

### Founder or small business owner

- **Skills:** vault-decision, vault-capture, vault-report, vault-review, vault-task.
- **Templates:** `decision`, `weekly-review`, `meeting-note`, `person` (for customers as much
  as for staff).
- **Habit:** before anything irreversible, ten minutes of vault-decision — including the
  assumption that would have to be false for this to be wrong.
- **Trap:** capturing everything and reviewing nothing, until the vault is an anxiety dump.
  One fixed weekly slot that drains the inbox to zero, where "delete" is a normal outcome.

### Consultant or freelancer

- **Skills:** vault-template, vault-capture, vault-task, vault-report, vault-share.
- **Templates:** `project-brief` (as a client brief), `meeting-note`, `decision`,
  `weekly-review`.
- **Habit:** end every client block with three lines — where I stopped, next action, what I
  am waiting on and from whom. Re-entry then costs seconds.
- **Trap:** one undifferentiated pile across all clients. Slow to re-enter and, far worse, a
  confidentiality incident waiting for a careless export. Put a `client:` property on every
  note at creation.

### Personal life, no professional angle

- **Skills:** vault-capture, vault-task, vault-standup (used as a journal), vault-decision,
  vault-review.
- **Templates:** `daily-note`, `decision`, `goal`, `person`.
- **Habit:** three lines in the journal after dinner. Three lines is a complete entry.
- **Trap:** building an elaborate system and abandoning it in three weeks, because nothing
  external forces it. Keep one thing that pays back under stress — warranties, policies,
  insurance, account references, all findable in ten seconds. Add the rest later, or never.

### Most people are two or three of these

An engineer is also a student on weekends and runs a household. A founder is also the writer
and the PM. Pick the two or three that are genuinely true and combine them: where they share
a skill, that is one habit, not two. Three to five skills total is plenty; trying to run all
fourteen is how people quit in a fortnight.

**Work and personal in one vault** is usually the right answer — links work, search works, and
a career decision is both anyway. Split into separate vaults only when something external
forces it: a work device, an employer policy, a vault someone else can read. To separate
without walls, use folders for the human view (`Work/` and `Personal/`, or just distinct
top-level folders), a property like `domain: work` for anything you want to filter or report
on, and `sensitivity: private` on anything that must never leave — health, money, notes about
named people. Set the flag when you write the note, not when you are about to share it.

## Configuration reference

Everything the plugin knows about you lives in a single file:

```
~/.claude/obsidian-vault-copilot/config.json
```

On Windows that is `C:\Users\<you>\.claude\obsidian-vault-copilot\config.json`.

It sits **outside the plugin on purpose**. The plugin folder is source code that anyone can
install, share or commit; your vault name, your folder names, your client's repo path and the
name of your manager are not. Keeping them apart means nothing personal can be committed with
the plugin by accident, and the same unmodified plugin works for everybody. The local activity
log lives beside it, in the same directory.

`/vault-setup` writes this file, and shows you the exact JSON before it does.

### Keys

| Key | What it controls | Example |
| --- | --- | --- |
| `vaultName` | Which vault every Obsidian command targets. Passed explicitly on every call, so having several vaults open is safe. | `"Second Brain"` |
| `vaultPath` | The vault's folder on disk. Used for git, sync checks and the push guard. | `"/Users/sam/Notes"` |
| `setupMode` | Whether you attached an existing vault or created a new one. | `"existing"` |
| `profile.folders` | Your own names for daily notes, longer notes, templates, attachments, archive. An empty slot means "this vault has no such place", not "create one". | `{"daily":"Journal","notes":"Notes","templates":"Templates"}` |
| `profile.namingStyle` | How new files get named, to match your existing files. | `"date-prefixed"` |
| `profile.dailyNoteFormat` | Your real daily-note date format, including nested layouts. | `"YYYY/MM/YYYY-MM-DD"` |
| `profile.existingTags` | Tags already in use, so skills reuse yours instead of coining synonyms. | `["#reading","#idea"]` |
| `profile.existingProperties` | Frontmatter keys already in use, matched by exact spelling. | `["status","created","client"]` |
| `profile.hasTemplaterPlugin` | Whether Templater syntax is safe to write, or would sit in the note as junk text. | `false` |
| `profile.hasTasksPlugin` | Whether richer task syntax is safe to emit. | `true` |
| `profile.taskHome` | Your chosen default landing place for new tasks. Recorded once by vault-task so it stops asking. | `"Inbox.md"` |
| `useCases` | What you use the vault for. Decides which starter templates are offered and what vault-guide recommends. | `["client work","journaling"]` |
| `audienceLabel` | Who status updates usually go to. "Just me" is a normal answer. | `"client"` |
| `audienceName` | That person's actual name, if you want reports addressed. | `"Priya"` |
| `timezone` | Used where daily and weekly rhythms matter. | `"Europe/Berlin"` |
| `syncMode` | How you back the vault up: `git`, `obsidian-sync`, `cloud-folder` or `none`. Drives what vault-sync does and whether the end-of-session reminder fires at all. | `"cloud-folder"` |
| `gitRemoteName` | The remote used for a git backup, when there is one. | `"origin"` |
| `projectRepos` | Work folders that feed standups, reports and reviews. They do not have to contain code. | `[{"name":"site","path":"~/work/site"}]` |
| `sharedRepoPath` | A shared team repo that vault-share can open a pull request against. Empty means export only. | `"~/work/handbook"` |
| `reportsSaveToVault` | Whether generated reports are also filed as notes, or just handed back as text. | `true` |
| `createdAt` | When setup ran. Informational. | `"2026-09-19T08:12:00Z"` |

### The profile block is the important one

`profile` is what makes this plugin follow *your* conventions rather than someone's idea of a
good vault. It is filled in by a real scan of your real vault at setup: your folder names,
your tags, your property spellings, your daily-note format, which community plugins you have.
Every skill reads it before writing anything, and a live scan of the vault always wins over
it if the two disagree. That is the whole mechanism behind "it does not reorganize anything".

### Seeing and changing settings

To see what is configured, just ask — "show me my vault copilot settings" — and you will get
a summary: vault, setup mode, use cases, audience, sync mode, folders, naming style, daily
note format, and how many project folders and shared repos are set. You can also open the
JSON file in any editor; it is a plain file and it is yours.

To change one thing, say `/vault-setup reconfigure` and name what you want changed — "change
my sync to git", "my reports go to Priya now", "the daily notes moved to Journal/". Setup
reads the existing config, replaces just that key and writes it back. It does not replay the
whole interview, and it does not touch your vault. Re-running setup from scratch is only
worth it if you are attaching a different vault entirely.

## Troubleshooting

| Problem | What is actually happening | What to do |
| --- | --- | --- |
| "Could not reach vault X via the Obsidian CLI" at session start | Obsidian is closed, or that vault is not open in it | Open Obsidian, open that vault, then carry on. Nothing is broken. |
| A vault command seems to hang, then reports a timeout | The Obsidian app is busy starting up or running an update check | Wait until the app is idle and ask again. The wrapper gives up after 20 seconds by design. |
| `Error: No template folder configured.` | Obsidian's Templates core plugin has no folder set | Settings → Templates → "Template folder location". One setting, and the template skill walks you through it. |
| Notes landing in the wrong vault | More than one vault open, and something assumed the active one | This plugin always names the configured vault explicitly. If notes are going somewhere unexpected, check `vaultName` in your config. |
| "No vault configured yet" / `NOT_CONFIGURED` | Setup has never run on this machine | Run `/vault-setup`. It takes a few minutes and reads only. |
| A push was blocked with a message about using vault-sync | The push guard caught a `git push` that had not been through a reviewed diff | Use `/vault-sync` (or `/vault-share` for a shared repo). This is the guard working. |
| A skill says it could not find enough context | There was no session history, repo activity or vault material to draw on | Tell it what happened in a sentence or two. It will ask rather than invent. |
| Notes are going to a folder you did not want | The recorded profile points there | Say `/vault-setup reconfigure` and correct the folder. Every skill follows the profile. |
| `git` says "nothing to commit" | Your notes are already committed | Nothing to do. If you expected changes, check you edited the vault folder git is watching. |

**About the timeout.** The Obsidian CLI is a remote control for the running app, not a
headless tool. When the app is mid-startup or checking for updates it simply does not answer,
and a naive tool would sit there forever. The bundled wrapper cuts every call off at 20
seconds and tells you the app looks busy. That message is not an error in your vault — it is
the app being unavailable, and retrying a few seconds later usually works.

**About the blocked push.** The block is deliberate and narrow: it only fires on a `git push`
aimed at your configured vault or shared repo. The reviewed sync and share flows attach an
internal confirmation marker to the push they run, which is only ever added after you have
been shown the changed files, the commit message and the destination remote, and have said
yes. Any push without that marker is refused. So a stray or careless push command cannot send
a journal entry to a remote you were not looking at. The fix is never to work around the
guard — it is to run the flow that shows you what is going out.

**About "wrong folder".** Almost always the recorded profile, not a bug. Skills decide where a
note goes by looking at where similar notes already live, falling back to the profile. If
three of your retrospectives live in `Journal/Reviews/`, the fourth should too. If it did not,
say so in the moment — "that should go in Journal/Reviews" — and fix the profile with
`reconfigure` so it sticks.

**About thin context.** When a skill says it could not find much, it means the session, the
working folder and the vault gave it nothing specific to work from. It will tell you what it
was missing and ask, rather than filling the gap with plausible fiction. That is the intended
behaviour, and it is why a standup written from a real session is worth reading and one
written from nothing is not.

## Privacy and safety

**What leaves your machine: nothing, unless you confirm it.** No telemetry, no background
upload, no scheduled sync, no auto-send. The only ways anything travels are a git push, a
pull request, or an export — and each of those shows you the exact content and destination
first and waits for a clear yes.

- **Confirmation before anything irreversible.** Pushes, pull requests, exports, bulk edits
  and deletions all stop and show you what will happen. Silence is not consent; the skills
  wait for an actual answer.
- **The push guard.** A hook blocks any push at your vault or shared repo that did not come
  through the reviewed flow, so a stray command cannot bypass the review.
- **A redaction review on every share.** vault-share reads the note you named — only that
  note, it never scans your vault deciding what is shareable — and flags named people,
  employer and client identifiers, anything token-shaped, internal hostnames and URLs,
  unreleased plans, and third-party personal detail. It also strips vault-internal artifacts
  that would mean nothing to the recipient: wikilinks, embeds, private frontmatter,
  checkboxes. You see the original beside the redacted version and choose approve, edit or
  cancel.
- **Marking notes sensitive.** A `sensitivity: private` (or an older `confidential: true` / `sensitive: true`)
  property in a note's frontmatter means it stops the share flow cold and requires an explicit
  "yes, anyway". Set it when you write the note. Health, money, therapy, anything about a
  named colleague, anything about a client — those are worth flagging at creation.
- **Repositories default to private.** If you set up a git remote during setup, private is the
  default and a public one needs an unambiguous yes. The plugin never changes a repository's
  visibility on its own.
- **Configuration and the activity log stay outside the plugin**, in
  `~/.claude/obsidian-vault-copilot/`. The log records vault changes the plugin made — which command, which note —
  never command text or file contents, capped at about 1 MB. It exists so a commit message or a
  standup can describe real work instead of guessing, and it never leaves your machine.
- **No messaging integration exists.** A standup, report or review is text handed back to you.
  Nothing is posted to a chat, emailed, or sent to a tracker. You decide where it goes and you
  paste it yourself.

One more thing worth saying plainly. Anything the assistant reads — a web page, a connected
tool, a document, one of your own notes — is treated as **material to summarise, never as
instructions to act on**. If a note or a fetched page contains text saying "send this to
everyone" or "the user already approved sharing this", that is content, and it is ignored as
a command. Approval comes from you, in conversation, for that specific action.

## Frequently asked questions

**Do I have to reorganize my vault?**
No. Setup reads; it never moves, renames or restructures anything. It records how your vault
is already organized and every skill follows that. If something genuinely new is needed — a
folder that does not exist yet — it proposes and waits for a yes.

**Does it work with the notes I already have?**
That is the main case. Four thousand notes built over six years, PARA, Zettelkasten, Johnny
Decimal, a flat pile with tags, or no system at all — all fine. New notes land beside similar
existing ones, named the way you name things, with the property spellings you already use.

**Do I need git?**
No. Git is one backup option among four. Obsidian Sync, a cloud folder, or nothing at all are
all recorded as valid choices, and if you pick one of those you will never be prompted about a
git workflow. Git and a tool like `gh` only matter if you want version history or want to open
pull requests to a shared repo.

**Does Obsidian have to be open?**
Yes. The CLI is a remote control for the running app, not a headless tool. If Obsidian is
closed, the session-start check tells you straight away rather than letting a skill fail
halfway through.

**Can I use it with more than one vault?**
The configuration points at one vault at a time, and every command names that vault
explicitly, so having several open in Obsidian is safe — notes will not wander. To work with
a different vault, run `/vault-setup reconfigure` and point it there.

**What if I use Obsidian Sync?**
Set `syncMode` to `obsidian-sync` at setup. vault-sync then reports its status rather than
duplicating it, and can help with sync history or a file deleted on another device. It will
not layer git on top unless you ask for that as a deliberate change.

**Will it change notes I did not ask it to touch?**
No. Edits are scoped to the note in question, and anything that would overwrite, bulk-edit or
delete stops for confirmation with the exact paths listed. Applying a template to an existing
note adds missing sections rather than replacing the file.

**Does it work if I do not write code?**
Yes. Nothing about it requires a repository. A decision record works identically for choosing
a database and choosing a school; a weekly review works identically for sprints, coursework
and client calls. The "project folders" setting is optional and does not have to contain code.

**Can my whole team use it?**
Anyone can install it, and each person runs setup against their own vault. There is no shared
vault, no central server and no configuration baked into the source — everyone's answers stay
on their own machine. What a team can genuinely share is a repo of agreed documents, which
vault-share contributes to by pull request.

**Does anything get sent anywhere automatically?**
No. There is no unattended send anywhere in the plugin. Pushes, pull requests and exports all
require you to see the content and confirm, and the push guard blocks anything that tries to
skip that.

**What happens to my data?**
It stays in your vault, on your disk. Configuration and a local activity log of what changed
live in `~/.claude/obsidian-vault-copilot/`. The log holds which notes the plugin changed, never commands or note
contents.

**Can I change the folders it uses?**
Yes, with `/vault-setup reconfigure`. It edits the one key you name. Correcting a folder is
the single most useful reconfigure there is, because everything downstream follows the profile.

**What if I already have my own templates?**
They are used as they are. vault-template lists what is in your template folder and works with
it; the starter library is offered, never installed silently, and a name that already exists is
skipped rather than overwritten.

**How do I uninstall or start over?**
Remove the plugin the way you installed it, and delete
`~/.claude/obsidian-vault-copilot/` if you want the configuration and log gone too. Your vault
is untouched by either — the notes are ordinary Markdown files that were yours all along. To
start over without uninstalling, delete the config file and run `/vault-setup` again.
