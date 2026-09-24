// Shared config store for obsidian-vault-copilot.
// Per-user state lives OUTSIDE the plugin repo, so it can never be committed and the same
// plugin works unmodified for everyone. It deliberately does not use CLAUDE_PLUGIN_DATA: that
// directory is deleted on uninstall, and desktop zip installs get a new id per upload, so every
// update would wipe the user's profile.
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync, renameSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const CONFIG_DIR = process.env.VAULT_COPILOT_HOME || path.join(homedir(), '.claude', 'obsidian-vault-copilot');
export const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');
// v0.2 wrote a tab-separated activity.log from a global hook. It is left untouched;
// v0.2.1 writes a separate, bounded JSONL file from inside the CLI wrapper instead.
export const ACTIVITY_LOG_PATH = path.join(CONFIG_DIR, 'activity.jsonl');
const ACTIVITY_MAX_BYTES = 1024 * 1024;

// Distinguishes "no config" from "config exists but is broken". Treating both as
// unconfigured made setup overwrite a damaged profile and silently disabled the push guard.
export function loadConfig() {
  if (!existsSync(CONFIG_PATH)) return { status: 'missing', config: null, error: null };
  try {
    return { status: 'ok', config: JSON.parse(readFileSync(CONFIG_PATH, 'utf8')), error: null };
  } catch (err) {
    return { status: 'invalid', config: null, error: err.message };
  }
}

export function readConfig() {
  return loadConfig().config;
}

export function writeConfig(config) {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n', 'utf8');
}

// One JSON object per line, so a multi-line value can never break the log. Records carry
// identifiers and paths only — never command text or note content.
export function formatActivity(record, now = new Date()) {
  return JSON.stringify({ ts: now.toISOString(), ...record }) + '\n';
}

export function appendActivity(record) {
  try {
    mkdirSync(CONFIG_DIR, { recursive: true });
    if (existsSync(ACTIVITY_LOG_PATH) && statSync(ACTIVITY_LOG_PATH).size > ACTIVITY_MAX_BYTES) {
      renameSync(ACTIVITY_LOG_PATH, `${ACTIVITY_LOG_PATH}.1`);
    }
    writeFileSync(ACTIVITY_LOG_PATH, formatActivity(record), { flag: 'a' });
  } catch {
    // Logging is a memory aid; it must never turn a successful vault write into a failure.
  }
}

export function readActivity({ limit = 50, vault } = {}) {
  if (!existsSync(ACTIVITY_LOG_PATH)) return [];
  const records = [];
  for (const line of readFileSync(ACTIVITY_LOG_PATH, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try {
      const rec = JSON.parse(line);
      if (!vault || rec.vault === vault) records.push(rec);
    } catch {
      // skip a damaged line rather than failing the whole read
    }
  }
  return records.slice(-limit);
}

function pluck(obj, dotPath) {
  return dotPath.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function summary(config) {
  const p = config.profile ?? {};
  return [
    `vault:       ${config.vaultName} (${config.vaultPath})`,
    `setup mode:  ${config.setupMode ?? 'unknown'}`,
    `use cases:   ${(config.useCases ?? []).join(', ') || '(none recorded)'}`,
    `audience:    ${config.audienceName || config.audienceLabel || '(none)'}`,
    `sync:        ${config.syncMode ?? 'none'}`,
    `daily notes: ${p.dailyNotes ?? 'not recorded — treat as none: never call daily:* verbs'}`,
    `sensitivity: ${p.sensitivityProperty ?? 'sensitivity'} (public | internal | private)`,
    `folders:     ${JSON.stringify(p.folders ?? {})}`,
    `naming:      ${p.namingStyle ?? '(follow existing notes)'}`,
    `projects:    ${(config.projectRepos ?? []).length} configured`,
    `shared repo: ${config.sharedRepoPath ?? '(none)'}`,
  ].join('\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [, , cmd, key] = process.argv;
  const { status, config, error } = loadConfig();
  const unavailable = status === 'invalid' ? `INVALID_CONFIG: ${CONFIG_PATH} could not be parsed (${error}). Fix or re-run vault-setup; do not overwrite it blindly.` : 'NOT_CONFIGURED';
  if (cmd === 'get') {
    if (!config) console.log(unavailable);
    else if (key) {
      const value = pluck(config, key);
      console.log(value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : value);
    } else console.log(JSON.stringify(config, null, 2));
  } else if (cmd === 'summary') {
    console.log(config ? summary(config) : unavailable);
  } else {
    console.error('Usage: node config.mjs get [dot.path] | node config.mjs summary');
    process.exitCode = 1;
  }
}
