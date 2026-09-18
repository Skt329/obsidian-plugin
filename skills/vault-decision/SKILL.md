---
name: vault-decision
description: Record an engineering or architecture decision — context, options considered, trade-offs, and the final call — as a note in the Obsidian vault. Use when the user says "document this decision", "write an ADR", "record why we chose X over Y", or a design discussion just concluded and should be captured.
allowed-tools: Bash, Read
shell: bash
---

# Recording a decision

Read the `vault-ops` conventions first if you haven't this session (config, taxonomy, frontmatter).

## Structure
Write into `Decisions/YYYY-MM-DD-short-slug.md` with frontmatter:
```yaml
type: decision
project: <string>
status: proposed | accepted | superseded
date: YYYY-MM-DD
tags: [decision, <project>]
confidential: true | false
```
Body sections, in this order:
1. **Context** — what prompted the decision, the problem or constraint.
2. **Options considered** — every real alternative, even rejected ones, a few bullets each.
3. **Trade-offs** — what each option costs/gains; be specific (performance, complexity, cost, team familiarity, migration effort), not generic.
4. **Decision** — the actual call, one clear sentence.
5. **Consequences** — what this commits the team to, and what to revisit if circumstances change.

## Before writing
- Run `obsidian tags format=json` and reuse an existing project tag if one already fits, rather than minting a near-duplicate.
- If this decision relates to an earlier one, link it with `[[wikilink]]` and verify the link resolves via `obsidian backlinks file="<new-note>"` after creating it.
- Ask the user directly for anything you can't infer confidently — options considered and trade-offs should come from them, not be invented to fill out the template.

## Superseding an old decision
Never delete a superseded decision. Instead:
1. `obsidian property:set name=status value=superseded file="<old-note>"`
2. Append to the old note: `Superseded by [[new-note]]`
3. In the new note, reference the old one: `Supersedes [[old-note]]`

## Confidentiality
If the decision involves unreleased plans, security details, or anything the user wouldn't want outside the company, set `confidential: true`. This is enforced later by `vault-contribute`, which refuses to share confidential notes without an explicit override.
