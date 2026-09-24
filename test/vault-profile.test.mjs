import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyNaming, groupProjectFiles, proposeProject, detectProjects } from '../scripts/vault-profile.mjs';

test('classifyNaming picks the dominant style and ignores about-this-folder notes', () => {
  assert.equal(classifyNaming(['00-about this folder.md', '2026-09-16 - a.md', '2026-09-17 - b.md']), 'dated');
  assert.equal(classifyNaming(['01-overview.md', '02-arch.md']), 'numbered');
  assert.equal(classifyNaming(['Open follow-ups.md', 'Random idea.md']), 'plain');
  assert.equal(classifyNaming([]), 'unknown');
  assert.equal(classifyNaming(['00-about this folder.md']), 'unknown', 'the about-note alone carries no naming signal');
});

test('classifyNaming calls a real mix "mixed" rather than picking a false majority', () => {
  assert.equal(classifyNaming(['2026-01-01 - a.md', '2026-01-02 - b.md', '01-x.md', '02-y.md']), 'mixed');
});

test('groupProjectFiles separates the hub root from one-level-deep sections', () => {
  const files = [
    'PlayDen/00-START-HERE.md',
    'PlayDen/Decisions/00-about this folder.md',
    'PlayDen/Decisions/2026-09-20 - a.md',
    'PlayDen/Updates/2026-09-22 - b.md',
    'PlayDen/Updates/nested/too-deep.md',
    'Other/unrelated.md',
  ];
  const { rootFiles, sections } = groupProjectFiles('PlayDen', files);
  assert.deepEqual(rootFiles, ['00-START-HERE.md']);
  assert.deepEqual(sections.Decisions, ['00-about this folder.md', '2026-09-20 - a.md']);
  assert.deepEqual(sections.Updates, ['2026-09-22 - b.md'], 'a file nested two levels deep is ignored, not misfiled');
});

const REAL_VAULT_FILES = [
  'Home.md',
  'Excalidraw/Drawing 2026-09-20.excalidraw.md',
  'PlayDen/00-START-HERE.md',
  'PlayDen/Decisions/00-about this folder.md',
  'PlayDen/Decisions/2026-09-20 - Cloudflare migration approach.md',
  'PlayDen/Documentation/01-platform-overview.md',
  'PlayDen/Documentation/02-mobile-apps.md',
  'PlayDen/Ideas/00-about this folder.md',
  'PlayDen/Updates/2026-09-20 - initial pack.md',
  'PlayDen/Updates/2026-09-22 - verified live.md',
  'Templates/decision.md',
  'Templates/meeting-note.md',
];

test('proposeProject recognizes a real project hub end to end', () => {
  const proposal = proposeProject('PlayDen', REAL_VAULT_FILES);
  assert.equal(proposal.hub, '00-START-HERE.md');
  assert.equal(proposal.folderReadme, '00-about this folder.md');
  assert.deepEqual(proposal.sections, { Decisions: 'decisions', Documentation: 'documentation', Ideas: 'ideas', Updates: 'updates' });
  assert.equal(proposal.kinds.updates.lifecycle, 'appendOnly');
  assert.equal(proposal.kinds.documentation.lifecycle, 'reference');
  assert.equal(proposal.kinds.decisions.naming, 'dated');
});

test('proposeProject does not mistake a template library or a loose folder for a project', () => {
  assert.equal(proposeProject('Templates', REAL_VAULT_FILES), null, 'denylisted utility folder');
  assert.equal(proposeProject('Excalidraw', REAL_VAULT_FILES), null, 'no sections at all');
  const looseFolder = ['Misc/one.md', 'Misc/two.md', 'Misc/Random/three.md'];
  assert.equal(proposeProject('Misc', looseFolder), null, 'one unrecognized section is not enough without a hub');
});

test('proposeProject accepts a hub-less project if enough sections are recognized', () => {
  const files = ['Side/Documentation/a.md', 'Side/Decisions/b.md', 'Side/Ideas/c.md'];
  const proposal = proposeProject('Side', files);
  assert.ok(proposal, 'three recognized sections should be enough without a hub note');
  assert.equal(proposal.hub, null);
});

test('detectProjects finds every real project and merges kinds without dropping either', () => {
  const files = [
    ...REAL_VAULT_FILES,
    'Lesson Plan/00-START-HERE.md',
    'Lesson Plan/Meetings/2026-09-21 - kickoff.md',
    'Lesson Plan/Decisions/2026-09-16 - stack.md',
    'Lesson Plan/Documentation/01-overview.md',
    'Lesson Plan/Updates/2026-09-17 - shipped.md',
  ];
  const { projects, kinds } = detectProjects(files, ['PlayDen', 'Lesson Plan', 'Templates', 'Excalidraw']);
  assert.deepEqual(projects.map((p) => p.name).sort(), ['Lesson Plan', 'PlayDen']);
  assert.ok(kinds.meetings, 'a kind only present in one project still appears in the merged pool');
  assert.equal(kinds.meetings.lifecycle, 'appendOnly');
});
