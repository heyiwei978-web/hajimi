import fs from 'node:fs';
import crypto from 'node:crypto';

// Cache busting for published pages.
//
// Root-level CSS/JS are served with a one-day cache plus a week of
// stale-while-revalidate (vercel.json). Pages reference them as
// `/name.css?v=...`. Hand-maintained version strings drifted between pages and
// were sometimes reused after a file changed, so browsers kept stale styles.
//
// After every other build step has written dist/, replace each `?v=` value
// with a digest of the published file. Unchanged files keep the same URL (cache
// stays warm); any change produces a new URL on every page at once. The
// `?v=` values in the source HTML are now only used when previewing sources
// without building and no longer need manual bumps.

const REFERENCE = /(["'])\/([A-Za-z0-9_-]+\.(?:css|js))\?v=[^"'<>\s]*\1/g;

export function assetDigest(directory, file, cache = new Map()) {
  if (!cache.has(file)) {
    const url = new URL(file, directory);
    if (!fs.existsSync(url)) throw new Error(`Versioned asset missing from dist: /${file}`);
    cache.set(file, crypto.createHash('sha256').update(fs.readFileSync(url)).digest('hex').slice(0, 12));
  }
  return cache.get(file);
}

export function versionAssetReferences(html, directory, cache = new Map()) {
  return html.replace(REFERENCE, (match, quote, file) =>
    `${quote}/${file}?v=${assetDigest(directory, file, cache)}${quote}`);
}

export function writeAssetVersions(directory) {
  const cache = new Map();
  const pages = fs.readdirSync(directory).filter(file => file.endsWith('.html'));
  const rendered = pages.map(file => [file, versionAssetReferences(
    fs.readFileSync(new URL(file, directory), 'utf8'), directory, cache)]);
  // Resolve every reference before writing so a missing asset fails the build
  // without leaving half-updated pages behind.
  for (const [file, html] of rendered) fs.writeFileSync(new URL(file, directory), html);
  return cache;
}
