// Site module registry: the single description of top-level sections,
// departments and every place the main navigation is rendered.
//
// Phase 1b: scripts/navigation-build.mjs renders the published navigation from
// this registry after the clinical and ECG compilers finish. The public asset
// allowlist excludes config/ and scripts/. Do not reference it from HTML and
// do not add a navigation <script> to index.html — every script listed there is
// executed by scripts/clinical-compiler.mjs as part of the clinical record chain.
//
// Main navigation (2026-11-22): every page shows the same five workspace
// destinations (工作台 / 临床 / 资料 / 学习 / 我的) — a rail or top bar on wide
// screens and a bottom tab bar on phones. Section modules name the workspace
// destination they belong to in `hub`; that destination is highlighted while
// one of its sections is open.

// The build renders every shared site header brand from these values
// (scripts/navigation-build.mjs); edit here instead of in each page.
export const SITE_BRAND = Object.freeze({
  mark: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 6c-2.5-1.7-6-2.2-9-1v13c3-1.2 6.5-1 9 1 2.5-2 6-2.2 9-1V5c-3-1.2-6.5-.7-9 1v13M15 11h3m-1.5-1.5v3"/></svg>',
  name: '哈基米工作站',
  tagline: '个人医学工作台'
});

// `routes` mirrors the existing vercel.json rewrite sources for the section.
// The registry describes routing; it does not generate vercel.json.
export const MODULES = Object.freeze([
  {id: 'home', label: '首页', href: '/', workspace: '工作台', routes: ['/']},
  {id: 'clinical', label: '临床', workspace: '临床', href: '/clinical', routes: ['/clinical', '/clinical/']},
  {id: 'materials', label: '资料', workspace: '资料', href: '/materials', routes: ['/materials', '/materials/']},
  {id: 'study', label: '学习', workspace: '学习', href: '/study', routes: ['/study', '/study/']},
  {id: 'personal', label: '我的', workspace: '我的', href: '/personal', routes: ['/personal', '/personal/']},
  {id: 'records', label: '病历模板', href: '/bl', hub: 'clinical', routes: ['/bl', '/bl/:path*']},
  {id: 'classification', label: '疾病分型', href: '/classification', hub: 'clinical',
    routes: ['/classification', '/classification/', '/classification/:path*']},
  {id: 'ecg', label: '心电图', href: '/ecg', hub: 'clinical', routes: ['/ecg', '/ecg/', '/ecg/:path*']},
  {id: 'labs', label: '检验解读', href: '/labs', hub: 'clinical', routes: ['/labs', '/labs/']},
  {id: 'pathway', label: '临床路径', href: '/pathway', hub: 'clinical', routes: ['/pathway', '/pathway/']},
  {id: 'duty', label: '值班资料', href: '/duty', hub: 'clinical', routes: ['/duty', '/duty/', '/duty/orders', '/duty/orders/']},
  {id: 'tools', label: '临床工具', href: '/tools', hub: 'clinical', routes: ['/tools', '/tools/']},
  {id: 'ortho-exam', label: '骨科专科查体', href: '/ortho-exam', hub: 'clinical', routes: ['/ortho-exam', '/ortho-exam/']},
  {id: 'note', label: 'AI 病历生成', href: '/note', hub: 'clinical', routes: ['/note', '/note/']},
  {id: 'admin', label: '管理入口', href: '/admin', hub: 'personal', routes: ['/admin', '/admin/', '/admin/password']},
  // Site-wide search is reached from the search boxes, not the main navigation.
  {id: 'search', label: '全站搜索', href: '/search', routes: ['/search', '/search/']}
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
//   workstation  the workspace pages' own header, rail and phone tabs (<nav class="ws-nav">)
//   site         the shared header, rendered whole from one template:
//                <header class="site-header …"><div class="site-header-inner">brand,
//                <nav class="site-nav" aria-label="主导航">, optional .site-header-right</div></header>
//   library      the record library keeps its own header (department branding,
//                patient and sign-in controls); only its <nav class="site-nav"> is rendered
// `active` is the module whose page this is; the navigation highlights its
// workspace destination (`navActive`). The builder marks the destination with
// aria-current="page" on its own page and aria-current="true" inside a section.
export const NAV_SURFACES = Object.freeze([
  {file: 'index.html', region: 'portalHome', variant: 'workstation', active: 'home'},
  {file: 'home.html', variant: 'workstation', active: 'home', generatedFrom: 'index.html'},
  {file: 'classification.html', variant: 'site', active: 'classification'},
  {file: 'ecg.html', variant: 'site', active: 'ecg'},
  {file: 'labs.html', variant: 'site', active: 'labs'},
  {file: 'pathway.html', variant: 'site', active: 'pathway'},
  {file: 'duty.html', variant: 'site', active: 'duty'},
  {file: 'duty-orders.html', variant: 'site', active: 'duty'},
  {file: 'admin.html', variant: 'site', active: 'admin'},
  {file: 'search.html', variant: 'site', active: null},
  {file: 'note.html', variant: 'site', active: 'note'},
  {file: 'ortho-exam.html', variant: 'site', active: 'ortho-exam'},
  {file: 'tools.html', variant: 'site', active: 'tools'},
  {file: '404.html', variant: 'site', active: null},
  {file: 'index.html', region: 'libraryShell', variant: 'library', active: 'records'}
].map(Object.freeze));

export function navModules() {
  return MODULES.filter(module => module.workspace);
}

// The workspace destination highlighted for a page: the page itself when it is
// a destination, otherwise the destination its section belongs to.
export function navActive(active) {
  if (!active) return null;
  const module = MODULES.find(entry => entry.id === active);
  if (!module) throw new Error(`Unknown navigation module: ${active}`);
  return module.workspace ? module.id : module.hub || null;
}
