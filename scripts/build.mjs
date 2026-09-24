// Builds the distributable plugin zip.
//
//   node scripts/build.mjs            release build — refuses a dirty tree; archives HEAD
//   node scripts/build.mjs --preview  local preview — archives the working tree, untracked files
//                                     included, WITHOUT touching the real git index. Not for release.
//
// Either way it first checks the two manifests agree on the version, runs the test suite and
// `claude plugin validate`. Output goes to dist/, which is gitignored. Files marked export-ignore
// in .gitattributes (tests, this script) are left out of the zip.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const preview = process.argv.includes('--preview');

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8', shell: false, ...opts });
  return { ok: res.status === 0 && !res.error, out: (res.stdout ?? '').trim(), err: (res.stderr ?? '').trim(), error: res.error };
}

function fail(message) {
  console.error(`build: ${message}`);
  process.exit(1);
}

const plugin = JSON.parse(readFileSync(path.join(ROOT, '.claude-plugin/plugin.json'), 'utf8'));
const market = JSON.parse(readFileSync(path.join(ROOT, '.claude-plugin/marketplace.json'), 'utf8'));
const version = plugin.version;
const listed = market.plugins?.find((p) => p.name === plugin.name)?.version;
if (!version || version !== listed) fail(`version mismatch: plugin.json ${version}, marketplace.json ${listed}`);
if (plugin.hooks === './hooks/hooks.json') fail('plugin.json must not reference ./hooks/hooks.json — it is auto-loaded, and the duplicate makes the plugin fail to load');

const dirty = run('git', ['status', '--porcelain']);
if (!dirty.ok) fail(`git status failed: ${dirty.err}`);
if (dirty.out && !preview) fail('working tree is not clean — commit first, or use --preview for a local test build');

const tests = readdirSync(path.join(ROOT, 'test')).filter((f) => f.endsWith('.test.mjs')).map((f) => path.join('test', f));
const tested = run(process.execPath, ['--test', ...tests], { stdio: 'inherit' });
if (!tested.ok) fail('tests failed');

const validated = run('claude', ['plugin', 'validate', '.']);
if (validated.error?.code === 'ENOENT') console.warn('build: `claude` not on PATH — skipping plugin validation');
else if (!validated.ok) fail(`claude plugin validate failed:\n${validated.out}\n${validated.err}`);

let tree = 'HEAD';
if (preview) {
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'ovc-index-'));
  const env = { ...process.env, GIT_INDEX_FILE: path.join(tmp, 'index') };
  if (!run('git', ['add', '-A'], { env }).ok) fail('could not stage the working tree into a temporary index');
  const written = run('git', ['write-tree'], { env });
  rmSync(tmp, { recursive: true, force: true });
  if (!written.ok) fail('git write-tree failed');
  tree = written.out;
}

mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
const zip = path.join('dist', `${plugin.name}-${version}${preview ? '-preview' : ''}.zip`);
if (existsSync(path.join(ROOT, zip))) rmSync(path.join(ROOT, zip));
const archived = run('git', ['archive', '--format=zip', '-o', zip, tree]);
if (!archived.ok) fail(`git archive failed: ${archived.err}`);
console.log(`build: wrote ${zip}${preview ? ' (preview — not a release artifact)' : ''}`);
