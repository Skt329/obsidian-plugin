// A deterministic backstop, not a replacement, for a model's own read-through before a commit or
// a share. Regexes catch what a careful read can still miss under time pressure — a token pasted
// mid-paragraph, a card number in a quote — and they never get tired. They also produce false
// positives, so findings are surfaced to the human, never used to silently block or silently
// approve anything.
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';

export const PATTERNS = [
  { id: 'aws-access-key', category: 'credential', re: /\bAKIA[0-9A-Z]{16}\b/g },
  { id: 'github-token', category: 'credential', re: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/g },
  { id: 'slack-token', category: 'credential', re: /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/g },
  { id: 'google-api-key', category: 'credential', re: /\bAIza[0-9A-Za-z_-]{35}\b/g },
  { id: 'private-key-block', category: 'credential', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g },
  { id: 'jwt', category: 'credential', re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g },
  { id: 'possible-credential-assignment', category: 'credential', re: /\b(?:password|passwd|secret|api[_-]?key|access[_-]?token)\s*[:=]\s*["']?[^\s"'`]{6,}/gi },
  { id: 'credit-card', category: 'financial', re: /\b(?:4\d{3}|5[1-5]\d{2}|3[47]\d{2})[ -]?\d{4}[ -]?\d{3,4}[ -]?\d{0,4}\b/g },
  { id: 'email', category: 'pii', re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g },
];

function redact(match) {
  return match.length <= 8 ? `${match[0]}***` : `${match.slice(0, 4)}…${match.slice(-4)}`;
}

// Pure and synchronous — no vault, no filesystem, no network. Findings are ordered by position.
export function scanText(text) {
  const findings = [];
  for (const pattern of PATTERNS) {
    pattern.re.lastIndex = 0;
    let m;
    while ((m = pattern.re.exec(text))) {
      const line = text.slice(0, m.index).split('\n').length;
      findings.push({ id: pattern.id, category: pattern.category, line, redacted: redact(m[0]) });
      if (m[0].length === 0) pattern.re.lastIndex++; // guard against a zero-width match looping forever
    }
  }
  return findings.sort((a, b) => a.line - b.line);
}

export function summarize(findings) {
  if (!findings.length) return 'no matches';
  const counts = new Map();
  for (const f of findings) counts.set(f.category, (counts.get(f.category) ?? 0) + 1);
  return [...counts.entries()].map(([cat, n]) => `${n} ${cat}`).join(', ');
}

function readStdin() {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) return resolve('');
    let data = '';
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', () => resolve(''));
  });
}

// CLI: pipe note content in, or pass content-file=<path>. Prints JSON findings (empty array if
// clean) and exits 1 when anything was found, so a caller can branch on exit code alone.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const fileArg = process.argv.slice(2).find((a) => a.startsWith('content-file='));
  const text = fileArg ? readFileSync(fileArg.slice('content-file='.length), 'utf8') : await readStdin();
  const findings = scanText(text);
  console.log(JSON.stringify(findings, null, 2));
  if (findings.length) console.error(`[obsidian-vault-copilot] scan-sensitive: ${summarize(findings)} — show these lines to the user before proceeding.`);
  process.exitCode = findings.length ? 1 : 0;
}
