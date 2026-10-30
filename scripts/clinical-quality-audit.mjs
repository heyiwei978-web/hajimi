import fs from 'node:fs';
import path from 'node:path';
import {loadClinicalSource} from './clinical-compiler.mjs';
import {hasClinicalJsonSource,loadClinicalJsonSource} from './clinical-source.mjs';
import {auditClinicalRecords} from './clinical-audit-rules.mjs';

const args = process.argv.slice(2);
const check = args.includes('--check');
const jsonIndex = args.indexOf('--json');
if (jsonIndex >= 0 && (!args[jsonIndex + 1] || args[jsonIndex + 1].startsWith('--'))) {
  throw new Error('Usage: npm run audit:clinical -- [--check] [--json output-path]');
}

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const {records} = hasClinicalJsonSource() ? loadClinicalJsonSource() : loadClinicalSource(html);
const report = auditClinicalRecords(records);
console.log('Clinical record quality audit (read-only)');
console.log('Records: ' + report.total + ' total, ' + report.orthopedics + ' orthopedic, ' +
  report.tkaStandard + ' TKA standard chapters, ' + report.tkaSpecialCases + ' TKA special cases');
console.log('Findings: ' + report.counts.error + ' blocking, ' +
  report.counts.review + ' manual reviews, ' + report.counts.info + ' reminders');
const grouped = new Map();
for (const item of report.findings) {
  const key = item.severity + ' / ' + item.code;
  grouped.set(key, (grouped.get(key) || 0) + 1);
}
for (const [category,count] of grouped) console.log('  ' + category + ': ' + count);
const errors = report.findings.filter(item => item.severity === 'error');
for (const finding of errors.slice(0,25)) {
  console.error('  [BLOCK] ' + finding.group + ' / ' + finding.document + ': ' + finding.detail);
}
if (jsonIndex >= 0) {
  const target = path.resolve(args[jsonIndex + 1]);
  fs.mkdirSync(path.dirname(target), {recursive:true});
  fs.writeFileSync(target, JSON.stringify(report,null,2) + '\n', 'utf8');
  console.log('Safe metadata-only report: ' + target);
}
if (check && errors.length) {
  console.error('Clinical audit failed: resolve blocking findings before merging.');
  process.exitCode = 1;
}
