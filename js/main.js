/* ============================================================
   MERIDIAN · app shell / state / orchestration
   ============================================================ */
import { buildViewModel, toCSV, fmtMoney, fmtInt, fmtPct, fmtDelta, RANGES, SEGMENTS } from './data.js';
import { THEMES } from './themes/index.js';
import { studioHTML, paletteHTML, paletteResults, paletteListHTML, drawerHTML } from './overlays.js';

const app = document.getElementById('app');
const overlayRoot = document.getElementById('overlay-root');
const paletteRoot = document.getElementById('palette-root');
const drawerRoot = document.getElementById('drawer-root');
const curtain = document.getElementById('curtain');
const toastRoot = document.getElementById('toast-root');
const boot = document.getElementById('boot');

const KEY = 'meridian.ui.v1';

function loadState() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { /* noop */ }
  const hash = location.hash.replace('#', '');
  return {
    theme: THEMES.some(t => t.id === hash) ? hash : (saved.theme && THEMES.some(t => t.id === saved.theme) ? saved.theme : 'azure'),
    range: RANGES.some(r => r.id === saved.range) ? saved.range : '30d',
    segment: SEGMENTS.some(s => s.id === saved.segment) ? saved.segment : 'all',
    search: '',
    sort: saved.sort || { key: 'mrr', dir: 'desc' },
    compare: saved.compare !== false,
  };
}

const state = loadState();
let vm = null;
let switchToken = 0;
let palGroups = [];
let palFlat = [];
let palIndex = 0;
let searchTimer = 0;

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      theme: state.theme, range: state.range, segment: state.segment,
      sort: state.sort, compare: state.compare,
    }));
  } catch { /* noop */ }
}

function currentTheme() { return THEMES.find(t => t.id === state.theme) || THEMES[0]; }
const wait = ms => new Promise(r => setTimeout(r, ms));

const api = {
  state,
  setRange, setSegment, setSort,
  openStudio, closeStudio, openPalette, openAccount, closeDrawer,
  switchTheme, exportCSV, toggleCompare, toast,
  rerender: opts => render(opts),
  fmt: { money: fmtMoney, int: fmtInt, pct: fmtPct, delta: fmtDelta },
};

/* ---------------- render ---------------- */
function render(opts = {}) {
  vm = buildViewModel(state);
  const t = currentTheme();
  document.documentElement.dataset.theme = t.id;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', t.bg || '#0b0d12');

  const scrollY = opts.keepScroll ? window.scrollY : 0;
  app.innerHTML = t.render(vm, api);
  t.mount?.(app, vm, api);
  if (opts.keepScroll) window.scrollTo(0, scrollY);
  else window.scrollTo(0, 0);

  if (opts.focusSearch) {
    const el = app.querySelector('[data-search]');
    if (el) {
      el.focus();
      const len = el.value.length;
      try { el.setSelectionRange(len, len); } catch { /* noop */ }
    }
  }
  document.body.dataset.ready = 'true';
  if (boot && !boot.classList.contains('is-done')) {
    boot.classList.add('is-done');
    setTimeout(() => boot.remove(), 700);
  }
}

function setRange(id) {
  if (!RANGES.some(r => r.id === id) || state.range === id) return;
  state.range = id; save(); render({ keepScroll: true });
  toast(`Период: ${RANGES.find(r => r.id === id).label.toLowerCase()}`);
}

function setSegment(id) {
  if (!SEGMENTS.some(s => s.id === id) || state.segment === id) return;
  state.segment = id; save(); render({ keepScroll: true });
  toast(`Сегмент: ${SEGMENTS.find(s => s.id === id).label}`);
}

function setSort(key) {
  if (!key) return;
  if (state.sort?.key === key) state.sort = { key, dir: state.sort.dir === 'asc' ? 'desc' : 'asc' };
  else state.sort = { key, dir: key === 'name' ? 'asc' : 'desc' };
  save(); render({ keepScroll: true });
}

function toggleCompare() {
  state.compare = !state.compare; save(); render({ keepScroll: true });
  toast(state.compare ? 'Сравнение включено' : 'Сравнение скрыто');
}

/* ---------------- theme switching ---------------- */
async function switchTheme(id, opts = {}) {
  const t = THEMES.find(x => x.id === id);
  if (!t) return;
  if (t.id === state.theme) { closeStudio(); return; }
  closePalette();
  closeDrawer(true);

  state.theme = t.id; save();
  try { history.replaceState(null, '', '#' + t.id); } catch { /* noop */ }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || opts.instant) {
    render(); closeStudio(); return;
  }

  const token = ++switchToken;
  const t0 = performance.now();
  curtain.innerHTML = `<div class="curtain-inner">
    <span class="curtain-num">${t.num}</span>
    <span class="curtain-name">${t.name}</span>
    <span class="curtain-en">${t.en}</span>
  </div>`;
  curtain.style.setProperty('--curtain-bg', t.bg || '#08090c');
  curtain.style.setProperty('--curtain-accent', t.accent || '#fff');
  // 1) Занавес плавно закрывается (~200 мс).
  curtain.classList.add('is-on');
  await wait(210);
  if (token !== switchToken) return;
  // 2) Полностью за непрозрачным занавесом меняем тему — swap DOM не виден.
  render();
  closeStudio();
  // Даём первому кадру новой темы отрисоваться, чтобы открытие было чистым.
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  if (token !== switchToken) return;
  // 3) Плавно открываем уже готовую тему.
  curtain.classList.remove('is-on');
}

/* ---------------- studio ---------------- */
function openStudio() {
  closePalette();
  overlayRoot.innerHTML = studioHTML(THEMES, state.theme);
  document.body.classList.add('no-scroll');
  requestAnimationFrame(() => overlayRoot.querySelector('.studio')?.classList.add('is-in'));
  overlayRoot.querySelector('.studio')?.focus?.({ preventScroll: true });
}
function closeStudio() {
  const el = overlayRoot.querySelector('.studio');
  if (!el) return;
  el.classList.remove('is-in');
  document.body.classList.remove('no-scroll');
  if (location.hash === '#studio') {
    try { history.replaceState(null, '', '#' + state.theme); } catch { /* noop */ }
  }
  setTimeout(() => { if (overlayRoot.querySelector('.studio') === el) overlayRoot.innerHTML = ''; }, 220);
}

/* ---------------- palette ---------------- */
function openPalette() {
  closeStudio();
  paletteRoot.innerHTML = paletteHTML();
  document.body.classList.add('no-scroll');
  const input = document.getElementById('palette-input');
  input.focus();
  updatePalette('');
  input.addEventListener('input', () => updatePalette(input.value));
}
function updatePalette(q) {
  palGroups = paletteResults(q, THEMES, vm.allAccounts);
  palFlat = palGroups.flatMap(g => g.items);
  palIndex = Math.min(palIndex, Math.max(0, palFlat.length - 1));
  const list = document.getElementById('palette-list');
  if (list) list.innerHTML = paletteListHTML(palGroups, palIndex);
}
function movePalette(delta) {
  if (!palFlat.length) return;
  palIndex = (palIndex + delta + palFlat.length) % palFlat.length;
  const list = document.getElementById('palette-list');
  if (list) list.innerHTML = paletteListHTML(palGroups, palIndex);
  list?.querySelector('.p-item.is-active')?.scrollIntoView({ block: 'nearest' });
}
function closePalette() {
  if (!paletteRoot.innerHTML) return;
  paletteRoot.innerHTML = '';
  document.body.classList.remove('no-scroll');
}
function runPaletteItem(item) {
  if (!item) return;
  closePalette();
  const r = item.run;
  if (r.type === 'theme') switchTheme(r.id);
  else if (r.type === 'range') setRange(r.id);
  else if (r.type === 'segment') setSegment(r.id);
  else if (r.type === 'account') setTimeout(() => openAccount(r.id), 80);
  else if (r.type === 'studio') openStudio();
  else if (r.type === 'export') exportCSV();
  else if (r.type === 'compare') toggleCompare();
}

/* ---------------- drawer ---------------- */
function openAccount(id) {
  const a = vm.getAccount(id);
  if (!a) return;
  drawerRoot.innerHTML = drawerHTML(a, api);
  document.body.classList.add('no-scroll');
  const drawer = drawerRoot.querySelector('.drawer');
  drawer.tabIndex = -1;
  requestAnimationFrame(() => {
    drawer.classList.add('is-open');
    drawerRoot.querySelector('.drawer-scrim')?.classList.add('is-open');
    drawer.focus({ preventScroll: true });
  });
}
function closeDrawer(instant = false) {
  const drawer = drawerRoot.querySelector('.drawer');
  if (!drawer) return;
  drawer.classList.remove('is-open');
  drawerRoot.querySelector('.drawer-scrim')?.classList.remove('is-open');
  document.body.classList.remove('no-scroll');
  if (instant) { drawerRoot.innerHTML = ''; return; }
  setTimeout(() => { if (!drawer.classList.contains('is-open')) drawerRoot.innerHTML = ''; }, 420);
}

/* ---------------- toast / export ---------------- */
function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  toastRoot.appendChild(el);
  requestAnimationFrame(() => el.classList.add('is-in'));
  setTimeout(() => {
    el.classList.remove('is-in');
    setTimeout(() => el.remove(), 300);
  }, 2200);
}

function exportCSV() {
  const csv = toCSV(vm.accounts);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `meridian-${state.segment}-${state.range}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast(`Экспорт: ${vm.accounts.length} аккаунтов`);
}

/* ---------------- global events ---------------- */
document.addEventListener('click', e => {
  const range = e.target.closest('[data-range]');
  if (range) { setRange(range.dataset.range); return; }

  const seg = e.target.closest('[data-segment]');
  if (seg) { setSegment(seg.dataset.segment); return; }

  const themePick = e.target.closest('[data-theme-pick]');
  if (themePick) { switchTheme(themePick.dataset.themePick); return; }

  const studioOpen = e.target.closest('[data-theme-open]');
  if (studioOpen) { openStudio(); return; }

  const paletteOpen = e.target.closest('[data-open-palette]');
  if (paletteOpen) { openPalette(); return; }

  const account = e.target.closest('[data-account-id]');
  if (account) { openAccount(account.dataset.accountId); return; }

  const sort = e.target.closest('[data-sort]');
  if (sort) { setSort(sort.dataset.sort); return; }

  const scrollTo = e.target.closest('[data-scroll]');
  if (scrollTo) {
    document.getElementById(scrollTo.dataset.scroll)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }

  const action = e.target.closest('[data-action]');
  if (action) {
    const a = action.dataset.action;
    if (a === 'export') exportCSV();
    if (a === 'compare') toggleCompare();
    if (a === 'palette') openPalette();
    if (a === 'studio') openStudio();
    return;
  }

  const copy = e.target.closest('[data-copy-email]');
  if (copy) {
    const email = copy.dataset.copyEmail;
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(email).catch(() => {});
    toast('E-mail скопирован: ' + email);
    return;
  }

  if (e.target.closest('[data-close-studio]')) { closeStudio(); return; }
  if (e.target.closest('[data-close-palette]')) { closePalette(); return; }
  if (e.target.closest('[data-close-drawer]')) { closeDrawer(); return; }

  const palItem = e.target.closest('[data-pal-key]');
  if (palItem) {
    const item = palFlat[Number(palItem.dataset.palIndex)];
    if (item) runPaletteItem(item);
    return;
  }
});

document.addEventListener('change', e => {
  const sel = e.target.closest('[data-segment-select]');
  if (sel) setSegment(sel.value);
});

document.addEventListener('input', e => {
  const input = e.target.closest('[data-search]');
  if (!input) return;
  clearTimeout(searchTimer);
  const value = input.value;
  searchTimer = setTimeout(() => {
    state.search = value;
    render({ keepScroll: true, focusSearch: true });
  }, 110);
});

document.addEventListener('keydown', e => {
  const paletteOpen = !!paletteRoot.querySelector('.palette');
  const studioOpen = !!overlayRoot.querySelector('.studio');
  const drawerOpen = !!drawerRoot.querySelector('.drawer');

  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    paletteOpen ? closePalette() : openPalette();
    return;
  }
  if (e.key === 'Escape') {
    if (paletteOpen) { closePalette(); return; }
    if (studioOpen) { closeStudio(); return; }
    if (drawerOpen) { closeDrawer(); return; }
  }

  if (paletteOpen) {
    if (e.key === 'ArrowDown') { e.preventDefault(); movePalette(1); }
    if (e.key === 'ArrowUp') { e.preventDefault(); movePalette(-1); }
    if (e.key === 'Enter') { e.preventDefault(); runPaletteItem(palFlat[palIndex]); }
    return;
  }

  const tag = document.activeElement?.tagName;
  const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || document.activeElement?.isContentEditable;
  if (!typing && /^[0-9]$/.test(e.key)) {
    const idx = e.key === '0' ? 9 : Number(e.key) - 1;
    if (THEMES[idx]) { e.preventDefault(); switchTheme(THEMES[idx].id); }
  }
});

window.addEventListener('hashchange', () => {
  const id = location.hash.replace('#', '');
  if (id === 'studio') { openStudio(); return; }
  if (overlayRoot.querySelector('.studio')) closeStudio();
  if (THEMES.some(t => t.id === id) && id !== state.theme) switchTheme(id, { instant: true });
});

/* ---------------- boot ---------------- */
const bootStudio = location.hash === '#studio';
try { history.replaceState(null, '', '#' + state.theme); } catch { /* noop */ }
render();
if (bootStudio) {
  try { history.replaceState(null, '', '#studio'); } catch { /* noop */ }
  setTimeout(openStudio, 60);
}
