// PreToolUse hook (matcher: Bash). Blocks any `git push` aimed at the configured
// vault or org repo that didn't go through /vault-sync or /vault-contribute's
// review step. Those skills mark a reviewed, user-confirmed push by prefixing the
// command with VAULT_COPILOT_CONFIRMED_PUSH=1 — anything else targeting a guarded
// path is denied. This is the one deliberately blocking hook in this plugin;
// scoped narrowly to `git push` so it never slows down ordinary git reads.
import path from 'node:path';
import { readConfig } from './config.mjs';

function readStdin() {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) return resolve('');
    let data = '';
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', () => resolve(''));
  });
}

const raw = await readStdin();
let payload;
try {
  payload = JSON.parse(raw);
} catch {
  process.exit(0);
}

const command = payload?.tool_input?.command;
// Deliberately broad: matches `git push`, `git -C <path> push`, `git --work-tree=... push`,
// etc. — anything with both a `git` and a `push` token, not just the two adjacent. A stricter
// regex (adjacent tokens only) misses the `-C <path>` form the skills themselves use, which
// would let an unconfirmed push through unblocked. Occasional false positives here just mean
// the skill is used instead, which is the desired behavior anyway.
if (typeof command !== 'string' || !/\bgit\b/.test(command) || !/\bpush\b/.test(command)) {
  process.exit(0);
}

if (command.includes('VAULT_COPILOT_CONFIRMED_PUSH=1')) {
  process.exit(0); // came from a reviewed vault-sync / vault-contribute push
}

const config = readConfig();
const guardedPaths = [config?.vaultPath, config?.orgRepoPath].filter(Boolean).map((p) => path.resolve(p));

if (guardedPaths.length === 0) {
  process.exit(0); // nothing configured yet — nothing to guard
}

const cwd = payload?.cwd ? path.resolve(payload.cwd) : null;
const targetsGuardedPath =
  (cwd && guardedPaths.includes(cwd)) || guardedPaths.some((p) => command.includes(p));

if (targetsGuardedPath) {
  console.error(
    '[obsidian-vault-copilot] Direct `git push` to your vault/org repo is blocked. ' +
      'Use /vault-sync (or /vault-contribute for the org repo) so the diff and remote get reviewed first.'
  );
  process.exit(2);
}

process.exit(0);
