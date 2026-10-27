// Public assets are an explicit allowlist. Clinical authoring sources, policy,
// identity ledgers and audit artifacts remain in Git, never in dist/.
export const PUBLIC_PAGES=[
  'admin.html','classification.html','duty.html','ecg.html',
  'password-hash.html','pathway.html','tools.html'
];
export const PUBLIC_STYLES=[
  'accessibility.css','admin.css','case-workspace-preview.css','classification-home.css',
  'classification.css','cms.css','duty.css','ecg.css','library-personal.css','pathway.css',
  'styles.css','tools-page.css','tools-polish.css','ui-polish.css','workspace-design.css','private-gallery.css'
];
export const PUBLIC_SCRIPTS=[
  'admin-content.js','admin.js','classification-data.js','classification-detail-v2-lower.js',
  'classification-detail-v2-upper.js','classification-detail-v2-pelvis-foot.js',
  'classification-treatment.js','classification.js','cms-core.js','duty.js','home.js',
  'image-upload.js','library-loader.js','library-personal.js','library-ui.js','comorbidity-modules.js',
  'password-hash.js','pathway-official.js','pathway.js','search-core.js','tools-page.js','workspace.js','private-gallery.js'
];
// These non-clinical-record source URLs were already public. Keep them unchanged
// in this scoped task; the ECG compiler still produces its existing bundle.
export const PRESERVED_ECG_ASSETS=[
  'ecg-data.js','ecg-cases-data.js','ecg-basics-data.js','ecg-periop-data.js',
  'ecg-book-data.js','ecg-book-data-2.js','ecg-book-data-3.js','ecg-book-data-4.js',
  'ecg-book-data-5.js','ecg-waveforms.js','ecg-calculators.js','ecg-search.js','ecg-calipers.js','ecg.js'
];
export const PUBLIC_FILES=[...PUBLIC_PAGES,...PUBLIC_STYLES,...PUBLIC_SCRIPTS,...PRESERVED_ECG_ASSETS];
