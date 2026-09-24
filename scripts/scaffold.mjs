// Creates a new project's hub note, section folders (via a short about-note in each, since the
// CLI has no mkdir — folders come into existence when a file is created inside them) and links
// them together, from a project spec of the shape vault-profile.mjs proposes or vault-setup
// records. Planning is pure and fully testable; only `scaffoldProject` touches the vault, and it
// never overwrites a file that already exists — a name collision is skipped and reported, not
// silently replaced.
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { runObsidian } from './obsidian-cli.mjs';

const LIFECYCLE_HINT = {
  appendOnly: 'Dated entries, oldest to newest. Add new entries; do not edit past ones.',
  openClosed: 'One note per item. Carries a `status` that moves forward over time.',
  reference: 'Stable reference material, updated in place as things change.',
};

function frontmatter(fields) {
  const lines = Object.entries(fields)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? `[${v.join(', ')}]` : v}`);
  return `---\n${lines.join('\n')}\n---\n`;
}

export function hubContent(spec) {
  const sectionLines = Object.entries(spec.sections).map(([sectionFolder, kindId]) => {
    const kind = spec.kinds?.[kindId] ?? {};
    const label = kind.label ?? sectionFolder;
    const linkTarget = spec.folderReadme ? `${sectionFolder}/${spec.folderReadme.replace(/\.md$/, '')}` : null;
    return linkTarget ? `## [[${linkTarget}|${label}]]\n` : `## ${label}\n\nSee \`${spec.root}/${sectionFolder}/\`.\n`;
  });
  return frontmatter({ type: 'hub', project: spec.name }) + `\n# ${spec.name}\n\n` + sectionLines.join('\n');
}

export function folderReadmeContent(spec, sectionFolder, kindId) {
  const kind = spec.kinds?.[kindId] ?? {};
  const label = kind.label ?? sectionFolder;
  const hint = LIFECYCLE_HINT[kind.lifecycle] ?? '';
  const hubLink = spec.hub ? `[[${spec.root}/${spec.hub.replace(/\.md$/, '')}|${spec.name}]]` : spec.name;
  return frontmatter({ type: 'index', project: spec.name, section: label }) + `\n# ${label}\n\n${hint}\n\nPart of ${hubLink}.\n`;
}

// Returns the files this project would create, without touching anything. Each entry's `path` is
// vault-relative; `reason` documents why it exists, for a confirmation prompt shown to the user.
export function planScaffold(spec) {
  const files = [];
  if (spec.hub) {
    files.push({ path: `${spec.root}/${spec.hub}`, content: hubContent(spec), reason: 'project hub / index note' });
  }
  for (const [sectionFolder, kindId] of Object.entries(spec.sections)) {
    if (spec.folderReadme) {
      files.push({
        path: `${spec.root}/${sectionFolder}/${spec.folderReadme}`,
        content: folderReadmeContent(spec, sectionFolder, kindId),
        reason: `brings the "${sectionFolder}" folder into existence (the CLI has no mkdir)`,
      });
    }
  }
  return files;
}

// Builds a spec for a brand-new project from a named source project's own detected pattern
// (never the vault-wide merged kind pool — see the note in vault-profile.mjs's detectProjects).
export function specFromExemplar(newName, exemplar) {
  return {
    name: newName,
    root: newName,
    hub: exemplar.hub,
    folderReadme: exemplar.folderReadme,
    sections: { ...exemplar.sections },
    kinds: { ...exemplar.kinds },
  };
}

export function specFromKinds(newName, kindIds, kinds, { hub = '00-START-HERE.md', folderReadme = '00-about this folder.md' } = {}) {
  const sections = {};
  const picked = {};
  for (const id of kindIds) {
    const kind = kinds[id];
    if (!kind) continue;
    sections[kind.folder ?? id] = id;
    picked[id] = kind;
  }
  return { name: newName, root: newName, hub, folderReadme, sections, kinds: picked };
}

// Executes a plan against the live vault. Skips (never overwrites) any path that already exists,
// and stops at the first hard failure so a partial scaffold is visible rather than silently mixed
// in with pre-existing files.
export function scaffoldProject(spec) {
  const created = [];
  const skipped = [];
  for (const file of planScaffold(spec)) {
    const existing = runObsidian(['file', `path=${file.path}`]);
    if (existing.ok) {
      skipped.push({ path: file.path, reason: 'already exists' });
      continue;
    }
    const res = runObsidian(['create', `path=${file.path}`, `content-file=${writeTemp(file.content)}`]);
    if (!res.ok) return { ok: false, created, skipped, error: `Could not create "${file.path}": ${res.stderr}` };
    created.push(file.path);
  }
  return { ok: true, created, skipped, error: null };
}

function writeTemp(content) {
  // Reuses content-file= so scaffold content never has to be pasted into a shell string, same as
  // every other multi-line write in this plugin.
  const dir = mkdtempSync(path.join(tmpdir(), 'ovc-scaffold-'));
  const file = path.join(dir, 'content.md');
  writeFileSync(file, content, 'utf8');
  return file;
}

// CLI entry, used by the vault-project skill:
//   node scaffold.mjs plan <spec.json>   — preview only, touches nothing
//   node scaffold.mjs run  <spec.json>   — creates the planned files, skipping any that exist
// <spec.json> is written by the skill (via the Write tool) with the shape { name, root, hub,
// folderReadme, sections, kinds }, e.g. what specFromExemplar/specFromKinds produce.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [, , cmd, specFile] = process.argv;
  if ((cmd !== 'plan' && cmd !== 'run') || !specFile) {
    console.error('Usage: node scaffold.mjs <plan|run> <spec.json>');
    process.exitCode = 1;
  } else {
    let spec;
    try {
      spec = JSON.parse(readFileSync(specFile, 'utf8'));
    } catch (err) {
      console.error(`Could not read/parse spec file "${specFile}": ${err.message}`);
      process.exitCode = 1;
      spec = null;
    }
    if (spec) {
      if (!spec.name || !spec.root || !spec.sections) {
        console.error('Spec must include at least "name", "root" and "sections".');
        process.exitCode = 1;
      } else if (cmd === 'plan') {
        console.log(JSON.stringify(planScaffold(spec), null, 2));
      } else {
        const result = scaffoldProject(spec);
        console.log(JSON.stringify(result, null, 2));
        process.exitCode = result.ok ? 0 : 1;
      }
    }
  }
}
