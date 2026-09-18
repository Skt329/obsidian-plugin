// PostToolUse hook. Purely informational: records what actually changed during a
// session to a local, gitignored log that vault-sync, vault-standup, vault-report
// and vault-review use to describe real work instead of guessing at it.
// Never blocks, never fails a tool call, always exits 0.
import { appendActivity } from './config.mjs';

function readStdin() {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) return resolve('');
    let data = '';
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', () => resolve(''));
  });
}

const VAULT_MUTATION = /\bobsidian\b[\s\S]*\b(create|append|prepend|move|rename|delete|property:set|property:remove|unique|daily:append|daily:prepend)\b/;
const TASK_MUTATION = /\bobsidian\s+task\b[\s\S]*\b(done|toggle|todo|status)\b/;
const GIT_COMMIT = /\bgit\b[\s\S]*\bcommit\b/;

const raw = await readStdin();
let payload;
try {
  payload = JSON.parse(raw);
} catch {
  process.exit(0);
}

const tool = payload?.tool_name;
const input = payload?.tool_input ?? {};

try {
  if (tool === 'Bash' && typeof input.command === 'string') {
    const cmd = input.command;
    if (VAULT_MUTATION.test(cmd) || TASK_MUTATION.test(cmd)) {
      appendActivity(`vault\t${cmd.slice(0, 200)}`);
    } else if (GIT_COMMIT.test(cmd)) {
      appendActivity(`commit\t${cmd.slice(0, 200)}`);
    }
  } else if ((tool === 'Write' || tool === 'Edit' || tool === 'NotebookEdit') && typeof input.file_path === 'string') {
    // File paths only — never contents. The log is a memory aid, not a copy of the work.
    appendActivity(`edit\t${tool}\t${input.file_path}`);
  }
} catch {
  // A logging failure must never surface as a tool failure.
}

process.exit(0);
