import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {sourcePath} from '../scripts/public-assets.mjs';

const read = file => fs.readFileSync(new URL('../'+sourcePath(file), import.meta.url), 'utf8');

test('personal areas present an honest state for personal materials and pending exams', () => {
  const sections = read('workstation-sections.html');
  assert.match(sections, /<h2 id="ws-private-materials-title">个人资料库<\/h2><a class="ws-text-link" href="\/materials\/library">打开资料库 →<\/a>/);
  assert.match(sections, /data-materials-hub/);
  assert.match(sections, /<h2 id="ws-exams-title">我的医学考试<\/h2><span class="ws-state">待接入<\/span>/);
  assert.match(read('home.html'), /data-workstation-list="recent" data-limit="3"/);
  assert.doesNotMatch(read('home.html'), /official-stats|clinical-scene/);
});
