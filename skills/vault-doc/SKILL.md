---
name: vault-doc
description: Write or update documentation notes in the Obsidian vault from real context — a project, codebase, process, runbook, how-to, or reference page — gathering material from the current session, the repository, and connected tools. Use when someone says document this, write docs for, explain how this works in my notes, or capture how something is done.
argument-hint: "[topic]"
shell: bash
---

# Writing documentation into the vault

Documentation here is not only technical. A process a person repeats — a release, a monthly
reconciliation, a moving checklist, a study routine, how a household handles renewals — is
documentation too, and belongs in the vault on the same terms.

## 1. Resolve config first

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/config.mjs" summary
```

If it prints `NOT_CONFIGURED`, tell the user to run the `vault-setup` skill and stop. Never guess a
vault, folder, or naming style.

## 2. Gather before you write

Start with what you already have. If this skill was invoked inside a working session, the
conversation you are already in is usually the richest source and costs nothing: what the user was
trying to do, what was tried and abandoned, the constraint that forced the shape of the answer.
Mine that first, then fill gaps.

Then, as needed:

- Read `${CLAUDE_PLUGIN_ROOT}/references/session-context.md` for the full harvesting playbook.
- Launch the **context-harvester** subagent for a digest of the session, the repository, project
  instruction files, and anything reachable through connected tools or connectors (issue trackers,
  docs services, chat). Prefer the subagent when the topic spans more than the current file.
- For a quick local pass instead:
  ```bash
  node "${CLAUDE_PLUGIN_ROOT}/scripts/session-context.mjs" harvest
  node "${CLAUDE_PLUGIN_ROOT}/scripts/git-helpers.mjs" recent-activity .
  ```
- If the subject lives in a repository, read the real thing: entry points, config, instruction files
  such as CLAUDE.md or a README, and recent changes. Documentation that contradicts the code is
  worse than none.
- Connected tools are opt-in context, not automatic. Say which one you want to query and why before
  pulling from it.

Finish gathering by asking the user for what no tool can supply: why this exists, what it replaced,
what nearly went wrong, who cares. Two sharp questions beat a page of invented filler.

## 3. Choose the shape

Pick one; say which you picked and why before writing.

| Shape | Use when | Core question it answers |
| --- | --- | --- |
| Overview / explainer | A system, project, or topic needs orientation | What is this and why is it like this |
| How-to | A specific task someone will repeat | How do I do this one thing |
| Runbook / SOP | A procedure with stakes, ordering, or recovery steps | What do I do, in order, when this happens |
| Reference | Facts to look up, not read start to finish | What are the values, options, fields |
| Onboarding guide | Someone new to the project, team, or household system | What do I need before I can start |
| Personal process note | A recurring non-work routine | How do I run this again next time |

## 4. Structure, briefly

- **Overview**: purpose, the mental model in a few sentences, main parts and how they relate,
  deliberate choices and their reasons, known rough edges, where to go next.
- **How-to**: goal, prerequisites, numbered steps with the exact commands or actions, how to tell it
  worked, what to do when it does not.
- **Runbook / SOP**: trigger, prerequisites and access needed, ordered steps, verification, rollback
  or undo, escalation or who to tell.
- **Reference**: a table or list, one row per item, stable ordering, no narrative.
- **Onboarding**: what to install or get access to, a first small task that proves it works, the
  vocabulary, where things live, who or what to ask.
- **Personal process note**: when it happens, the checklist, what tripped you last time.

Across every shape, write down the **why and the non-obvious**. The obvious is recoverable from the
thing itself; the reasoning, the rejected alternative, and the trap are not.

## 5. Update rather than duplicate

Before creating a note, search for an existing one on the topic:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/obsidian-cli.mjs" search:context query="{topic}" format=json
```

If something close exists, update it: revise the stale parts in place, keep what is still true, and
add a short dated line noting what changed and why. Show the user the diff in substance before
writing. Create a new note only when the topic is genuinely separate — a near-duplicate splits
future searches and both copies rot.

## 6. Place, link, and make it findable

- **If this documents a recorded project** (check `profile.projects` for a name match, or ask): put
  it in that project's `documentation` section — the folder whose entry in `project.sections` is
  `"documentation"` — matching `profile.kinds.documentation.naming`. This is what keeps a project's
  reference material together instead of scattering it at the vault root.
- **Otherwise**, run `node "${CLAUDE_PLUGIN_ROOT}/scripts/vault-profile.mjs" scan` and read
  `profile.folders` from config. Put the note where this vault already keeps such notes. Propose a
  new folder only if nothing fits, and get agreement — an existing vault with its own system is the
  normal case. If the scan's `detectedProjects` shows a pattern `profile.projects` hasn't recorded
  yet, mention that `vault-project` can record it for next time.
- Match the vault's existing naming style and frontmatter conventions
  (`${CLAUDE_PLUGIN_ROOT}/references/conventions.md`). Reuse tags and properties already in the
  vault rather than minting near-duplicates.
- Suggested frontmatter, adapted to what the vault already uses: `type: doc`, a `doc-shape` matching
  section 3, `topic`, `status`, `created` and `updated` dates, `tags`, and a `source` line saying
  where the material came from (session, repository and commit, a connected tool).
- Link it with `[[wikilinks]]` to related notes and to the project or area note if one exists, and
  add a link back from that note so the doc is reachable. Check with `backlinks` after writing. If
  the project has a `hub` note, offer (don't do it unasked) to add one line linking the new page —
  same as vault-decision does for decisions.
- If the vault has a template for this shape, apply it via the `vault-template` skill instead of
  inventing a layout. If the user wants this shape reusable, offer to turn it into a template.

## 7. Write for a stranger in six months

The vault copy must stand alone. Resolve every pronoun, name files, systems, people, and versions in
full, never write "as discussed above" or "the approach we just took", and date anything
time-sensitive. If a claim depends on a version, environment, or moment, say so inline.

## 8. Hand off and confirm

- Show the user the note path and the outline before writing anything longer than a few lines.
- Anything hard to undo — overwriting an existing note, bulk moves, publishing, pushing, sharing
  outside the vault — needs the exact plan shown and an explicit yes first.
- Related skills: `vault-decision` for a single decision and its trade-offs, `vault-diagram` when a
  picture carries it better than prose, `vault-template` to make the shape reusable, `vault-share`
  to export or contribute it, `vault-ops` for general vault reads and edits.
