---
name: vault-decision
description: Record a decision and its trade-offs as a note — a technical architecture decision, a product or process choice, or a personal or life decision. Use when someone says document this decision, write an ADR, record why we chose this, capture the trade-offs, or wants a record of how a choice was made.
argument-hint: "[what was decided]"
---

# Vault Decision

A decision note exists so that a future reader — usually the person who wrote it — can tell
**why** a choice was made, not just what it was. Capture the reasoning while it is still warm.

## 1. Resolve config first

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/config.mjs" summary
```

If it prints `NOT_CONFIGURED`, stop and tell the user to run vault-setup. Never guess a vault.
Read the conventions in vault-ops if you have not this session.

## 2. Harvest the reasoning before asking for it

If the decision was just argued through in this conversation, **that reasoning is the record**.
Write it up and show it for correction — do not make the user restate what they already said.

- Decision came out of code, config, or repository work → run the **context-harvester** subagent,
  or `node "${CLAUDE_PLUGIN_ROOT}/scripts/session-context.mjs" harvest` for the raw digest:
  recent prompts, files touched, repo state. See
  `${CLAUDE_PLUGIN_ROOT}/references/session-context.md`, which also covers pulling context from
  connected tools when any are available in the session.
- Decision came out of reading, a conversation, or thinking aloud → the transcript is enough.
- Search the vault for prior art before writing: `search:context query="<topic>" format=json`
  via the wrapper. An earlier note on the same question changes what you write.

Then ask only for what is genuinely missing — usually the option that was rejected and why.
**Two real options beat four invented ones.** Never pad the note to fill a template; write
"only one option was seriously on the table" if that is the truth.

## 3. Pick the mode from context

Both modes share one spine. The difference is tone and which criteria matter.

| | Technical / professional | Personal |
|---|---|---|
| Covers | architecture, tooling, vendor, process, hiring, pricing | a job offer, a move, a big purchase, health, family, study |
| Criteria | cost, complexity, reversibility, maintenance, team skill, risk | money, time, energy, relationships, values, what it forecloses |
| Voice | neutral and precise | first person and honest |

Choose from context; if genuinely ambiguous, ask in one line. A freelancer choosing a contract
and an engineer choosing a queue get the same rigor.

## 4. The spine

1. **Context** — the situation, and specifically **what forced a choice now**. A decision with no
   forcing function is usually a preference; say so if that is the case.
2. **Options considered** — the real alternatives, including doing nothing. A few lines each.
3. **Trade-offs** — what each option costs and buys, concretely. "Slower writes but no extra
   service to run" and "closer to family but a 20% pay cut" are useful; "pros and cons" is not.
4. **Decision** — the call, in one sentence, in plain words.
5. **Consequences** — what this commits to, and **what would make us revisit it**. Name the signal:
   a number, a date, a change in circumstances.

For personal decisions add two more, because they are what make an old decision legible later:

6. **What I was optimizing for** — the single thing that outranked the rest.
7. **How I felt about it** — relief, dread, a coin-flip. Future readers need this; it is the part
   memory rewrites first.

## 5. Write it

**If the decision belongs to a recorded project** — check `profile.projects` for one whose name
matches the conversation (or ask, if more than one plausibly fits) — write into that project's
`decisions` section (`project.sections` maps a folder name to a kind id; the folder holding
`"decisions"` as its value is where this goes), matching that kind's recorded `naming` pattern
(`profile.kinds.decisions.naming`, e.g. dated filenames). This is what makes the note show up in
that project's own history instead of scattered at the vault root.

**Otherwise** follow the vault's general structure — check `config.profile.folders` and, when
unsure, run `node "${CLAUDE_PLUGIN_ROOT}/scripts/vault-profile.mjs" scan` to see where similar
notes already live and how they are named (its `detectedProjects` may find a pattern
`profile.projects` hasn't recorded yet — if so, mention `vault-project` can record it). Propose a
new folder only when nothing fits, and say why first. If the vault has a decision template, prefer
it (`template:read`, then vault-template).

Suggested frontmatter, matched to keys the vault already uses (`properties`, `tags`):

```yaml
type: decision
domain: <work area or life area>
status: proposed | accepted | superseded
date: YYYY-MM-DD
tags: [decision, ...]
sensitivity: public | internal | private
```

Reuse an existing tag over minting a near-duplicate. Create with the wrapper:
`create path=<note> content="..."` (use `unique` if the name may collide).

## 6. Small decisions get small records

If the choice is small — which library for a throwaway script, which dentist, which of two
weekend plans — offer three or four lines in the vault's dated log instead of a full record:

- If `profile.dailyNotes` is `"used"`, append to today's daily note:
  `node "${CLAUDE_PLUGIN_ROOT}/scripts/obsidian-cli.mjs" daily:append content-file=<tmp.md>`
- Otherwise append to the dated note or log the vault already uses for this area (a project's
  updates log, for example). Never call a `daily:*` verb in a vault without daily notes — it
  creates a stray note, and the wrapper refuses it.

Do not force a full record on a small choice. Ask if you cannot tell which size it is.

## 7. Link, supersede, never delete

- Link related decisions with `[[wikilinks]]`, then confirm with `backlinks path=<note>`.
- Superseding an earlier decision:
  1. `property:set name=status value=superseded path=<old>`
  2. `append path=<old> content="Superseded by [[new-note]] — <one line on what changed>"`
  3. In the new note, write `Supersedes [[old-note]]`.
  History stays. A reversed decision is one of the most valuable notes in a vault.

## 8. Sensitive decisions

Set `sensitivity: private` when the note touches someone else's private information, money,
health or relationships; `sensitivity: internal` for unreleased plans or security details that
may circulate inside a team but no further. vault-share hard-stops on `private` and warns on
`internal`. When in doubt, mark it and say you did. (If `profile.sensitivityProperty` names a
different key, use that key.)

## 9. Update the project hub, if there is one

When the decision landed inside a recorded project (step 5) and that project has a `hub` note,
offer — do not do it unasked — to add a line linking the new decision from the hub, the same way
the hub already links its other sections. Show the exact line before appending it. Skip this for a
vault-root decision with no project, and skip it if the hub already looks hand-curated in a way
your one line would clutter (many short unlinked items vs a few careful ones) — ask instead.

## 10. Close the loop

Show the finished note, confirm the path, and offer the natural next step: a related task
(vault-task), a diagram if the decision has shape (vault-diagram), or committing it (vault-sync).
