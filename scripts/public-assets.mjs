// Public assets are an explicit allowlist. Clinical authoring sources, policy,
// identity ledgers and audit artifacts remain in Git, never in dist/.
export const PUBLIC_PAGES=[
  'admin.html','classification.html','duty.html','duty-orders.html','labs.html','note.html','ecg.html',
  'password-hash.html','pathway.html','search.html','tools.html'
];
export const PUBLIC_STYLES=[
  'personal-workstation.css','admin.css','case-workspace-preview.css',
  'classification.css','cms.css','duty.css','duty-orders.css','labs.css','note.css','note-case.css','ecg.css','library-personal.css','pathway.css',
  'site-search.css','styles.css','theme.css','tools-page.css','tools-polish.css','private-gallery.css'
];
export const PUBLIC_SCRIPTS=[
  'admin-content.js','admin.js','classification-data.js','classification-detail-v2-lower.js',
  'classification-detail-v2-upper.js','classification-detail-v2-pelvis-foot.js',
  'classification-treatment.js','classification.js','cms-core.js','duty.js','error-report.js','duty-orders.js','labs-data.js','labs.js','note-case-core.js','note-workflow.js','note-documents.js','note.js','note-case.js','home.js',
  'image-upload.js','library-loader.js','library-personal.js','library-ui.js','comorbidity-modules.js','special-exams.js',
  'password-hash.js','pathway-official.js','pathway.js','route-shell.js','search-core.js','site-search.js','tools-page.js','workspace.js','private-gallery.js'
];
// These non-clinical-record source URLs were already public. Keep them unchanged
// in this scoped task; the ECG compiler still produces its existing bundle.
export const PRESERVED_ECG_ASSETS=[
  'ecg-data.js','ecg-cases-data.js','ecg-basics-data.js','ecg-periop-data.js',
  'ecg-book-data.js','ecg-book-data-2.js','ecg-book-data-3.js','ecg-book-data-4.js',
  'ecg-book-data-5.js','ecg-waveforms.js','ecg-calculators.js','ecg-search.js','ecg-calipers.js','ecg.js'
];
// 在用的页面脚本源文件放在 js/ 目录（2026-11-18 起），发布后仍在站点根路径（/note.js 等），网址不变。
// 根目录剩下的 .js 是冻结的旧病历生成链（路径写在身份账本里，不能移动）以及仍在用的 app.js、search-core.js、departments.js。
export const SCRIPT_DIRECTORY='js/';
export const DIRECTORY_SCRIPTS=new Set(['admin-content.js','admin.js','classification-data.js','classification-detail-v2-lower.js','classification-detail-v2-pelvis-foot.js','classification-detail-v2-upper.js','classification-treatment.js','classification.js','cms-core.js','comorbidity-modules.js','duty-orders.js','duty.js','ecg-basics-data.js','ecg-book-data-2.js','ecg-book-data-3.js','ecg-book-data-4.js','ecg-book-data-5.js','ecg-book-data.js','ecg-calculators.js','ecg-calipers.js','ecg-cases-data.js','ecg-classic.js','ecg-data.js','ecg-periop-data.js','ecg-search.js','ecg-waveforms.js','ecg.js','error-report.js','home.js','image-upload.js','labs-data.js','labs.js','library-loader.js','library-personal.js','library-ui.js','note-case-core.js','note-case.js','note-documents.js','note-workflow.js','note.js','password-hash.js','pathway-official.js','pathway.js','private-gallery.js','route-shell.js','site-search.js','special-exams.js','tools-page.js','workspace.js']);
export const sourcePath=file=>DIRECTORY_SCRIPTS.has(file)?SCRIPT_DIRECTORY+file:file;
export const PUBLIC_FILES=[...PUBLIC_PAGES,...PUBLIC_STYLES,...PUBLIC_SCRIPTS,...PRESERVED_ECG_ASSETS];
