---
name: vault-diagram
description: Create or update a Mermaid diagram — architecture, sequence, or flowchart — inside an Obsidian note. Use when asked to "diagram this", "draw the flow", "visualize the architecture", "show this as a flowchart".
allowed-tools: Bash, Read
shell: bash
---

# Mermaid diagrams

Obsidian renders fenced ` ```mermaid ` blocks natively — generate valid Mermaid syntax, nothing more.

## Choosing a diagram type
- **Architecture / components** → `graph TD` or `graph LR` with subgraphs per service/layer.
- **API or request flow** → `sequenceDiagram` with explicit participants.
- **Process / decision flow** → `flowchart TD` with `{}` decision nodes.
- **Timeline / state** → `stateDiagram-v2` when the user is describing states and transitions rather than steps.

## Where it goes
- If it belongs to an existing note (illustrating an architecture doc or decision), insert it inline near the relevant section with `obsidian append`, after checking placement with `obsidian outline file="<name>" format=tree`.
- If it's a standalone reference diagram, create it under `Diagrams/` with `type: diagram` frontmatter and link it from wherever it's relevant.

## Quality bar
- Label every node/participant meaningfully — never `A`, `B`, `C` alone.
- Keep it to what the user actually described; don't invent components or steps that weren't mentioned.
- This skill only generates Mermaid source — it doesn't render/validate the image. If the user wants a visual check, tell them to open the note in Obsidian (or offer to render it as an artifact for a quick look).
