import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {PUBLIC_PAGES} from '../scripts/public-assets.mjs';

// Without an inline icon the browser requests /favicon.ico, which the site
// does not serve, so every visit logs a 404.
test('every public page declares an inline site icon',()=>{
  for(const page of [...PUBLIC_PAGES,'index.html']){
    const html=fs.readFileSync(new URL('../'+page,import.meta.url),'utf8');
    assert.match(html,/<link rel="icon" href="data:image\/svg\+xml,/,page);
  }
});
