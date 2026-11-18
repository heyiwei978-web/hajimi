import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = file => fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');

test('personal areas present an honest state before source material or exams are added', () => {
  const sections = read('workstation-sections.html');
  assert.match(sections, /<h2 id="ws-private-materials-title">个人资料库<\/h2><span class="ws-state">待接入<\/span>/);
  assert.match(sections, /<h2 id="ws-exams-title">我的医学考试<\/h2><span class="ws-state">待接入<\/span>/);
  assert.match(read('home.html'), /data-workstation-list="recent" data-limit="3"/);
  assert.doesNotMatch(read('home.html'), /official-stats|clinical-scene/);
});
