// PostToolUse hook (matcher: Bash). Purely informational — records vault-mutating
// `obsidian` CLI calls to a local, gitignored activity log that vault-sync and
// vault-standup use to draft accurate "what changed" summaries. Never blocks;
// always exits 0.
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

const MUTATING = /\bobsidian\b.*\b(create|append|prepend|move|rename|delete|property:set|property:remove)\b/;
const TASK_DONE = /\bobsidian\s+task\b.*\b(done|toggle)\b/;

const raw = await readStdin();
let payload;
try {
  payload = JSON.parse(raw);
} catch {
  process.exit(0);
}

const command = payload?.tool_input?.command;
if (typeof command === 'string' && (MUTATING.test(command) || TASK_DONE.test(command))) {
  appendActivity(command.slice(0, 200));
}

process.exit(0);
