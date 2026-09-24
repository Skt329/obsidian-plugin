import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const HOME = mkdtempSync(path.join(os.tmpdir(), 'ovc-cfg-'));
process.env.VAULT_COPILOT_HOME = HOME;
const { loadConfig, writeConfig, CONFIG_PATH, migrateProfile, validateProfile, PROFILE_SCHEMA_VERSION } = await import('../scripts/config.mjs');

const V1_PROFILE = {
  folders: { products: '/', playden: 'PlayDen', productTemplate: '<Product>/00-START-HERE.md hub + Documentation/ + Updates/' },
  namingStyle: 'kebab-case with numeric prefixes',
  dailyNoteFormat: null,
  existingTags: ['playden', 'decision'],
  existingProperties: ['title', 'status'],
  propertyNotes: 'type: index | documentation | update',
  hasTemplaterPlugin: false,
  hasTasksPlugin: false,
};

test('migrateProfile keeps every v1 field and moves prose to legacyNotes untouched', () => {
  const v2 = migrateProfile(V1_PROFILE);
  assert.equal(v2.schemaVersion, PROFILE_SCHEMA_VERSION);
  assert.deepEqual(v2.kinds, {});
  assert.deepEqual(v2.projects, []);
  assert.equal(v2.namingStyle, V1_PROFILE.namingStyle);
  assert.deepEqual(v2.existingTags, V1_PROFILE.existingTags);
  assert.equal(v2.folders.playden, 'PlayDen', 'ordinary folder entries are kept as-is');
  assert.equal(v2.folders.productTemplate, undefined, 'the freeform prose folder entry is moved out, not left in folders');
  assert.equal(v2.legacyNotes.folderPatternProse, V1_PROFILE.folders.productTemplate);
  assert.equal(v2.legacyNotes.propertyNotes, V1_PROFILE.propertyNotes);
  assert.equal(v2.propertyNotes, undefined, 'moved into legacyNotes, not duplicated at top level');
});

test('migrateProfile is a no-op on an already-v2 profile and on an empty profile', () => {
  const v2 = migrateProfile(V1_PROFILE);
  assert.equal(migrateProfile(v2), v2, 'idempotent: migrating twice returns the same object, not a new copy');
  const fresh = migrateProfile(null);
  assert.equal(fresh.schemaVersion, PROFILE_SCHEMA_VERSION);
  assert.deepEqual(fresh.kinds, {});
});

test('loadConfig migrates a real v1 config on disk automatically, and persists the upgrade', () => {
  writeConfig({ vaultName: 'workspace', vaultPath: 'C:\\vault', profile: V1_PROFILE });
  const { config } = loadConfig();
  assert.equal(config.profile.schemaVersion, PROFILE_SCHEMA_VERSION);
  assert.equal(config.vaultName, 'workspace', 'fields outside profile are untouched');
  const onDisk = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
  assert.equal(onDisk.profile.schemaVersion, PROFILE_SCHEMA_VERSION, 'the migration was written back, not just applied in memory');
});

test('validateProfile catches a section pointing at an undefined kind', () => {
  const profile = {
    kinds: { decisions: { folder: 'Decisions', lifecycle: 'openClosed' } },
    projects: [{ name: 'X', root: 'X', sections: { Decisions: 'decisions', Updates: 'updates' } }],
  };
  const problems = validateProfile(profile);
  assert.ok(problems.some((p) => p.includes('undefined kind "updates"')));
});

test('validateProfile is silent on a well-formed profile', () => {
  const profile = {
    kinds: { decisions: { folder: 'Decisions', lifecycle: 'openClosed' } },
    projects: [{ name: 'X', root: 'X', sections: { Decisions: 'decisions' } }],
  };
  assert.deepEqual(validateProfile(profile), []);
});
