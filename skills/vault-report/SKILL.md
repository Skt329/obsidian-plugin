---
name: vault-report
description: Draft a polished end-of-day or end-of-week status report for the user's manager, in prose, from recent git and vault activity. Use when the user says "write my EOD report", "draft my weekly report for my manager", "summarize this week for my manager".
allowed-tools: Bash, Read
argument-hint: "[weekly]"
shell: bash
---

# Manager report

## Manager name
!`node "${CLAUDE_PLUGIN_ROOT}/scripts/config.mjs" get managerName`

If empty, ask for it once and suggest `/vault-setup reconfigure` to save it for next time.

## Gathering data
Reuse `vault-standup`'s approach: the `activity-collector` subagent for cross-repo git activity, plus vault to-dos/decisions/blockers — but reshape into manager-facing prose rather than a bullet standup.

```
Hi <managerName>,

**Accomplishments:** ...
**In progress:** ...
**Risks / blockers:** ...
**Next steps:** ...
```

Surface anything `status: blocked` or a recent `type: decision` note prominently — these are usually what a manager most wants visibility into.

## Output
- Always print the report in chat as plain text, ready to copy.
- Only save it into `Reports/` if the user's config has `reportsSaveToVault` enabled, or if they explicitly ask for this specific report to be saved.
- **Never send it anywhere.** No email/Slack/chat integration is wired up by this plugin. If asked to "send" it, say so plainly and hand back the drafted text for the user to send themselves.
