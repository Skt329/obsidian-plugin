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

// Profile schema v2 (0.3.0) adds structured "kinds" (a folder + naming + template + lifecycle
// contract for one sort of note) and "projects" (a hub note plus named sections, each pointing at
// a kind) — the vault's own organizing pattern as data, instead of the free-text prose v1 recorded
// it as. A v1 profile is migrated automatically and losslessly: every old field is kept, the prose
// moves to `legacyNotes` untouched, and `kinds`/`projects` start empty until vault-setup or
// vault-profile's detector populates them. Nothing is ever silently overwritten.
export const PROFILE_SCHEMA_VERSION = 2;

export function migrateProfile(profile) {
  if (!profile) return { schemaVersion: PROFILE_SCHEMA_VERSION, kinds: {}, projects: [] };
  if ((profile.schemaVersion ?? 1) >= PROFILE_SCHEMA_VERSION) return profile;

  const { productTemplate, ...restFolders } = profile.folders ?? {};
  const legacyNotes = { ...(profile.legacyNotes ?? {}) };
  if (productTemplate) legacyNotes.folderPatternProse = productTemplate;
  if (profile.propertyNotes) legacyNotes.propertyNotes = profile.propertyNotes;

  const { propertyNotes: _drop, ...rest } = profile;
  return {
    ...rest,
    folders: restFolders,
    schemaVersion: PROFILE_SCHEMA_VERSION,
    kinds: profile.kinds ?? {},
    projects: profile.projects ?? [],
    ...(Object.keys(legacyNotes).length ? { legacyNotes } : {}),
  };
}

function migrateConfig(config) {
  if (!config?.profile) return config;
  const profile = migrateProfile(config.profile);
  return profile === config.profile ? config : { ...config, profile };
}

// A note kind's lifecycle shapes how skills treat it: appendOnly notes (an updates log) are never
// marked open/closed and are always added to, never edited in place; openClosed notes (decisions,
// tasks) carry a status that changes over time; reference notes (documentation) are edited in
// place and have no status at all.
export const LIFECYCLES = new Set(['appendOnly', 'openClosed', 'reference']);

// Structural sanity only — never blocks normal use, just tells vault-setup/tests when a proposed
// or hand-edited profile doesn't hang together (e.g. a project section pointing at a kind that
// was never defined).
export function validateProfile(profile) {
  const problems = [];
  if (!profile) return problems;
  const kinds = profile.kinds ?? {};
  for (const [id, kind] of Object.entries(kinds)) {
    if (!kind.folder) problems.push(`kind "${id}" has no folder`);
    if (kind.lifecycle && !LIFECYCLES.has(kind.lifecycle)) problems.push(`kind "${id}" has an unknown lifecycle "${kind.lifecycle}"`);
  }
  for (const project of profile.projects ?? []) {
    if (!project.name || !project.root) problems.push(`a project is missing name/root: ${JSON.stringify(project)}`);
    for (const [section, kindId] of Object.entries(project.sections ?? {})) {
      if (!kinds[kindId]) problems.push(`project "${project.name}" section "${section}" points at undefined kind "${kindId}"`);
    }
  }
  return problems;
}

// Distinguishes "no config" from "config exists but is broken". Treating both as
// unconfigured made setup overwrite a damaged profile and silently disabled the push guard.
export function loadConfig() {
  if (!existsSync(CONFIG_PATH)) return { status: 'missing', config: null, error: null };
  try {
    const raw = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
    const migrated = migrateConfig(raw);
    if (migrated !== raw) {
      try {
        writeConfig(migrated);
      } catch {
        // migration still applies in-memory for this run even if the write-back fails
      }
    }
    return { status: 'ok', config: migrated, error: null };
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
  const projects = p.projects ?? [];
  const kinds = Object.keys(p.kinds ?? {});
  return [
    `vault:         ${config.vaultName} (${config.vaultPath})`,
    `setup mode:    ${config.setupMode ?? 'unknown'}`,
    `use cases:     ${(config.useCases ?? []).join(', ') || '(none recorded)'}`,
    `audience:      ${config.audienceName || config.audienceLabel || '(none)'}`,
    `sync:          ${config.syncMode ?? 'none'}`,
    `daily notes:   ${p.dailyNotes ?? 'not recorded — treat as none: never call daily:* verbs'}`,
    `sensitivity:   ${p.sensitivityProperty ?? 'sensitivity'} (public | internal | private)`,
    `folders:       ${JSON.stringify(p.folders ?? {})}`,
    `naming:        ${p.namingStyle ?? '(follow existing notes)'}`,
    `note kinds:    ${kinds.length ? kinds.join(', ') : '(none recorded — run vault-project or vault-setup to detect them)'}`,
    `vault projects:${projects.length ? ' ' + projects.map((pr) => pr.name).join(', ') : ' (none recorded)'}`,
    `tracked repos: ${(config.projectRepos ?? []).length} configured (for standup/report activity)`,
    `shared repo:   ${config.sharedRepoPath ?? '(none)'}`,
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
