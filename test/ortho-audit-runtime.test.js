import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import handler from '../api/ortho-audit-runtime.js';

test('runtime audit covers the orthopedic scripts loaded by the current site', () => {
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const expectedFiles = [...html.matchAll(/<script\s+src="\/([^?"]+)(?:\?[^"]*)?"/g)]
    .map(match => match[1])
    .filter(file => /^(ideal-cases|orthopedic-expansion-[a-z]|record-quality-v\d+)\.js$/.test(file));
  let status;
  let result;
  const response = {
    status(code) { status = code; return this; },
    json(body) { result = body; }
  };

  handler({}, response);

  assert.equal(status, 200, result?.error);
  assert.equal(result.ok, true);
  assert.deepEqual(result.runtime.map(entry => entry.file), expectedFiles);
  assert(result.runtime.every(entry => entry.ok));
  assert.equal(result.seedCount, 200);
  assert(result.standardRecordCount > 0);
  assert.equal(result.audit.stats.diseases, result.seedCount);
  assert.equal(result.audit.stats.records, result.standardRecordCount);
  assert.equal(result.audit.stats.issueCount, 0);
  assert.deepEqual(Array.from(result.audit.issues), []);
});
