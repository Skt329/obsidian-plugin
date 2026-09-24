import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  classifyOutput,
  encodeContent,
  isMutating,
  normalizeFsPath,
  parseVaultInfo,
  prepareArgs,
  targetOf,
  JSON_VERBS,
  MAX_CONTENT_CHARS,
} from '../scripts/obsidian-cli.mjs';

test('the CLI prints failures on stdout with exit 0 — they must classify as errors', () => {
  const out = classifyOutput('\nError: File "nope.md" not found.\n');
  assert.equal(out.kind, 'error');
  assert.equal(out.message, 'Error: File "nope.md" not found.');
});

test('"No ... found." sentences are empty results, not text', () => {
  assert.equal(classifyOutput('No matches found.').kind, 'empty');
  assert.equal(classifyOutput('No tasks found.\n').kind, 'empty');
});

test('leading blank lines are stripped from real output', () => {
  const out = classifyOutput('\r\n\nPhoenix\nworkspace\n');
  assert.equal(out.kind, 'ok');
  assert.equal(out.text, 'Phoenix\nworkspace');
});

test('format=json is only added for verbs that honour it', () => {
  const cfg = { vaultName: 'V' };
  assert.ok(JSON_VERBS.has('tags'));
  assert.deepEqual(prepareArgs(['tags'], cfg, { json: true }), ['tags', 'vault=V', 'format=json']);
  assert.deepEqual(prepareArgs(['vaults', 'verbose'], cfg, { json: true }), ['vaults', 'verbose', 'vault=V'], 'vaults ignores format=');
});

test('vault= is injected unless the caller already passed one', () => {
  assert.deepEqual(prepareArgs(['read', 'path=a.md'], { vaultName: 'V' }), ['read', 'path=a.md', 'vault=V']);
  assert.deepEqual(prepareArgs(['read', 'vault=W'], { vaultName: 'V' }), ['read', 'vault=W']);
});

test('content-file= is read and encoded, never pasted through a shell', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'ovc-'));
  const file = path.join(dir, 'note.md');
  writeFileSync(file, 'line one\r\nline $(two)\tend');
  const args = prepareArgs(['append', 'path=x.md', `content-file=${file}`], null);
  assert.deepEqual(args, ['append', 'path=x.md', 'content=line one\\nline $(two)\\tend']);
});

test('oversized content fails with guidance instead of hitting the command-line limit', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'ovc-'));
  const file = path.join(dir, 'big.md');
  writeFileSync(file, 'x'.repeat(MAX_CONTENT_CHARS + 1));
  assert.throws(() => prepareArgs(['create', `content-file=${file}`], null), /Write tool/);
});

test('mutating verbs are recognised, including daily:read which creates a note', () => {
  assert.equal(isMutating(['append', 'path=a']), true);
  assert.equal(isMutating(['daily:read']), true);
  assert.equal(isMutating(['task', 'ref=a.md:3', 'done']), true);
  assert.equal(isMutating(['tasks', 'todo']), false);
  assert.equal(isMutating(['read', 'path=a']), false);
});

test('path normalisation makes equivalent paths compare equal', () => {
  const p = path.join(os.tmpdir(), 'Some Vault');
  assert.equal(normalizeFsPath(p), normalizeFsPath(p + path.sep));
  if (process.platform === 'win32') {
    assert.equal(normalizeFsPath(p.replace(/\\/g, '/')), normalizeFsPath(p));
    assert.equal(normalizeFsPath(p.toUpperCase()), normalizeFsPath(p));
    const msys = `/${p[0].toLowerCase()}${p.slice(2).replace(/\\/g, '/')}`;
    assert.equal(normalizeFsPath(msys), normalizeFsPath(p));
  }
});

test('vault info is parsed from the key/tab/value table, so a silent fallback is detectable', () => {
  const info = parseVaultInfo('\nname\tworkspace\npath\tC:\\Notes\\workspace\nfiles\t55\n');
  assert.equal(info.name, 'workspace');
  assert.equal(info.path, 'C:\\Notes\\workspace');
  assert.notEqual(info.name, 'NoSuchVault', 'asking for an unknown vault returns another vault\'s name');
});

test('encodeContent and targetOf', () => {
  assert.equal(encodeContent('a\nb\tc'), 'a\\nb\\tc');
  assert.equal(targetOf(['create', 'path=Ideas/x.md', 'content=hi']), 'Ideas/x.md');
  assert.equal(targetOf(['read']), null);
});
