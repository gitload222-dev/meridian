/* MERIDIAN · shared UI fragments (typed port) */
import { RANGES, SEGMENTS, fmtDelta } from './data';
import type { Account, Kpi, AppState } from './data';

export const ICONS: Record<string, string> = {
  search: '<circle cx="10.5" cy="10.5" r="6.2"/><path d="M15.2 15.2 20 20"/>',
  close: '<path d="M5 5l14 14M19 5 5 19"/>',
  up: '<path d="M6 15 12 9l6 6"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  arrowUpRight: '<path d="M7 17 17 7M8 7h9v9"/>',
  arrowRight: '<path d="M4 12h15M13 6l6 6-6 6"/>',
  arrowDown: '<path d="M12 4v15M6 13l6 6 6-6"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  chevronRight: '<path d="m9 5 7 7-7 7"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1"/><rect x="13.5" y="3.5" width="7" height="7" rx="1"/><rect x="3.5" y="13.5" width="7" height="7" rx="1"/><rect x="13.5" y="13.5" width="7" height="7" rx="1"/>',
  layers: '<path d="m12 3 8.5 4.8L12 12.6 3.5 7.8 12 3Z"/><path d="m3.5 12.2 8.5 4.8 8.5-4.8"/><path d="m3.5 16.4 8.5 4.8 8.5-4.8"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19.5c.5-3.2 2.6-5 5.5-5s5 1.8 5.5 5"/><path d="M16 5.4a3.2 3.2 0 0 1 0 5.2M17.2 14.9c2.1.6 3.4 2.2 3.8 4.6"/>',
  wallet: '<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18M16 14.5h2.5"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  activity: '<path d="M3 12h4l2.5-6 4 12 2.5-6H21"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M4 20h16"/>',
  command: '<path d="M9 6.5a2.5 2.5 0 1 0-2.5 2.5H9m0-2.5V9m0 0h6m0 0V6.5A2.5 2.5 0 1 1 17.5 9H15m0 0v6m0 0h2.5a2.5 2.5 0 1 1-2.5 2.5V15m0 0H9m0 0v2.5A2.5 2.5 0 1 1 6.5 15H9"/>',
  check: '<path d="m4 12.5 5 5L20 6.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  filter: '<path d="M3 5h18l-7 8v6l-4 2v-8L3 5Z"/>',
  bell: '<path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 19a2 2 0 0 0 4 0"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z"/>',
  snow: '<path d="M12 2v20M3.3 7l17.4 10M20.7 7 3.3 17"/><path d="m9 4 3 3 3-3M9 20l3-3 3 3M5 9.5 6.5 13l3.5-1M19 14.5 17.5 11 14 12"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="M18.5 16.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.4 3.6 5.3 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.3-3.6-8.5s1.2-6.1 3.6-8.5Z"/>',
  lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
  external: '<path d="M14 4h6v6M20 4l-8 8"/><path d="M18 14v5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 19V8a1.5 1.5 0 0 1 1.5-1.5H10"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  leaf: '<path d="M20 4C11 4 5 8 5 15c0 3 2 5 5 5 7 0 10-6 10-16Z"/><path d="M4 21c2-6 6-10 12-13"/>',
  flame: '<path d="M12 21c4 0 7-2.7 7-6.4 0-4.6-5-6.1-5-10.6-2 .8-3.4 2.5-3.4 4.6 0 1.7.8 2.6.8 3.6 0 1.2-.9 2-2 2s-1.9-.8-1.9-2.2C6 13.4 5 15.4 5 17c0 2.4 3 4 7 4Z"/>',
  gift: '<rect x="3.5" y="8" width="17" height="13" rx="1.5"/><path d="M3.5 12h17M12 8v13M12 8c-1.5-3.5-6-3.6-6-1 0 1.8 3 1 6 1ZM12 8c1.5-3.5 6-3.6 6-1 0 1.8-3 1-6 1Z"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z"/>',
  print: '<path d="M7 8V3h10v5M7 17H4V9h16v8h-3"/><rect x="7" y="14" width="10" height="7"/>',
  compass: '<circle cx="12" cy="12" r="8.5"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/>',
  wave: '<path d="M2 12c2.5 0 2.5-5 5-5s2.5 10 5 10 2.5-10 5-10 2.5 5 5 5"/>',
};

export function icon(name: string, size = 18, cls = '') {
  return `<svg class="ico ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

export function logo(size = 26, cls = '') {
  return `<svg class="brand-mark ${cls}" width="${size}" height="${size}" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <circle cx="16" cy="16" r="13" stroke="currentColor" stroke-width="1.3" opacity=".45"/>
    <ellipse cx="16" cy="16" rx="6.2" ry="13" stroke="currentColor" stroke-width="1.3" opacity=".7"/>
    <path d="M3 16h26" stroke="currentColor" stroke-width="1.3" opacity=".45"/>
    <circle cx="16" cy="16" r="2.4" fill="currentColor"/>
  </svg>`;
}

export function delta(kpi: Kpi, opts: { cls?: string; size?: number } = {}) {
  const good = kpi.good;
  return `<span class="delta ${good ? 'is-good' : 'is-bad'} ${opts.cls || ''}">
    ${icon(good ? 'arrowUpRight' : 'arrowDownRight', opts.size || 13)}
    <span>${kpi.deltaLabel}</span>
  </span>`;
}

export function rangeControl(prefix: string, state: AppState) {
  return `<div class="${prefix}-ranges ctl-range" role="group" aria-label="Период">
    ${RANGES.map(r => `<button class="ctl ${state.range === r.id ? 'is-on' : ''}" data-range="${r.id}" aria-pressed="${state.range === r.id}">${r.label}</button>`).join('')}
  </div>`;
}

export function rangeShort(prefix: string, state: AppState) {
  return `<div class="${prefix}-ranges ctl-range" role="group" aria-label="Период">
    ${RANGES.map(r => `<button class="ctl ${state.range === r.id ? 'is-on' : ''}" data-range="${r.id}" aria-pressed="${state.range === r.id}">${r.short}</button>`).join('')}
  </div>`;
}

export function segmentControl(prefix: string, state: AppState, { short = false }: { short?: boolean } = {}) {
  return `<div class="${prefix}-segments ctl-segments" role="group" aria-label="Сегмент">
    ${SEGMENTS.map(s => `<button class="ctl ${state.segment === s.id ? 'is-on' : ''}" data-segment="${s.id}" aria-pressed="${state.segment === s.id}">${short ? s.short : s.label}</button>`).join('')}
  </div>`;
}

export function segmentSelect(prefix: string, state: AppState) {
  return `<label class="${prefix}-select">
    <span class="sr-only">Сегмент</span>
    <select data-segment-select>
      ${SEGMENTS.map(s => `<option value="${s.id}" ${state.segment === s.id ? 'selected' : ''}>${s.label}</option>`).join('')}
    </select>
    ${icon('chevron', 14)}
  </label>`;
}

export function healthColor(h: number) {
  return h >= 80 ? 'var(--good)' : h >= 65 ? 'var(--warn, #d9a441)' : 'var(--bad)';
}

export function avatar(a: Account, cls = '') {
  return `<span class="avatar ${cls}" style="--av:${a.color}" aria-hidden="true">${a.initials}</span>`;
}

export function pctDelta(v: number) { return fmtDelta(v); }

export function tinyBars(values: number[], cls = '') {
  const max = Math.max(...values);
  return `<span class="tiny-bars ${cls}" aria-hidden="true">${values.map(v =>
    `<i style="height:${Math.max(8, Math.round(v / max * 100))}%"></i>`).join('')}</span>`;
}

export function countUp(el: HTMLElement | null | undefined, target: number, formatter: (v: number) => string, duration = 900) {
  if (!el) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = formatter(target);
    return;
  }
  const t0 = performance.now();
  const frame = now => {
    const t = Math.min(1, (now - t0) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = formatter(target * eased);
    if (t < 1) requestAnimationFrame(frame);
    else el.textContent = formatter(target);
  };
  requestAnimationFrame(frame);
}

export function themeButton(prefix: string, themeName: string) {
  return `<button class="${prefix}-concept" data-theme-open aria-label="Сменить визуальную концепцию">
    <span class="concept-dot"></span>
    <span class="concept-label">${themeName}</span>
    ${icon('grid', 14)}
  </button>`;
}
