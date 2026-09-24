import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scanText, summarize } from '../scripts/scan-sensitive.mjs';

test('finds one instance of each real pattern shape', () => {
  const samples = {
    'aws-access-key': 'key = AKIAABCDEFGHIJKLMNOP',
    'github-token': 'token ghp_' + 'a'.repeat(36),
    'slack-token': 'xoxb-1234567890-abcdef',
    'google-api-key': 'AIza' + 'a'.repeat(35),
    'private-key-block': '-----BEGIN RSA PRIVATE KEY-----',
    jwt: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dGhpc2lzYXNpZ25hdHVyZQ',
    'possible-credential-assignment': 'password: correcthorsebatterystaple',
    'credit-card': '4111 1111 1111 1111',
    email: 'someone@example.com',
  };
  for (const [id, text] of Object.entries(samples)) {
    const findings = scanText(text);
    assert.ok(findings.some((f) => f.id === id), `expected a "${id}" finding in: ${text}`);
  }
});

test('does not fire on ordinary prose', () => {
  const text = 'We decided to migrate the queue after the outage last Tuesday. Cost was the deciding factor.';
  assert.deepEqual(scanText(text), []);
});

test('reports the correct line number for a multi-line note', () => {
  const text = 'line one\nline two\nAKIAABCDEFGHIJKLMNOP\nline four';
  const findings = scanText(text);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].line, 3);
});

test('never echoes the full secret back — only a redacted form', () => {
  const secret = 'AKIAABCDEFGHIJKLMNOP';
  const [finding] = scanText(`key=${secret}`);
  assert.ok(!finding.redacted.includes(secret));
  assert.match(finding.redacted, /^AKIA…/);
});

test('summarize groups by category for a one-line status', () => {
  const findings = scanText('a@b.com c@d.com AKIAABCDEFGHIJKLMNOP');
  assert.equal(summarize(findings), '1 credential, 2 pii');
  assert.equal(summarize([]), 'no matches');
});
