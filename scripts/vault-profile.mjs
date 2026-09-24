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
  const folders = topLevelFolders();
  const allFiles = safe(() => runObsidian(['files']).stdout.split('\n').filter(Boolean), []);
  const detected = safe(() => detectProjects(allFiles, folders), { projects: [], kinds: {} });

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
    folders,
    noteCount: countOf(['files']),
    folderCount: countOf(['folders']),
    // A proposal only — nothing here is written to config until vault-setup or vault-project
    // shows it to the user and they confirm. See proposeProject()/detectProjects() below.
    detectedProjects: detected.projects,
    detectedKinds: detected.kinds,
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

// ---------------------------------------------------------------------------
// Project-hub detection (0.3.0): learns a vault's own "one folder per project,
// with named sections inside it" pattern instead of assuming daily notes or a
// flat structure. Every function here is pure — takes a list of vault-relative
// paths, returns a proposal — so it is fully testable without a live vault.
// ---------------------------------------------------------------------------

const HUB_RE = /(^|\/)(\d+[-_ ]?)?start[- ]?here\.md$/i;
const FOLDER_README_RE = /^(\d+[-_ ]?)?about this folder\.md$/i;
const DATED_RE = /^\d{4}-\d{2}-\d{2}( -|_| )/;
const NUMBERED_RE = /^\d{2,}[-_]/;
const DENYLIST = new Set(['templates', 'excalidraw', 'attachments', 'assets', 'archive', 'trash', '.trash', 'canvas']);
// Section-name -> kind id, so two projects using near-synonyms (Updates vs Log vs Journal)
// still share one kind definition rather than minting a duplicate per project.
const SECTION_ALIASES = {
  documentation: 'documentation', docs: 'documentation', reference: 'documentation',
  updates: 'updates', log: 'updates', journal: 'updates', changelog: 'updates',
  decisions: 'decisions', adrs: 'decisions', adr: 'decisions',
  ideas: 'ideas', backlog: 'ideas', 'open follow-ups': 'ideas',
  meetings: 'meetings', calls: 'meetings',
  tasks: 'tasks', todos: 'tasks',
};
const LIFECYCLE_BY_KIND = {
  updates: 'appendOnly', meetings: 'appendOnly',
  decisions: 'openClosed', tasks: 'openClosed',
  documentation: 'reference', ideas: 'reference',
};
const LABEL_BY_KIND = {
  documentation: 'Documentation', updates: 'Updates', decisions: 'Decisions', ideas: 'Ideas', meetings: 'Meetings', tasks: 'Tasks',
};

export function classifyNaming(filenames) {
  const names = filenames.filter((f) => !FOLDER_README_RE.test(f));
  if (!names.length) return 'unknown';
  const counts = { dated: 0, numbered: 0, plain: 0 };
  for (const f of names) {
    if (DATED_RE.test(f)) counts.dated++;
    else if (NUMBERED_RE.test(f)) counts.numbered++;
    else counts.plain++;
  }
  const [top, second] = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (top[1] === 0) return 'unknown';
  if (second && second[1] > 0 && second[1] >= top[1] * 0.4) return 'mixed';
  return top[0];
}

// Builds { rootFiles, sections: { folderName: [filenames] } } for one top-level folder,
// from the full flat file list. depth-1 files under the folder are "sections"; files
// directly at the folder's own root (the hub) have no further nesting.
export function groupProjectFiles(projectFolder, allFiles) {
  const prefix = `${projectFolder}/`;
  const rootFiles = [];
  const sections = {};
  for (const full of allFiles) {
    if (!full.startsWith(prefix)) continue;
    const rel = full.slice(prefix.length);
    const slash = rel.indexOf('/');
    if (slash === -1) {
      rootFiles.push(rel);
    } else {
      const section = rel.slice(0, slash);
      const filename = rel.slice(slash + 1);
      if (filename.includes('/')) continue; // ignore anything nested more than one level deep
      (sections[section] ??= []).push(filename);
    }
  }
  return { rootFiles, sections };
}

// Proposes ONE project entry for a top-level folder, or null if it does not look like a
// project hub (no recognizable sections, or a denylisted utility folder). This never writes
// anything — vault-setup shows the proposal and the user confirms before it enters config.
export function proposeProject(projectFolder, allFiles) {
  if (DENYLIST.has(projectFolder.toLowerCase())) return null;
  const { rootFiles, sections } = groupProjectFiles(projectFolder, allFiles);
  const sectionNames = Object.keys(sections);
  if (sectionNames.length < 2) return null; // a couple of loose notes in a folder isn't a project

  const hub = rootFiles.find((f) => HUB_RE.test(f)) ?? null;
  const kinds = {};
  const projectSections = {};
  let recognized = 0;

  for (const section of sectionNames) {
    const files = sections[section];
    const kindId = SECTION_ALIASES[section.toLowerCase()] ?? null;
    if (kindId) recognized++;
    const id = kindId ?? section.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    projectSections[section] = id;
    if (!kinds[id]) {
      kinds[id] = {
        label: LABEL_BY_KIND[id] ?? section,
        folder: section,
        naming: classifyNaming(files),
        lifecycle: LIFECYCLE_BY_KIND[id] ?? 'reference',
      };
    }
  }

  // Require either a hub note or at least two recognizable section names — otherwise this is
  // more likely an unrelated folder that happens to have subfolders (e.g. an attachments tree).
  if (!hub && recognized < 2) return null;

  const folderReadme = sectionNames
    .flatMap((s) => sections[s].filter((f) => FOLDER_README_RE.test(f)).map((f) => f))
    .find(Boolean) ?? null;

  return {
    name: projectFolder,
    root: projectFolder,
    hub,
    folderReadme,
    sections: projectSections,
    kinds,
  };
}

// The returned `kinds` map is a vault-wide SUMMARY, merged across every detected project — later
// projects win on a naming/lifecycle disagreement. It is a reasonable default for scaffolding a
// brand-new project when no exemplar is named, but it is NOT authoritative for any one existing
// project: that project's own `sections` (folder name -> kind id) is. When cloning a specific
// project's pattern, always read that project's own proposal, never the merged pool.
export function detectProjects(allFiles, topFolders) {
  const proposals = topFolders.map((f) => proposeProject(f, allFiles)).filter(Boolean);
  const kinds = {};
  const projects = proposals.map(({ kinds: k, ...project }) => {
    Object.assign(kinds, k);
    return project;
  });
  return { projects, kinds };
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
