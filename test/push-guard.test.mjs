import { test } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { evaluatePush, splitSegments, tokenize } from '../scripts/push-guard.mjs';

const WIN = process.platform === 'win32';
const VAULT = path.join(os.tmpdir(), 'ovc-test', 'My Vault');
const SHARED = path.join(os.tmpdir(), 'ovc-test', 'team-repo');
const OTHER = path.join(os.tmpdir(), 'ovc-test', 'unrelated');
const ELSEWHERE = path.join(os.tmpdir(), 'ovc-test', 'elsewhere');
const config = { vaultPath: VAULT, sharedRepoPath: SHARED };

const fwd = VAULT.replace(/\\/g, '/');
const msys = WIN ? `/${VAULT[0].toLowerCase()}${fwd.slice(2)}` : null;

const run = (command, cwd = ELSEWHERE, cfg = config) => evaluatePush({ tool_input: { command }, cwd }, cfg).block;

test('blocks the forms a push to the vault actually takes', () => {
  assert.equal(run('git push origin main', VAULT), true, 'cwd is the vault');
  assert.equal(run(`git -C "${VAULT}" push origin main`), true, '-C native path');
  assert.equal(run(`git -C "${fwd}" push`), true, '-C forward slashes');
  assert.equal(run(`cd "${VAULT}" && git push origin main`), true, 'cd then push');
  assert.equal(run('git push', path.join(VAULT, 'PlayDen')), true, 'push from a subfolder');
  assert.equal(run('git -c user.name=x push', VAULT), true, 'global -c option before push');
  assert.equal(run(`git --work-tree="${VAULT}" push`), true, '--work-tree');
  assert.equal(run('git push', SHARED), true, 'shared repo is guarded too');
});

test('blocks Windows-only path forms', { skip: !WIN }, () => {
  assert.equal(run(`git -C "${msys}" push`), true, 'Git Bash /c/ form');
  assert.equal(run(`git -C "${VAULT.toLowerCase()}" push`), true, 'different casing');
  assert.equal(run(`Set-Location "${VAULT}"; git push`), true, 'PowerShell Set-Location then push');
});

test('allows reviewed pushes that carry the marker', () => {
  assert.equal(run(`VAULT_COPILOT_CONFIRMED_PUSH=1 git -C "${VAULT}" push origin main`), false);
  assert.equal(run(`$env:VAULT_COPILOT_CONFIRMED_PUSH=1; git -C "${VAULT}" push`), false, 'PowerShell env form');
});

test('does not block commands that merely mention push', () => {
  assert.equal(run('git stash push -m wip', VAULT), false, 'stash push is not a push');
  assert.equal(run('git log --grep=push', VAULT), false);
  assert.equal(run('echo git push', VAULT), false, 'not a git invocation');
  assert.equal(run('git status', VAULT), false);
});

test('ignores repos that are not guarded, and an unconfigured plugin', () => {
  assert.equal(run(`git -C "${OTHER}" push`), false);
  assert.equal(run('git push', OTHER), false);
  assert.equal(run('git push', VAULT, null), false, 'no config means nothing to guard');
});

test('segment splitting respects quotes', () => {
  assert.deepEqual(splitSegments('cd "a && b" && git push'), ['cd "a && b"', 'git push']);
  assert.deepEqual(tokenize('git -C "My Vault" push'), ['git', '-C', 'My Vault', 'push']);
});
