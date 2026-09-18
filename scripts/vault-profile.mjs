// Scans a vault and reports how it is ALREADY organized, so skills can follow the
// user's existing conventions instead of imposing new ones. Every probe is
// independent and failure-tolerant: a vault with no tags, no templates folder and
// no daily notes is a normal vault, not an error.
import { pathToFileURL } from 'node:url';
import { readConfig } from './config.mjs';
import { runObsidian, runObsidianJson } from './obsidian-cli.mjs';

function safe(fn, fallback) {
  try {
    const value = fn();
    return value === undefined ? fallback : value;
  } catch {
    return fallback;
  }
}

function topLevelFolders() {
  const res = runObsidian(['folders']);
  if (!res.ok) return [];
  return res.stdout
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && l !== '/');
}

function countOf(args) {
  const res = runObsidian([...args, 'total']);
  if (!res.ok) return null;
  const n = parseInt(res.stdout.replace(/[^0-9]/g, ''), 10);
  return Number.isNaN(n) ? null : n;
}

export function scanVault() {
  const config = readConfig();
  if (!config?.vaultName) {
    return { configured: false, hint: 'No vault configured yet. Run the vault-setup skill.' };
  }

  const tags = safe(() => runObsidianJson(['tags']).data, null);
  const properties = safe(() => runObsidianJson(['properties']).data, null);
  const templates = runObsidian(['templates']);
  const dailyPath = runObsidian(['daily:path']);
  const plugins = safe(() => runObsidianJson(['plugins:enabled', 'filter=community']).data, null);

  // `templates` reports an error string rather than failing when the Templates core
  // plugin has no folder set — a common, fixable state worth surfacing explicitly.
  const templateFolderConfigured = templates.ok && !/no template folder/i.test(templates.stdout);

  const pluginIds = Array.isArray(plugins)
    ? plugins.map((p) => (typeof p === 'string' ? p : p?.id ?? p?.name)).filter(Boolean)
    : [];

  return {
    configured: true,
    vaultName: config.vaultName,
    vaultPath: config.vaultPath,
    folders: topLevelFolders(),
    noteCount: countOf(['files']),
    folderCount: countOf(['folders']),
    tags: normalizeNames(tags),
    properties: normalizeNames(properties),
    templateFolderConfigured,
    templates: templateFolderConfigured ? templates.stdout.split('\n').filter(Boolean) : [],
    templateHint: templateFolderConfigured ? null : templates.stdout || 'Templates core plugin has no folder configured.',
    dailyNotePath: dailyPath.ok ? dailyPath.stdout : null,
    communityPlugins: pluginIds,
    hasTemplaterPlugin: pluginIds.includes('templater-obsidian'),
    hasTasksPlugin: pluginIds.includes('obsidian-tasks-plugin'),
    hasExcalidrawPlugin: pluginIds.includes('obsidian-excalidraw-plugin'),
    hasDataviewPlugin: pluginIds.includes('dataview'),
  };
}

function normalizeNames(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((v) => (typeof v === 'string' ? v : v?.name ?? v?.tag ?? v?.key)).filter(Boolean);
  }
  if (typeof value === 'object') return Object.keys(value);
  return [];
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cmd = process.argv[2] ?? 'scan';
  if (cmd !== 'scan') {
    console.error('Usage: node vault-profile.mjs scan');
    process.exitCode = 1;
  } else {
    console.log(JSON.stringify(scanVault(), null, 2));
  }
}
