/* ============================================================
   MERIDIAN · imperative shell: overlays, palette, toasts, theme switch
   React владеет разметкой темы, этот модуль — оверлеями и клавишами
   (та же модель, что в v1: innerHTML + делегирование событий).
   ============================================================ */
import { flushSync } from 'react-dom';
import { buildViewModel, toCSV, RANGES, SEGMENTS } from './data';
import type { ViewModel } from './data';
import { getState, setState } from './store';
import { themeMeta, THEME_IDS, THEME_LOADERS, loadPosters } from './themes';
import type { ThemeMeta } from './themes';
import {
  studioHTML, paletteHTML, paletteResults, paletteListHTML,
  drawerHTML, attentionHTML,
} from './overlays';
import type { PaletteGroup, PaletteItem } from './overlays';

let currentVm: ViewModel | null = null;
export function setCurrentVm(vm: ViewModel | null) { currentVm = vm; }
export function getVm(): ViewModel | null { return currentVm; }

let pendingFocusSearch = false;
export function consumeFocusSearch() {
  const v = pendingFocusSearch;
  pendingFocusSearch = false;
  return v;
}

const el = (id: string) => document.getElementById(id) as HTMLElement;

/* ---------------- toast ---------------- */
export function toast(msg: string) {
  const root = el('toast-root');
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  root.appendChild(t);
  requestAnimationFrame(() => t.classList.add('is-in'));
  setTimeout(() => {
    t.classList.remove('is-in');
    setTimeout(() => t.remove(), 300);
  }, 2200);
}

/* ---------------- export ---------------- */
export function exportCSV() {
  const vm = currentVm;
  if (!vm) return;
  const s = getState();
  const csv = toCSV(vm.accounts);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `meridian-${s.segment}-${s.range}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast(`Экспорт: ${vm.accounts.length} аккаунтов`);
}

/* ---------------- studio ---------------- */
let studioEl: HTMLElement | null = null;
let postersCache: Record<string, string> | null = null;

export async function openStudio() {
  closePalette();
  const root = el('overlay-root');
  root.innerHTML = '';
  document.body.classList.add('no-scroll');
  if (!postersCache) {
    try { postersCache = await loadPosters(); } catch { postersCache = {}; }
  }
  const themes: ThemeMeta[] = THEME_IDS.map(id => ({ ...themeMeta(id)!, poster: postersCache![id] || '' }));
  root.innerHTML = studioHTML(themes, getState().theme);
  studioEl = root.querySelector('.studio');
  requestAnimationFrame(() => studioEl?.classList.add('is-in'));
  studioEl?.focus?.({ preventScroll: true });
}

export function closeStudio() {
  const s = studioEl;
  if (!s) return;
  studioEl = null;
  s.classList.remove('is-in');
  document.body.classList.remove('no-scroll');
  if (location.hash === '#studio') {
    try { history.replaceState(null, '', '#' + getState().theme); } catch { /* noop */ }
  }
  setTimeout(() => {
    if (!studioEl) el('overlay-root').innerHTML = '';
  }, 220);
}

/* ---------------- palette ---------------- */
let palGroups: PaletteGroup[] = [];
let palFlat: PaletteItem[] = [];
let palIndex = 0;

export function openPalette() {
  closeStudio();
  el('palette-root').innerHTML = paletteHTML();
  document.body.classList.add('no-scroll');
  const input = document.getElementById('palette-input') as HTMLInputElement;
  input.focus();
  updatePalette('');
  input.addEventListener('input', () => updatePalette(input.value));
}

function themeList(): ThemeMeta[] {
  return THEME_IDS.map(id => themeMeta(id)!);
}

function updatePalette(q: string) {
  if (!currentVm) return;
  palGroups = paletteResults(q, themeList(), currentVm.allAccounts);
  palFlat = palGroups.flatMap(g => g.items);
  palIndex = Math.min(palIndex, Math.max(0, palFlat.length - 1));
  const list = document.getElementById('palette-list');
  if (list) list.innerHTML = paletteListHTML(palGroups, palIndex);
}

export function movePalette(delta: number) {
  if (!palFlat.length) return;
  palIndex = (palIndex + delta + palFlat.length) % palFlat.length;
  const list = document.getElementById('palette-list');
  if (list) list.innerHTML = paletteListHTML(palGroups, palIndex);
  list?.querySelector('.p-item.is-active')?.scrollIntoView({ block: 'nearest' });
}

export function closePalette() {
  const root = el('palette-root');
  if (!root.innerHTML) return;
  root.innerHTML = '';
  document.body.classList.remove('no-scroll');
}

function runPaletteItem(item: PaletteItem | undefined) {
  if (!item) return;
  closePalette();
  const r = item.run;
  if (r.type === 'theme') switchTheme(r.id!);
  else if (r.type === 'range') setRange(r.id!);
  else if (r.type === 'segment') setSegment(r.id!);
  else if (r.type === 'account') setTimeout(() => openAccount(r.id!), 80);
  else if (r.type === 'studio') openStudio();
  else if (r.type === 'export') exportCSV();
  else if (r.type === 'compare') toggleCompare();
}

/* ---------------- drawer ---------------- */
export function openAccount(id: string) {
  const vm = currentVm;
  if (!vm) return;
  const a = vm.getAccount(id);
  if (!a) return;
  closeAttention();
  const root = el('drawer-root');
  root.innerHTML = drawerHTML(a, null);
  document.body.classList.add('no-scroll');
  const drawer = root.querySelector('.drawer') as HTMLElement;
  drawer.tabIndex = -1;
  requestAnimationFrame(() => {
    drawer.classList.add('is-open');
    root.querySelector('.drawer-scrim')?.classList.add('is-open');
    drawer.focus({ preventScroll: true });
  });
}

export function closeDrawer(instant = false) {
  const root = el('drawer-root');
  const drawer = root.querySelector('.drawer') as HTMLElement | null;
  if (!drawer) return;
  drawer.classList.remove('is-open');
  root.querySelector('.drawer-scrim')?.classList.remove('is-open');
  document.body.classList.remove('no-scroll');
  if (instant) { root.innerHTML = ''; return; }
  setTimeout(() => {
    if (!drawer.classList.contains('is-open')) root.innerHTML = '';
  }, 420);
}

/* ---------------- attention popover ---------------- */
let attnRoot: HTMLElement | null = null;

function attnContainer() {
  if (!attnRoot) {
    attnRoot = document.createElement('div');
    attnRoot.id = 'attn-root';
    document.body.appendChild(attnRoot);
  }
  return attnRoot;
}

export function openAttention(anchor: HTMLElement) {
  const root = attnContainer();
  if (root.querySelector('.attn')) { closeAttention(); return; }
  if (!currentVm) return;
  root.innerHTML = attentionHTML(currentVm.riskAccounts);
  const pop = root.querySelector('.attn') as HTMLElement;
  const r = anchor.getBoundingClientRect();
  const w = 300;
  const left = Math.min(Math.max(8, r.right - w), window.innerWidth - w - 8);
  pop.style.left = left + 'px';
  pop.style.top = (r.bottom + 8) + 'px';
  requestAnimationFrame(() => {
    pop.classList.add('is-in');
    pop.focus({ preventScroll: true });
  });
  anchor.setAttribute('aria-expanded', 'true');
}

export function closeAttention() {
  if (!attnRoot) return;
  const pop = attnRoot.querySelector('.attn');
  if (!pop) return;
  pop.classList.remove('is-in');
  document.querySelectorAll('[data-action="attention"]').forEach(b => b.setAttribute('aria-expanded', 'false'));
  setTimeout(() => {
    if (attnRoot && !attnRoot.querySelector('.attn.is-in')) attnRoot.innerHTML = '';
  }, 180);
}

export function toggleAttention(anchor: HTMLElement) {
  if (attnRoot?.querySelector('.attn')) closeAttention();
  else openAttention(anchor);
}

/* ---------------- actions for themes ---------------- */
export function setRange(id: string) {
  if (!RANGES.some(r => r.id === id) || getState().range === id) return;
  setState({ range: id });
  toast(`Период: ${RANGES.find(r => r.id === id)!.label.toLowerCase()}`);
}

export function setSegment(id: string) {
  if (!SEGMENTS.some(s => s.id === id) || getState().segment === id) return;
  setState({ segment: id });
  toast(`Сегмент: ${SEGMENTS.find(s => s.id === id)!.label}`);
}

export function setSort(key: string) {
  if (!key) return;
  const s = getState();
  if (s.sort?.key === key) setState({ sort: { key, dir: s.sort.dir === 'asc' ? 'desc' : 'asc' } });
  else setState({ sort: { key, dir: key === 'name' ? 'asc' : 'desc' } });
}

export function toggleCompare() {
  const next = !getState().compare;
  setState({ compare: next });
  toast(next ? 'Сравнение включено' : 'Сравнение скрыто');
}

export function requestFocusSearch() { pendingFocusSearch = true; }

export function rerender(opts: { keepScroll?: boolean; focusSearch?: boolean } = {}) {
  if (opts.focusSearch) requestFocusSearch();
  // state уже изменён через setState — React перерисует тему;
  // функция нужна только как совместимый вход для старых вызовов.
  setState({});
}

/* ---------------- theme switching (View Transitions + curtain) ---------------- */
const switchToken = { current: 0 };

function curtainInner(t: ThemeMeta) {
  return `<div class="curtain-inner">
    <span class="curtain-num">${t.num}</span>
    <span class="curtain-name">${t.name}</span>
    <span class="curtain-en">${t.en}</span>
  </div>`;
}

export async function switchTheme(id: string, opts: { instant?: boolean } = {}) {
  const t = themeMeta(id);
  if (!t) return;
  if (id === getState().theme) { closeStudio(); return; }
  closePalette();
  closeDrawer(true);
  closeAttention();

  // Чанк темы (JS+CSS) должен быть готов до старта перехода,
  // иначе в снапшоте окажется пустой экран.
  try { await THEME_LOADERS[id](); } catch { return; }

  try { history.replaceState(null, '', '#' + id); } catch { /* noop */ }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const instant = reduced || opts.instant || !document.startViewTransition;

  const apply = () => {
    document.documentElement.style.setProperty('--curtain-bg', t.bg || '#08090c');
    flushSync(() => setState({ theme: id }));
    closeStudio();
  };

  if (instant) { apply(); return; }

  const token = ++switchToken.current;
  const vt = document.startViewTransition(apply);
  vt.finished.catch(() => {}).finally(() => {
    if (token === switchToken.current) el('curtain').innerHTML = '';
  });

  const curtain = el('curtain');
  curtain.innerHTML = curtainInner(t);
  curtain.style.setProperty('--curtain-bg', t.bg || '#08090c');
  curtain.style.setProperty('--curtain-accent', t.accent || '#fff');
  curtain.classList.add('is-on');
  const hide = () => { if (token === switchToken.current) curtain.classList.remove('is-on'); };
  vt.ready.then(hide).catch(hide);
  // headless-браузер не разрешает vt.ready — страховка от зависшего занавеса
  setTimeout(hide, 480);
}

/** Предзагрузка чанка темы по наведению — переход без ожидания сети. */
export function prefetchTheme(id: string) {
  THEME_LOADERS[id]?.().catch(() => {});
}

/* ---------------- global delegation ---------------- */
let searchTimer = 0;

let eventsBound = false;

export function initGlobalEvents() {
  // StrictMode в dev монтирует App дважды — слушатели не должны дублироваться.
  if (eventsBound) return;
  eventsBound = true;

  document.addEventListener('click', e => {
    const target = e.target as HTMLElement;
    if (attnRoot?.querySelector('.attn') && !target.closest('.attn') && !target.closest('[data-action="attention"]')) closeAttention();

    const range = target.closest('[data-range]') as HTMLElement | null;
    if (range) { setRange(range.dataset.range!); return; }

    const seg = target.closest('[data-segment]') as HTMLElement | null;
    if (seg) { setSegment(seg.dataset.segment!); return; }

    const themePick = target.closest('[data-theme-pick]') as HTMLElement | null;
    if (themePick) { switchTheme(themePick.dataset.themePick!); return; }

    if (target.closest('[data-theme-open]')) { openStudio(); return; }
    if (target.closest('[data-open-palette]')) { openPalette(); return; }

    const account = target.closest('[data-account-id]') as HTMLElement | null;
    if (account) { openAccount(account.dataset.accountId!); return; }

    const sort = target.closest('[data-sort]') as HTMLElement | null;
    if (sort) { setSort(sort.dataset.sort!); return; }

    const scrollTo = target.closest('[data-scroll]') as HTMLElement | null;
    if (scrollTo) {
      document.getElementById(scrollTo.dataset.scroll!)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    const action = target.closest('[data-action]') as HTMLElement | null;
    if (action) {
      const a = action.dataset.action!;
      if (a === 'export') exportCSV();
      if (a === 'compare') toggleCompare();
      if (a === 'palette') openPalette();
      if (a === 'studio') openStudio();
      if (a === 'attention') toggleAttention(action);
      return;
    }

    const copy = target.closest('[data-copy-email]') as HTMLElement | null;
    if (copy) {
      const email = copy.dataset.copyEmail!;
      if (navigator.clipboard?.writeText) navigator.clipboard.writeText(email).catch(() => {});
      toast('E-mail скопирован: ' + email);
      return;
    }

    if (target.closest('[data-close-studio]')) { closeStudio(); return; }
    if (target.closest('[data-close-palette]')) { closePalette(); return; }
    if (target.closest('[data-close-drawer]')) { closeDrawer(); return; }

    const palItem = target.closest('[data-pal-key]') as HTMLElement | null;
    if (palItem) {
      const item = palFlat[Number(palItem.dataset.palIndex)];
      if (item) runPaletteItem(item);
    }
  });

  document.addEventListener('pointerover', e => {
    const pick = (e.target as HTMLElement).closest('[data-theme-pick]') as HTMLElement | null;
    if (pick?.dataset.themePick) prefetchTheme(pick.dataset.themePick);
  });

  document.addEventListener('change', e => {
    const sel = (e.target as HTMLElement).closest('[data-segment-select]') as HTMLSelectElement | null;
    if (sel) setSegment(sel.value);
  });

  document.addEventListener('input', e => {
    const input = (e.target as HTMLElement).closest('[data-search]') as HTMLInputElement | null;
    if (!input) return;
    clearTimeout(searchTimer);
    const value = input.value;
    searchTimer = window.setTimeout(() => {
      pendingFocusSearch = true;
      setState({ search: value });
    }, 110);
  });

  document.addEventListener('keydown', e => {
    const paletteOpen = !!el('palette-root').querySelector('.palette');
    const studioOpen = !!el('overlay-root').querySelector('.studio');
    const drawerOpen = !!el('drawer-root').querySelector('.drawer');
    const attnOpen = !!attnRoot?.querySelector('.attn');

    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      closeAttention();
      paletteOpen ? closePalette() : openPalette();
      return;
    }
    if (e.key === 'Escape') {
      if (attnOpen) { closeAttention(); return; }
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
    const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (document.activeElement as HTMLElement | null)?.isContentEditable;
    if (!typing && /^[0-9]$/.test(e.key)) {
      const idx = e.key === '0' ? 9 : Number(e.key) - 1;
      const id = THEME_IDS[idx];
      if (id) { e.preventDefault(); switchTheme(id); }
    }
  });

  window.addEventListener('hashchange', () => {
    const id = location.hash.replace('#', '');
    if (id === 'studio') { openStudio(); return; }
    if (el('overlay-root').querySelector('.studio')) closeStudio();
    if (THEME_IDS.includes(id) && id !== getState().theme) switchTheme(id, { instant: true });
  });
}
