import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Isolate config before the modules read it, so tests never touch the real config or log.
const HOME = mkdtempSync(path.join(os.tmpdir(), 'ovc-home-'));
process.env.VAULT_COPILOT_HOME = HOME;

const config = await import('../scripts/config.mjs');
const { parseVaultList, diagnose } = await import('../scripts/obsidian-probe.mjs');
const { parseRemotes } = await import('../scripts/git-helpers.mjs');

test('parses `vaults verbose`, including the blank first line the CLI prints', () => {
  const list = parseVaultList('\r\nPhoenix\tC:\\Notes\\Phoenix\r\nworkspace\tC:\\Notes\\workspace\r\n');
  assert.deepEqual(list, [
    { name: 'Phoenix', path: 'C:\\Notes\\Phoenix' },
    { name: 'workspace', path: 'C:\\Notes\\workspace' },
  ]);
});

test('the probe is silent when healthy and precise when not', () => {
  const vaultPath = path.join(os.tmpdir(), 'ovc', 'workspace');
  const cfg = { vaultName: 'workspace', vaultPath };
  assert.equal(diagnose(cfg, [{ name: 'workspace', path: vaultPath }]), null);
  assert.match(diagnose(cfg, [{ name: 'Phoenix', path: '/x' }]), /not in Obsidian's vault list/);
  assert.match(diagnose(cfg, [{ name: 'workspace', path: path.join(os.tmpdir(), 'moved') }]), /in the config/);
});

test('a missing config and a broken config are different states', () => {
  assert.equal(config.loadConfig().status, 'missing');
  writeFileSync(config.CONFIG_PATH, '{ not json');
  const broken = config.loadConfig();
  assert.equal(broken.status, 'invalid');
  assert.ok(broken.error);
  writeFileSync(config.CONFIG_PATH, JSON.stringify({ vaultName: 'V' }));
  assert.equal(config.loadConfig().status, 'ok');
});

test('activity records are single-line JSON with no command text', () => {
  const line = config.formatActivity({ verb: 'append', target: 'a.md' }, new Date('2026-01-01T00:00:00Z'));
  assert.equal(line.split('\n').length, 2, 'exactly one line plus the terminator');
  assert.deepEqual(JSON.parse(line), { ts: '2026-01-01T00:00:00.000Z', verb: 'append', target: 'a.md' });
});

test('activity survives multi-line values and is filtered by vault on read', () => {
  config.appendActivity({ vault: 'V', verb: 'append', target: 'x\ny.md' });
  config.appendActivity({ vault: 'Other', verb: 'create', target: 'z.md' });
  assert.ok(existsSync(config.ACTIVITY_LOG_PATH));
  const lines = readFileSync(config.ACTIVITY_LOG_PATH, 'utf8').trim().split('\n');
  assert.equal(lines.length, 2, 'a newline inside a value must not split the record');
  const mine = config.readActivity({ vault: 'V' });
  assert.equal(mine.length, 1);
  assert.equal(mine[0].target, 'x\ny.md');
});

test('git remotes are de-duplicated across fetch and push lines', () => {
  const remotes = parseRemotes('origin\thttps://x/a.git (fetch)\norigin\thttps://x/a.git (push)\n');
  assert.deepEqual(remotes, [{ name: 'origin', url: 'https://x/a.git' }]);
});
