// SessionStart hook: verifies the configured vault is actually reachable through
// the Obsidian CLI before any skill tries to use it, so a "not running" failure
// surfaces once, early, and visibly instead of retrying independently inside every
// skill or hanging mid-task. Always exits 0 — this is informational, never blocking.
import { readConfig } from './config.mjs';
import { runObsidianJson } from './obsidian-cli.mjs';

const RETRY_DELAYS_MS = [0, 600, 1500];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function probe() {
  const config = readConfig();
  if (!config?.vaultName) {
    console.log('[obsidian-vault-copilot] No vault configured yet. Run /vault-setup to get started.');
    return;
  }

  for (const delay of RETRY_DELAYS_MS) {
    if (delay) await sleep(delay);
    const res = runObsidianJson(['vaults']);
    if (res.ok && Array.isArray(res.data)) {
      const found = res.data.find((v) => v.name === config.vaultName);
      if (found) {
        console.log(`[obsidian-vault-copilot] Vault "${config.vaultName}" is reachable at ${found.path}.`);
        return;
      }
    }
  }
  console.log(
    `[obsidian-vault-copilot] Could not reach vault "${config.vaultName}" via the Obsidian CLI. ` +
      'Open Obsidian and make sure that vault is open, then try again.'
  );
}

await probe();
process.exitCode = 0;
