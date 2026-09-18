---
name: vault-standup
description: Produce a daily standup or check-in — what was done, what is next, what is blocked — assembled from the current session, repository activity, connected tools, and the vault tasks and notes. Use when someone asks for their standup, daily update, what did I do yesterday, or what they are working on today.
argument-hint: "[weekly]"
shell: bash
---

# Daily standup / check-in

A standup is a short honest answer to three questions: what moved, what is next, what is stuck. The
person may be on a dev team, running their own business alone, studying for exams, or keeping a
household on track — the three questions hold, only the vocabulary changes.

## 1. Resolve config first

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/config.mjs" summary
```

If it prints `NOT_CONFIGURED`, tell the user to run the `vault-setup` skill and stop. Never guess a
vault. Read `audienceLabel`, `useCases`, `profile.folders.daily`, and `projectRepos` — they decide
the tone, the vocabulary, and how wide to cast for activity.

## 2. Gather, in this order, and stop when you have enough

**(1) What you already know.** If this skill runs inside a working session, the conversation is the
best source and costs nothing: what was attempted, what landed, what was abandoned and why, what the
user said they would do next. Mine it before running anything.

**(2) The session and local repository.**

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/session-context.mjs" harvest
node "${CLAUDE_PLUGIN_ROOT}/scripts/git-helpers.mjs" recent-activity .
```

Or launch the **context-harvester** subagent when the picture is bigger than one directory — it
returns a digest instead of flooding this conversation with raw output. See
`${CLAUDE_PLUGIN_ROOT}/references/session-context.md`.

**(3) Several projects.** If `projectRepos` is configured with more than one entry, hand the list and
the time window to the **activity-collector** subagent rather than looping over repositories inline.

**(4) Connected tools.** Discover what is actually connected in this session — an issue tracker,
chat, calendar, task service, docs tool — and use it if it is there. Do not assume any particular
tool exists, and do not name one the user has not connected. Say which tool you are querying and for
what window before you pull from it. If nothing is connected, skip this silently.

**(5) The vault itself.** Always worth a pass, and often enough on its own:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/obsidian-cli.mjs" daily:path
node "${CLAUDE_PLUGIN_ROOT}/scripts/obsidian-cli.mjs" daily:read
node "${CLAUDE_PLUGIN_ROOT}/scripts/obsidian-cli.mjs" tasks status=done
node "${CLAUDE_PLUGIN_ROOT}/scripts/obsidian-cli.mjs" tasks status=todo
node "${CLAUDE_PLUGIN_ROOT}/scripts/obsidian-cli.mjs" search:context query="blocked" format=json
```

Read the previous working day's daily note (not only today's), plus notes and decisions created or
edited in the window. Full command catalog: `${CLAUDE_PLUGIN_ROOT}/references/obsidian-cli.md`.

**If nothing is configured beyond the vault and no tools are connected, this still works.** The
conversation plus the vault is a complete source. Never block on missing integrations, and never
apologise for them in the output.

## 3. Assemble the update

Three sections, in whatever words fit the person and their audience:

| Section | Dev team | Solo / freelance | Student | Personal |
| --- | --- | --- | --- | --- |
| Done | Yesterday | Since last check-in | Studied | Handled |
| Next | Today | Focus today | Next session | Today |
| Blocked | Blockers | Waiting on | Stuck on | Stuck / waiting |

Rules that matter more than the format:

- **Only real, specific items.** Name the thing: the feature, the chapter, the form, the person. Cut
  anything that would be true on any day — no "continued work on", no "making progress".
- **Group by outcome, not by commit or file.** Several commits on one thing are one line.
- **Under a minute read aloud.** Roughly three to five items for done, one to three for next.
- **A quiet day is a valid answer.** Say it was quiet, or that the day went to one thing, rather than
  inflating it. Ask the user if something happened away from the tools.
- **Blockers deserve real attention.** Surface anything tagged or marked blocked, anything open and
  untouched for a while, anything waiting on another person or an external answer, and anything the
  session showed the user hit and worked around. For each one say who or what it is waiting on, since
  when, and what would unblock it. Omit the section entirely only if there is genuinely nothing.

## 4. With the `weekly` argument

Keep the same three sections for the day, then add a **look-ahead** built from upcoming task due
dates, open decisions still awaiting a call, anything that slipped and is now at risk, and calendar
commitments if a calendar tool is connected. Frame it as intent for the coming week, not a promise
list, and keep it to three or four lines.

## 5. Deliver it

1. Print the update in chat, formatted so the user can copy it straight out.
2. Append it to today's daily note under a stable `## Standup` heading (use the vault's own heading
   name if one is already in use there, from the daily note or a template):
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/obsidian-cli.mjs" daily:append content="..."
   ```
   Re-running on the same day updates that section rather than stacking duplicates.
3. If `profile` shows a standup or daily template, apply it through `vault-template` instead of
   inventing a layout.

**Never send it anywhere.** No message, no email, no ticket comment, no channel post — even if a
chat tool is connected and even if the user's config names an audience. The person sends their own
update. You may offer to format it for a particular destination.

Related: `vault-report` for a longer written status update, `vault-review` for weekly and monthly
retrospectives, `vault-task` for the underlying to-dos, `vault-capture` for a blocker you want
recorded right now.
