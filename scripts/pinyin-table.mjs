// Regenerates config/pinyin-initials.json (Han character -> pinyin initial) for
// the site search's initials matching. Maintainer-only: the build reads the
// committed JSON and never runs this script.
//
// Source: the pinyin collation table shipped with Perl
// (Unicode::Collate::CJK::Pinyin, part of core Perl). Its data lists every
// character in pinyin order, with FDD0-00xx markers where each initial letter
// starts; a character is listed once, under its most common reading.
// Readings that matter in medical terms are added in scripts/pinyin-initials.mjs.
//
// Usage: node scripts/pinyin-table.mjs [path/to/Unicode/Collate/CJK/Pinyin.pm]
// Without a path, Perl is asked where the module is installed.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const modulePath = process.argv[2] || execFileSync('perl',
  ['-MUnicode::Collate::CJK::Pinyin', '-e', 'print $INC{"Unicode/Collate/CJK/Pinyin.pm"}'], {encoding: 'utf8'});
const source = fs.readFileSync(modulePath, 'utf8');
const start = source.indexOf('\n__DATA__\n');
if (start < 0) throw new Error('No __DATA__ section in ' + modulePath);
const endMark = source.indexOf('\n__END__', start);
const data = source.slice(start + 10, endMark < 0 ? source.length : endMark);

const byLetter = {};
const seen = new Set();
let letter = '';
for (const token of data.split(/\s+/)) {
  if (!token) continue;
  const marker = /^FDD0-00([0-9A-F]{2})$/.exec(token);
  if (marker) {
    letter = String.fromCharCode(parseInt(marker[1], 16)).toLowerCase();
    continue;
  }
  if (token.includes('-')) continue;
  const character = String.fromCodePoint(parseInt(token, 16));
  if (!/\p{Script=Han}/u.test(character) || seen.has(character)) continue;
  if (!/^[a-z]$/.test(letter)) throw new Error('Character before the first letter marker: ' + token);
  seen.add(character);
  byLetter[letter] = (byLetter[letter] || '') + character;
}

const output = new URL('../config/pinyin-initials.json', import.meta.url);
fs.writeFileSync(output, JSON.stringify(byLetter, null, 0).replace(/","/g, '",\n"').replace(/^\{/, '{\n').replace(/\}$/, '\n}\n'));
console.log('Wrote ' + seen.size + ' characters under ' + Object.keys(byLetter).length + ' initials');
