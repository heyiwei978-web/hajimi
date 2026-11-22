import fs from 'node:fs';

// Pinyin initials for site search titles (股骨颈骨折 -> ggjgz), computed at
// build time so the page ships no dictionary. The table comes from
// config/pinyin-initials.json (regenerate with scripts/pinyin-table.mjs).

const table = new Map();
const byLetter = JSON.parse(fs.readFileSync(new URL('../config/pinyin-initials.json', import.meta.url), 'utf8'));
for (const [letter, characters] of Object.entries(byLetter)) {
  for (const character of characters) table.set(character, letter);
}

// The table holds each character's most common reading. These characters are
// read differently in common medical terms, so both initials are indexed.
export const POLYPHONES = Object.freeze({
  长: 'zc', // 生长 zhang / 延长 chang
  重: 'zc', // 重症 zhong / 重复 chong
  椎: 'zc', // 脊椎 zhui
  膀: 'bp', // 膀胱 pang
  校: 'xj', // QT 校正 jiao
  藏: 'cz'  // 内脏 zang
});

const MAX_VARIANTS = 8;

// Returns the initials spellings of the Han characters in text (other
// characters are skipped). Empty when the text has no Han characters or one
// of them is missing from the table.
export function initialsOf(text) {
  let variants = [''];
  for (const character of String(text ?? '')) {
    if (!/\p{Script=Han}/u.test(character)) continue;
    const letters = POLYPHONES[character] || table.get(character);
    if (!letters) return [];
    const next = [];
    for (const prefix of variants) {
      for (const letter of letters) if (next.length < MAX_VARIANTS) next.push(prefix + letter);
    }
    variants = next;
  }
  return variants[0] ? variants : [];
}
