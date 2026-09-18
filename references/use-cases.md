# Use-case recipes

Concrete starting workflows for real people, so **vault-guide** can hand someone a rhythm instead of a
feature list.

**How to use this file (for the assistant):** read only the one or two sections that match the person in
front of you. Never paste a section wholesale — pull the starting workflow, the templates and the trap,
and say them in your own words with their vocabulary. Folder shapes here are suggestions for someone
starting from nothing. If a vault already exists, run `vault-profile.mjs scan` and fit the person's real
folders and tags instead; propose one new folder at most, and only when nothing existing fits.

Template names below refer to the starter library at `${CLAUDE_PLUGIN_ROOT}/references/templates/`.
**vault-template** lists what is actually installed there — trust that list over these names if they differ.

Most people are two or three of these at once. Read **Mixing personas** at the end before advising anyone
who says "work and personal, both."

---

## 1. Software engineer / developer

**What they actually need.** The *why* behind code, because the code itself already records the *what*.
Six months later the diff is still there and the reasoning is gone — including the three approaches that
were tried and abandoned, which is the part that costs the most to rediscover.

**Starting folder shape (optional).**
`Projects/<project>/` · `Decisions/` · `Notes/` · `Daily/` · `Templates/`

**Skills that matter most**
- **vault-doc** — write up what was just built, straight from the session context: files touched, what
  broke, what the fix actually was. Best used while the session is still warm.
- **vault-decision** — record a technical choice with the options that lost and why. This is the highest
  value note an engineer writes.
- **vault-capture** — the "this is weird, look into it later" thought, without leaving the terminal.
- **vault-diagram** — a sequence or flow diagram when prose stops being enough to explain a data path.
- **vault-standup** — reconstruct yesterday from real activity instead of memory.

**Templates worth installing:** `decision-record`, `debug-log`, `runbook`, `daily-note`, `project-brief`.

**A week in the life.** Morning: vault-standup rebuilds yesterday from commits and open tasks. During
work: vault-capture for stray observations; vault-decision the moment an argument about approach
resolves. After a substantial change: vault-doc while the context is live. Friday: vault-review turns the
week's notes into what is actually still open.

**The trap.** Writing documentation that restates the code — a note explaining what the function does,
which the function already does better and which goes stale on the next refactor. The vault fills with
prose nobody, including its author, ever reads again.
**The habit that prevents it:** write only what the repository cannot hold — the rejected option, the
constraint that forced the shape, the bug that took four hours and its actual cause.

---

## 2. Engineering or team lead

**What they actually need.** Two separate memories that most tools collapse into one: a per-person thread
that accumulates over months (context, commitments, growth, things said in a 1:1 twelve weeks ago), and a
delivery picture they can report upward without doing archaeology first.

**Starting folder shape (optional).**
`People/<name>/` · `Team/` · `Projects/` · `Decisions/` · `Reports/` · `Daily/` · `Templates/`

**Skills that matter most**
- **vault-template** — a 1:1 note and a team-update note. Consistent structure is what makes a person's
  notes readable as a thread rather than a pile.
- **vault-capture** — one line about a person the day it happens. This is the whole discipline.
- **vault-report** — the upward or outward update, drawn from the week that actually occurred.
- **vault-review** — weekly on delivery, monthly on people.
- **vault-task** — commitments made *to* people, which are the easiest to drop and the worst to drop.

**Templates worth installing:** `one-on-one`, `person-note`, `team-update`, `decision-record`,
`weekly-review`.

**A week in the life.** As things happen: a line into the relevant person's note — a good call they made,
a concern, something they asked for. Before each 1:1: reread that person's last two notes, so the
conversation continues instead of restarting. Friday: vault-review across delivery, then vault-report for
whoever needs it. Monthly: reread all the People notes together — patterns show up there that never show
up in any single week.

**The trap.** Writing nothing until review season, then reconstructing six months from the last three
weeks. The result is recency-biased feedback that the person can feel is unfair, and the lead cannot
defend it because there is nothing behind it.
**The habit that prevents it:** one line per person per week, written the day it happens, even when
nothing dramatic occurred. Especially then.

**Sensitivity.** People notes are usually the most sensitive content in any vault. Mark them (a
`sensitivity: private` property or a tag), keep them out of anything shared, and confirm explicitly before
any report or export touches that folder.

---

## 3. Product manager

**What they actually need.** Decision provenance across many stakeholders, and specifically the record of
what was *cut* and why — because that question returns every quarter, usually from someone new, usually
in a meeting.

**Starting folder shape (optional).**
`Products/<area>/` · `Decisions/` · `Research/` · `Meetings/` · `Reports/` · `Templates/`

**Skills that matter most**
- **vault-decision** — the trade-off, the options rejected, who was in the room, what would change the
  answer. The most reusable artifact a PM produces.
- **vault-doc** — briefs and specs, written from a real conversation rather than a blank page.
- **vault-ops** — search before deciding: "have we already argued about this?" usually returns yes.
- **vault-report** — the same week, retold for a different audience at a different altitude.
- **vault-capture** — customer or stakeholder quotes, verbatim, before they get paraphrased into mush.

**Templates worth installing:** `decision-record`, `project-brief`, `meeting-note`, `stakeholder-update`,
`customer-feedback`.

**A week in the life.** During meetings: vault-capture for decisions and verbatim quotes. After anything
contested: vault-decision, while people still remember their own reasoning. When a doc is requested:
vault-doc from the notes already there. End of week: vault-report, versioned for the audience — team,
leadership, or customer-facing.

**The trap.** The vault becomes a second, worse copy of Jira/Linear/Asana — epics duplicated by hand,
permanently three days stale, trusted by nobody including its author.
**The habit that prevents it:** link out to the tracker; write only what the tracker structurally cannot
hold. Tickets hold state. The vault holds reasoning.

---

## 4. Designer

**What they actually need.** A rationale trail attached to visuals, feedback surviving across many
rounds, and a personal pattern library that can be searched by the problem it solved — not by what the
screenshot happens to look like.

**Starting folder shape (optional).**
`Projects/<project>/` · `Patterns/` · `Critiques/` · `Inspiration/` · `Attachments/` · `Templates/`

**Skills that matter most**
- **vault-capture** — a screenshot or reference with one line of why it is here. The line is the point.
- **vault-diagram** — user flows and journeys as Mermaid; Canvas when the thinking is genuinely spatial
  and a linear note would flatten it.
- **vault-decision** — why this pattern over the other one, so round four does not relitigate round one.
- **vault-template** — a critique note and a design-review note, so feedback arrives in a comparable shape
  every time.
- **vault-review** — monthly pass over `Inspiration/`, promoting what actually gets reused into `Patterns/`.

**Templates worth installing:** `design-critique`, `decision-record`, `project-brief`, `user-flow`,
`research-synthesis`.

**A week in the life.** Ongoing: references and screenshots captured with a sentence each. After a
critique: the critique note, separating what was asked for from what was actually said. When a direction
is chosen: vault-decision, with the alternatives attached. Monthly: prune inspiration, promote patterns.

**The trap.** A folder of a thousand images and no words — completely unsearchable, because Obsidian can
search text and cannot search what an image meant to you in March.
**The habit that prevents it:** never save an image alone. One sentence: what it is, and what it decided
or might decide.

---

## 5. Researcher or academic

**What they actually need.** Source notes that stay trustworthy for years and can be recombined into
writing later, with provenance solid enough to cite without reopening the PDF.

**Starting folder shape (optional).**
`Sources/` · `Ideas/` · `Projects/<paper>/` · `Methods/` · `Daily/` · `Templates/`

**Skills that matter most**
- **vault-template** — a source note with citation fields in frontmatter (author, year, venue, DOI/URL).
  Get this right on note one; retrofitting 300 sources is a real, awful afternoon.
- **vault-capture** — a claim or objection the moment it occurs, linked to its source.
- **vault-ops** — `backlinks`, `unresolved` and `orphans` are the actual research instruments here: they
  show which ideas are load-bearing and which sources are inert.
- **vault-doc** — synthesis: pull every note linked to one claim and draft the section.
- **vault-review** — monthly consolidation, which is where a literature pile turns into an argument.

**Templates worth installing:** `source-note`, `literature-review`, `experiment-log`,
`research-synthesis`, `idea-note`.

**A week in the life.** Reading: one source note per source, in the same shape every time, each ending
with "what this changes for my argument." Thinking: idea notes that link to sources, not the reverse.
Weekly: run `orphans` and `unresolved` — orphaned sources are unread-in-effect, unresolved links are
notes waiting to be written. Monthly: synthesis draft from the linked cluster.

**The trap.** A beautifully complete library of summaries that link to nothing. It is a pile, not a graph,
and a pile answers no question you did not already know to ask.
**The habit that prevents it:** every source note must link to at least one idea or claim note before you
close it. If it links to nothing, you have not finished reading it.

---

## 6. Student

**What they actually need.** Retention and exam performance. Notes here exist to be *re-read and tested
against*, not to be complete. Completeness is the failure mode, not the goal.

**Starting folder shape (optional).**
`Courses/<course>/` · `Lectures/` · `Assignments/` · `Exams/` · `Daily/` · `Templates/`

**Skills that matter most**
- **vault-template** — a lecture note that *ends with questions*, not with a summary. This single
  structural choice does most of the work.
- **vault-task** — deadlines, readings, submissions, with due dates that surface.
- **vault-review** — weekly: answer last week's questions from memory before rereading anything.
- **vault-capture** — the thing you did not understand in the lecture, captured before it dissolves into
  vague unease.
- **vault-ops** — search across courses; the overlaps between two courses are where the exam questions
  live.

**Templates worth installing:** `lecture-note`, `reading-note`, `assignment-tracker`, `exam-prep`,
`concept-note`.

**A week in the life.** In class: capture roughly; do not beautify. Same evening (10 minutes): clean up,
and write three questions the note should be able to answer. Weekly: attempt those questions cold, then
check — the gap between what you thought you knew and what you could produce is the entire study plan.
Before exams: vault-ops to pull every concept note for a topic into one sheet.

**The trap.** Gorgeous, color-coded, exhaustively transcribed notes that are never opened again.
Transcription feels like studying and is not; it is copying with extra steps.
**The habit that prevents it:** every note ends with questions, and weekly review means answering them
from memory first. If a note has no questions, it has not been processed.

---

## 7. Writer or content creator

**What they actually need.** A pipeline with visible stages, a place for fragments that are not yet
anything, and research that can be reused across pieces instead of re-gathered each time.

**Starting folder shape (optional).**
`Pieces/` · `Ideas/` · `Research/` · `Fragments/` · `Published/` · `Templates/`

**Skills that matter most**
- **vault-capture** — lines, openings, overheard phrases. Fast and unjudged; friction here kills the habit.
- **vault-template** — a piece brief carrying `status:` in frontmatter (idea → outlining → drafting →
  editing → published), which is what makes the pipeline visible at all.
- **vault-task** — commitments with dates: pitches, deadlines, follow-ups.
- **vault-review** — weekly: what moved a stage, what has been stuck in "drafting" for a month and needs
  either work or a burial.
- **vault-share** — export a finished draft out to wherever it actually gets published.

**Templates worth installing:** `content-brief`, `idea-note`, `interview-note`, `research-note`,
`publishing-checklist`.

**A week in the life.** Daily: fragments in, no editing. Weekly: promote two or three fragments to ideas,
one idea to a brief. Drafting happens in the vault or elsewhere — either is fine, but status lives in the
vault. Weekly review moves every piece exactly one stage or explicitly kills it.

**The trap.** Two hundred ideas and nothing shipped. The vault becomes a very comfortable place to feel
productive without publishing anything, and capture becomes the substitute for writing.
**The habit that prevents it:** a WIP limit enforced at weekly review — at most two or three pieces in
`drafting` at once. Nothing new enters drafting until something leaves.

---

## 8. Founder or small business owner

**What they actually need.** One place holding company decisions, customer signal, money, and their own
head — because there is no colleague to ask what happened in March and no institutional memory but
theirs.

**Starting folder shape (optional).**
`Company/` · `Customers/` · `Decisions/` · `Finance/` · `Product/` · `Weekly/` · `Templates/`

**Skills that matter most**
- **vault-decision** — decisions with real money and real irreversibility attached. Write down what you
  believed at the time; that is what makes a later post-mortem honest rather than retrospective fiction.
- **vault-capture** — customer signal verbatim. Paraphrased feedback quietly becomes what you wanted to
  hear.
- **vault-report** — the same month for investors, an advisor, a partner, or yourself. Very different
  documents from the same underlying week.
- **vault-review** — weekly. For a founder this is often the only structural pause that exists at all.
- **vault-task** — obligations that have consequences: filings, renewals, promises to customers.

**Templates worth installing:** `decision-record`, `customer-feedback`, `investor-update`,
`weekly-review`, `meeting-note`.

**A week in the life.** All week: capture — customer calls, competitor moves, half-ideas, worries. Before
anything irreversible: vault-decision, ten minutes, with the assumption that would have to be false for
this to be wrong. Weekly: vault-review, inbox to zero, three priorities named. Monthly: vault-report for
whoever is owed one, including yourself.

**The trap.** Capturing everything and reviewing nothing. The vault becomes an anxiety dump — a growing
pile of unprocessed worry that is now both unhelpful *and* a source of guilt every time it is opened.
**The habit that prevents it:** a fixed weekly slot that drains the inbox to zero, where "delete" is a
legitimate and common outcome. Capture without review is worse than not capturing.

---

## 9. Consultant or freelancer

**What they actually need.** Fast context re-entry after switching clients, defensible evidence of what
was delivered when, and hard isolation so one client's material can never surface in another client's
document.

**Starting folder shape (optional).**
`Clients/<client>/` (engagement, meetings, deliverables, invoices inside) · `Business/` · `Methods/` ·
`Templates/`

**Skills that matter most**
- **vault-template** — a client brief and an engagement note, identical for every client, so re-entry
  costs seconds instead of an hour.
- **vault-capture** — decisions, scope changes and out-of-scope requests as they are said. Scope creep is
  a documentation problem before it is a money problem.
- **vault-task** — per-client commitments with dates, filtered by client.
- **vault-report** — a per-client status update, which doubles as the justification attached to an
  invoice.
- **vault-share** — send deliverables out, with a check first that nothing from another engagement came
  along.

**Templates worth installing:** `client-brief`, `engagement-log`, `meeting-note`, `deliverable-note`,
`invoice-summary`.

**A week in the life.** Starting a client block: open that client's brief and its last re-entry note —
this is the whole trick. Ending a block: three lines — where I stopped, next action, what I am waiting on
and from whom. Weekly: one report per active client. Monthly: what was billable versus what was actually
spent, which is usually an uncomfortable number and the most valuable one.

**The trap.** One undifferentiated pile of notes across all clients. It is slow to re-enter and, far
worse, it is a confidentiality incident waiting for a careless export — client A's numbers in client B's
deck.
**The habit that prevents it:** a `client:` property on every single note plus a folder per client, set at
creation and never retrofitted. Before any vault-share or export, confirm every included note carries the
right client.

---

## 10. Personal life (no professional angle)

**What they actually need.** Low friction and a visible payback, because this is the only domain where
nothing external forces the notes to exist. Household admin, health, family, money, hobbies, travel — plus
a place to think that is not a phone notes app with 400 untitled entries.

**Starting folder shape (optional).**
`Journal/` · `Home/` (documents, warranties, policies, accounts) · `Health/` · `People/` · `Money/` ·
`Travel/` · `Projects/` (hobbies, renovations, learning) · `Templates/`

**Skills that matter most**
- **vault-capture** — the errand, the gift idea, the thing the doctor said, the name of the paint colour.
- **vault-task** — renewals, appointments, repairs; the recurring things that are individually trivial and
  collectively exhausting.
- **vault-standup** — used as a daily journal: what happened, how it went, what is on my mind. Three lines
  is a complete entry.
- **vault-decision** — the genuinely big ones: a move, a job change, a large purchase, a medical choice.
  Reading your own reasoning back a year later is unreasonably valuable.
- **vault-review** — monthly rather than weekly. Personal life has a slower cadence, and weekly review
  here usually collapses within a month.

**Templates worth installing:** `daily-journal`, `trip-plan`, `health-log`, `decision-record`,
`home-record`, `habit-tracker`.

**A week in the life.** Evening: three lines in the journal, attached to something that already happens —
after dinner, before bed. As they occur: errands and renewals as tasks. When something official arrives:
straight into `Home/` with the date, the reference number and where the paper copy is. Monthly: a slow
read of the journal, and one honest paragraph about how the month went.

**The trap.** It starts as an elaborate personal productivity system and is abandoned in three weeks,
because nothing in personal life enforces it the way a job does.
**The habit that prevents it:** keep exactly one thing that pays back under stress — warranties, policies,
insurance, medical history, account details, all findable in ten seconds. The day that saves an hour is
the day the vault stops being a project and starts being infrastructure. Everything else can be added
later.

---

## Mixing personas

Almost nobody is one of these. An engineer is also a student on weekends and runs a household. A founder
is also the writer, the PM and the designer. Advise for the two or three that are real, not the one that
sounds most impressive.

**Combine skills, do not stack workflows.** Two personas that share a skill share it — one vault-capture
habit, not two. Recommend three to five skills total across all of someone's roles. Five is already a lot;
fourteen is a guaranteed abandonment.

**Keeping work and personal in one vault.** One vault is usually right: links work, search works, and the
boundary between "life" and "work" is fake anyway — a career decision is both. Separate vaults only when
something external forces it (a work device, an employer policy, a shared or synced vault someone else can
read). Say this plainly rather than defaulting to separation.

**Separating without walls.**
- **Folders** are the primary separation, because they are visible and make export decisions obvious.
  A top-level split (`Work/` and `Personal/`, or just distinct top-level folders per area) is enough.
- **A property** on every note — `domain: work` / `domain: personal`, or `client: <name>` — is what makes
  filtering, reporting and bases queries reliable. Folders are for humans; properties are for queries.
- **A sensitivity flag** — `sensitivity: private` — on anything that must never leave: health, finances,
  notes about named people, therapy, family matters, anything about a colleague. Set it at creation.

**What to be careful about when reporting or sharing.** Every skill that produces something leaving the
vault — **vault-report**, **vault-share**, **vault-sync** to a remote, any export — must:
1. State which notes and folders it read, before producing anything.
2. Exclude `sensitivity: private` and personal folders by default, and say so out loud rather than
   silently.
3. For multi-client work, confirm every included note carries the same `client:` value.
4. Show the final text and get an explicit yes before anything is sent, pushed, published or opened as a
   pull request.

The realistic failure is not dramatic. It is a weekly report generated from "everything I touched this
week," quietly including a line from a 1:1, a medical appointment, or another client's numbers — and
nobody notices until the person on the receiving end does.
