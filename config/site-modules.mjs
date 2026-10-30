// Site module registry: the single description of top-level sections,
// departments and every place the main navigation is rendered.
//
// Phase 1b: scripts/navigation-build.mjs renders the published navigation from
// this registry after the clinical and ECG compilers finish. The public asset
// allowlist excludes config/ and scripts/. Do not reference it from HTML and
// do not add a navigation <script> to index.html — every script listed there is
// executed by scripts/clinical-compiler.mjs as part of the clinical record chain.
//
// Navigation order is a UI contract, not only data. styles.css hides the 4th
// `.global-links` item below 640px and ui-polish.css restores it for official
// navigation bars; reordering MODULES changes which entry is affected on phones.

export const SITE_BRAND = Object.freeze({
  name: '哈基米工作站',
  tagline: 'hajimi Clinical Workspace'
});

// `routes` mirrors the existing vercel.json rewrite sources for the section.
// The registry describes routing; it does not generate vercel.json.
export const MODULES = Object.freeze([
  {id: 'home', label: '首页', href: '/', nav: true, routes: ['/']},
  {id: 'records', label: '病历模板', href: '/bl', nav: true, routes: ['/bl', '/bl/:path*']},
  {id: 'classification', label: '疾病分型', href: '/classification', nav: true,
    routes: ['/classification', '/classification/', '/classification/:path*']},
  {id: 'ecg', label: '心电图', href: '/ecg', nav: true, routes: ['/ecg', '/ecg/', '/ecg/:path*']},
  {id: 'pathway', label: '临床路径', href: '/pathway', nav: true, routes: ['/pathway', '/pathway/']},
  {id: 'duty', label: '值班资料', href: '/duty', nav: true, routes: ['/duty', '/duty/']},
  {id: 'tools', label: '临床工具', href: '/tools', nav: true, routes: ['/tools', '/tools/']},
  {id: 'admin', label: '管理入口', href: '/admin', nav: true, routes: ['/admin', '/admin/', '/admin/password']}
].map(Object.freeze));

// Departments and which sections already have material for them.
// `classification: false` keeps the department visible as a reserved area.
// Context-specific presentation retains existing copy. department-build.mjs
// generates homepage cards, compiled router metadata and classification lists.
export const DEPARTMENTS = Object.freeze([
  {slug: 'guke', name: '骨科', records: true, classification: true, pathway: true,
    presentation: Object.freeze({
      homeIcon: '骨',
      homeDescription: '创伤 · 关节置换',
      recordsDescription: '创伤、关节置换及围手术期模板',
      classificationDescription: '骨折及关节损伤分型与手术指征'
    })},
  {slug: 'puwai', name: '普外科', records: true, classification: false, pathway: false,
    presentation: Object.freeze({
      homeIcon: '外',
      homeDescription: '腹部外科 · 外科病历',
      recordsDescription: '腹部外科及常见外科病历模板',
      classificationDescription: '预留疾病分期、分级和手术指征'
    })},
  {slug: 'shennei', name: '肾内科', records: true, classification: false, pathway: false,
    presentation: Object.freeze({
      homeIcon: '肾',
      homeDescription: '肾功能 · 内科记录',
      recordsDescription: '肾脏内科、AKI及透析相关模板',
      classificationDescription: '预留肾脏疾病分型与风险分层'
    })},
  {slug: 'fuke', name: '妇科', records: true, classification: false, pathway: false,
    presentation: Object.freeze({
      homeIcon: '妇',
      homeDescription: '妇科疾病 · 围手术期',
      recordsDescription: '妇科常见疾病及围手术期模板',
      classificationDescription: '预留妇科疾病分期和治疗指征'
    })}
].map(Object.freeze));

// Every hand-written main navigation in the source HTML.
// `variant` names the markup family:
//   official  <nav class="global-links official-links" aria-label="主导航">, active = a.active
//   tools     <header class="nav"><div class="navin">…<nav aria-label="主导航">, active = a.active
//   library   <div class="top-actions library-top-actions">, active = a.library-active-link
//   legacy    the hidden #dutyPage block inside index.html (no active item)
// `exclude` and `tagline` record today's known drift. Phase 1 keeps it as is;
// fixing it is a visible UI change that belongs in its own reviewed PR.
export const NAV_SURFACES = Object.freeze([
  {file: 'index.html', region: 'portalHome', variant: 'official', active: 'home'},
  {file: 'home.html', variant: 'official', active: 'home', generatedFrom: 'index.html'},
  {file: 'classification.html', variant: 'official', active: 'classification', ariaCurrent: true},
  {file: 'ecg.html', variant: 'official', active: 'ecg', ariaCurrent: true},
  {file: 'pathway.html', variant: 'official', active: 'pathway'},
  {file: 'duty.html', variant: 'official', active: 'duty', tagline: 'Clinical Workspace'},
  {file: 'admin.html', variant: 'official', active: 'admin'},
  {file: 'tools.html', variant: 'tools', active: 'tools', tagline: 'Clinical Workspace'},
  {file: 'index.html', region: 'libraryShell', variant: 'library', active: 'records'},
  {file: 'index.html', region: 'dutyPage', variant: 'legacy', active: null, exclude: ['duty'], legacy: true}
].map(Object.freeze));

export function navModules(surface) {
  const excluded = new Set(surface.exclude || []);
  return MODULES.filter(module => module.nav && !excluded.has(module.id));
}
