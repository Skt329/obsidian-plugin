import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planScaffold, specFromExemplar, specFromKinds, hubContent, folderReadmeContent } from '../scripts/scaffold.mjs';

const PLAYDEN = {
  name: 'PlayDen',
  root: 'PlayDen',
  hub: '00-START-HERE.md',
  folderReadme: '00-about this folder.md',
  sections: { Decisions: 'decisions', Documentation: 'documentation', Updates: 'updates' },
  kinds: {
    decisions: { label: 'Decisions', folder: 'Decisions', lifecycle: 'openClosed', naming: 'dated' },
    documentation: { label: 'Documentation', folder: 'Documentation', lifecycle: 'reference', naming: 'numbered' },
    updates: { label: 'Updates', folder: 'Updates', lifecycle: 'appendOnly', naming: 'dated' },
  },
};

test('specFromExemplar clones another project\'s pattern under a new name, not the merged pool', () => {
  const spec = specFromExemplar('NewCo', PLAYDEN);
  assert.equal(spec.name, 'NewCo');
  assert.equal(spec.root, 'NewCo');
  assert.deepEqual(spec.sections, PLAYDEN.sections);
  assert.notEqual(spec.sections, PLAYDEN.sections, 'a copy, not a shared reference — mutating one must not affect the other');
});

test('planScaffold proposes the hub plus one about-note per section, all under the new root', () => {
  const spec = specFromExemplar('NewCo', PLAYDEN);
  const plan = planScaffold(spec);
  assert.equal(plan.length, 4, 'one hub + three sections');
  assert.ok(plan.some((f) => f.path === 'NewCo/00-START-HERE.md'));
  assert.ok(plan.some((f) => f.path === 'NewCo/Decisions/00-about this folder.md'));
  assert.ok(plan.some((f) => f.path === 'NewCo/Documentation/00-about this folder.md'));
  assert.ok(plan.some((f) => f.path === 'NewCo/Updates/00-about this folder.md'));
  assert.ok(plan.every((f) => f.reason), 'every planned file states why it exists, for the confirmation prompt');
});

test('planScaffold omits about-notes when the exemplar has none, and the hub when there is none', () => {
  const noReadme = specFromExemplar('NewCo', { ...PLAYDEN, folderReadme: null });
  assert.equal(planScaffold(noReadme).length, 1, 'just the hub');
  const noHub = specFromExemplar('NewCo', { ...PLAYDEN, hub: null });
  assert.equal(planScaffold(noHub).length, 3, 'just the three about-notes, no hub file');
});

test('hubContent links each section through its about-note and names the project', () => {
  const content = hubContent(specFromExemplar('NewCo', PLAYDEN));
  assert.match(content, /^---\ntype: hub\nproject: NewCo\n---/);
  assert.match(content, /# NewCo/);
  assert.match(content, /\[\[Decisions\/00-about this folder\|Decisions\]\]/);
});

test('folderReadmeContent carries a lifecycle-appropriate hint and links back to the hub', () => {
  const spec = specFromExemplar('NewCo', PLAYDEN);
  const content = folderReadmeContent(spec, 'Updates', 'updates');
  assert.match(content, /project: NewCo/);
  assert.match(content, /section: Updates/);
  assert.match(content, /do not edit past ones/i, 'appendOnly lifecycle gets its own hint, not a generic one');
  assert.match(content, /\[\[NewCo\/00-START-HERE\|NewCo\]\]/);
});

test('specFromKinds builds a project from a hand-picked set of kinds, defaulting the hub name', () => {
  const kinds = {
    decisions: { label: 'Decisions', folder: 'Decisions', lifecycle: 'openClosed' },
    ideas: { label: 'Ideas', folder: 'Ideas', lifecycle: 'reference' },
  };
  const spec = specFromKinds('SideProject', ['decisions', 'ideas', 'nonexistent-kind'], kinds);
  assert.deepEqual(spec.sections, { Decisions: 'decisions', Ideas: 'ideas' }, 'an unknown kind id is skipped, not inserted as a broken section');
  assert.equal(spec.hub, '00-START-HERE.md');
});
