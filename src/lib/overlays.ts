/* MERIDIAN · overlays: concept studio, command palette, drawer (typed port) */
import { fmtMoney, fmtInt, fmtPct, fmtDelta, SEGMENTS, RANGES } from './data';
import type { Account } from './data';
import type { ThemeMeta } from './themes';
import { icon, logo, avatar } from './ui';
import { sparkPath } from './charts';

export interface PaletteItem {
  key: string; group: string; icon: string; title: string; meta: string; hint?: string;
  run: { type: string; id?: string };
}
export interface PaletteGroup { label: string; items: PaletteItem[] }

const esc = (s: unknown) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c]);

/* ---------------- concept studio ---------------- */
export function studioHTML(themes: ThemeMeta[], activeId: string) {
  const cards = themes.map(t => `
    <button class="concept-card ${t.id === activeId ? 'is-active' : ''}" data-theme-pick="${t.id}" aria-pressed="${t.id === activeId}">
      <div class="concept-poster poster--${t.id}">
        ${t.poster || ''}
        ${t.id === activeId ? '<span class="cc-current"><i></i>Сейчас</span>' : ''}
        <span class="cc-open">Открыть ${icon('arrowUpRight', 14)}</span>
      </div>
      <div class="cc-meta">
        <div class="cc-topline">
          <span class="cc-num">${t.num}</span>
          <span class="cc-palette">${t.palette.map(c => `<i style="background:${c}"></i>`).join('')}</span>
        </div>
        <div class="cc-name">${t.name}<em>${t.en}</em></div>
        <div class="cc-tag">${t.tagline}</div>
      </div>
    </button>`).join('');

  return `<div class="studio" role="dialog" aria-modal="true" aria-label="Концепт-студия" tabindex="-1">
    <div class="studio-noise" aria-hidden="true"></div>
    <header class="studio-head">
      <div class="studio-brand">${logo(22)}<span>MERIDIAN</span><i>/</i><span class="muted">CONCEPT STUDIO</span></div>
      <div class="studio-head-right">
        <span class="studio-kbd"><kbd>1</kbd>–<kbd>0</kbd> переключение · <kbd>esc</kbd> закрыть</span>
        <button class="studio-close" data-close-studio aria-label="Закрыть студию">${icon('close', 18)}</button>
      </div>
    </header>
    <div class="studio-intro">
      <h2>Один продукт.<br><em>Десять миров.</em></h2>
      <div class="studio-intro-copy">
        <p>Каждая концепция — не перекраска, а собственная дизайн-система: композиция, типографика, характер графики и способ взаимодействия с данными.</p>
        <p class="studio-note">Выберите мир — интерфейс, данные и фильтры сохранятся.</p>
      </div>
    </div>
    <div class="studio-grid">${cards}</div>
    <footer class="studio-foot">
      <span>${themes.length} концепций · один датасет · 2026</span>
      <span class="studio-foot-hint">${icon('command', 14)} <kbd>⌘K</kbd> — быстрый переход</span>
    </footer>
  </div>`;
}

/* ---------------- command palette ---------------- */
export function paletteHTML() {
  return `<div class="palette-scrim" data-close-palette>
    <div class="palette" role="dialog" aria-modal="true" aria-label="Командная палитра">
      <div class="palette-input">
        ${icon('search', 20)}
        <input id="palette-input" type="text" placeholder="Аккаунт, концепция, период или действие…" autocomplete="off" spellcheck="false" aria-label="Поиск">
        <kbd class="palette-esc">ESC</kbd>
      </div>
      <div class="palette-list" id="palette-list" role="listbox" aria-label="Результаты"></div>
      <div class="palette-foot">
        <span><kbd>↑</kbd><kbd>↓</kbd> навигация</span>
        <span><kbd>↵</kbd> выбрать</span>
        <span class="palette-brand">${logo(14)} Meridian</span>
      </div>
    </div>
  </div>`;
}

export function paletteResults(query: string, themes: ThemeMeta[], accounts: Account[]): PaletteGroup[] {
  const q = query.trim().toLowerCase();
  const groups: PaletteGroup[] = [];
  const match = (...vals: string[]) => !q || vals.join(' ').toLowerCase().includes(q);

  const themeItems = themes
    .filter(t => match(t.name, t.en, t.id, t.tagline, t.num))
    .map(t => ({
      key: 'theme:' + t.id, group: 'Концепции', icon: 'layers',
      title: t.name, meta: `${t.en} · ${t.tagline}`, hint: t.num,
      run: { type: 'theme', id: t.id },
    }));

  const rangeItems = RANGES.filter(r => match(r.label, r.id)).map(r => ({
    key: 'range:' + r.id, group: 'Период', icon: 'calendar',
    title: r.label, meta: 'Период анализа', hint: r.short,
    run: { type: 'range', id: r.id },
  }));

  const segItems = SEGMENTS.filter(s => match(s.label, s.id, s.short)).map(s => ({
    key: 'segment:' + s.id, group: 'Сегмент', icon: 'filter',
    title: s.label, meta: `${fmtInt(s.accounts)} аккаунтов · NRR ${fmtPct(s.nrr)}`,
    run: { type: 'segment', id: s.id },
  }));

  const accountItems = accounts
    .filter(a => match(a.name, a.owner, a.region, a.plan))
    .slice(0, q ? 6 : 4)
    .map(a => ({
      key: 'account:' + a.id, group: 'Аккаунты', icon: 'users',
      title: a.name, meta: `${a.region} · ${a.owner} · ${fmtMoney(a.mrr)}`,
      run: { type: 'account', id: a.id },
    }));

  const actions = [
    { key: 'action:studio', group: 'Действия', icon: 'grid', title: 'Концепт-студия', meta: 'Все визуальные миры', hint: 'G', run: { type: 'studio' } },
    { key: 'action:export', group: 'Действия', icon: 'download', title: 'Экспорт аккаунтов в CSV', meta: 'Текущая выборка и сортировка', run: { type: 'export' } },
    { key: 'action:compare', group: 'Действия', icon: 'wave', title: 'Сравнение с прошлым периодом', meta: 'Показать/скрыть предыдущий ряд', run: { type: 'compare' } },
  ].filter(a => match(a.title, a.meta));

  if (themeItems.length) groups.push({ label: 'Концепции', items: themeItems });
  if (accountItems.length) groups.push({ label: 'Аккаунты', items: accountItems });
  if (rangeItems.length) groups.push({ label: 'Период', items: rangeItems });
  if (segItems.length) groups.push({ label: 'Сегмент', items: segItems });
  if (actions.length) groups.push({ label: 'Действия', items: actions });
  return groups;
}

export function paletteListHTML(groups: PaletteGroup[], activeIndex = 0) {
  if (!groups.length) {
    return `<div class="palette-empty">${icon('search', 22)}<p>Ничего не найдено</p><span>Попробуйте «Квант», «30 дней» или «Терминал»</span></div>`;
  }
  let i = 0;
  return groups.map(g => `
    <div class="p-group">
      <div class="p-group-label">${g.label}</div>
      ${g.items.map(it => {
        const idx = i++;
        return `<button class="p-item ${idx === activeIndex ? 'is-active' : ''}" data-pal-index="${idx}" data-pal-key="${it.key}" role="option" aria-selected="${idx === activeIndex}">
          <span class="p-ico">${icon(it.icon, 16)}</span>
          <span class="p-text"><span class="p-title">${esc(it.title)}</span><span class="p-meta">${esc(it.meta)}</span></span>
          ${it.hint ? `<span class="p-hint">${it.hint}</span>` : ''}
        </button>`;
      }).join('')}
    </div>`).join('');
}

/* ---------------- account drawer ---------------- */
const EVENT_ICON = { 'договор': 'wallet', 'продукт': 'layers', 'активность': 'activity', 'встреча': 'users', 'риск': 'bell', 'биллинг': 'wallet' };

export function drawerHTML(a: Account, ctx: unknown) {
  const gid = 'dr-grad-' + a.id;
  const spark = sparkPath(a.spark, 400, 78, 6, 0.2);
  const healthTone = a.health >= 80 ? 'good' : a.health >= 65 ? 'warn' : 'bad';
  const healthLabel = a.health >= 80 ? 'Здоровый' : a.health >= 65 ? 'Наблюдение' : 'В зоне риска';
  return `<div class="drawer-scrim" data-close-drawer></div>
  <aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="dr-name">
    <div class="drawer-top">
      <span class="drawer-eyebrow">${icon('layers', 13)} Аккаунт · ${esc(a.plan)}</span>
      <button class="drawer-close" data-close-drawer aria-label="Закрыть">${icon('close', 18)}</button>
    </div>
    <div class="drawer-id">
      ${avatar(a, 'drawer-avatar')}
      <div>
        <h2 id="dr-name">${esc(a.name)}</h2>
        <p>${esc(a.region)} · ${esc(a.owner)} · ${a.sinceLabel}</p>
      </div>
    </div>
    <div class="drawer-kpis">
      <div><span>MRR</span><b>${fmtMoney(a.mrr)}</b><em class="${a.growth >= 0 ? 'up' : 'down'}">${fmtDelta(a.growth)}</em></div>
      <div><span>Здоровье</span><b>${a.health}<small>/100</small></b><em class="${healthTone}">${healthLabel}</em></div>
      <div><span>Места</span><b>${a.seats}</b><em>${a.usage}% использование</em></div>
    </div>
    <div class="drawer-spark">
      <div class="drawer-sec-head"><span>Динамика MRR · 24 недели</span><b>${fmtMoney(a.ltv)} LTV</b></div>
      <svg viewBox="0 0 400 78" preserveAspectRatio="none" aria-hidden="true">
        <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="var(--accent)" stop-opacity=".38"/>
          <stop offset="1" stop-color="var(--accent)" stop-opacity="0"/>
        </linearGradient></defs>
        <path d="${spark} L394,78 L6,78 Z" fill="url(#${gid})"/>
        <path d="${spark}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </div>
    <div class="drawer-health">
      <div class="drawer-sec-head"><span>Индекс здоровья</span><b>${healthLabel}</b></div>
      <div class="health-track"><i class="${healthTone}" style="width:${a.health}%"></i></div>
      <div class="health-scale"><span>риск</span><span>норма</span><span>отлично</span></div>
    </div>
    <div class="drawer-facts">
      <div><span>Сегмент</span><b>${esc(SEGMENTS.find(s => s.id === a.segment)?.label || a.segment)}</b></div>
      <div><span>Регион</span><b>${esc(a.region)}</b></div>
      <div><span>Тариф</span><b>${esc(a.plan)}</b></div>
      <div><span>Владелец</span><b>${esc(a.owner)}</b></div>
    </div>
    <div class="drawer-events">
      <div class="drawer-sec-head"><span>Последние события</span><b>${a.events.length}</b></div>
      ${a.events.map(e => `<div class="dr-event">
        <span class="dr-event-ico">${icon((EVENT_ICON as Record<string, string>)[e.kind] || 'activity', 14)}</span>
        <span class="dr-event-title">${esc(e.title)}</span>
        <span class="dr-event-days">${e.days} дн.</span>
      </div>`).join('')}
    </div>
    <div class="drawer-actions">
      <button class="dr-primary" data-copy-email="${esc(a.email)}">${icon('arrowUpRight', 15)} Скопировать e-mail</button>
      <button class="dr-ghost" data-close-drawer>Закрыть</button>
    </div>
  </aside>`;
}

/* ---------------- attention popover ---------------- */
export function attentionHTML(accounts: Account[]) {
  const rows = accounts.map(a => {
    const tone = a.health < 70 ? 'is-risk' : 'is-watch';
    return `<button class="at-item" data-account-id="${a.id}">
      <span class="at-badge ${tone}">${a.health}</span>
      <span class="at-text">
        <span class="at-name">${esc(a.name)}</span>
        <span class="at-meta">${esc(a.region)} · ${esc(a.owner)} · ${fmtMoney(a.mrr)}</span>
      </span>
      <span class="at-trend ${a.growth < 0 ? 'is-down' : ''}">${a.growth < 0 ? '' : '+'}${a.growth.toFixed(1)}%</span>
    </button>`;
  }).join('');
  return `<div class="attn" role="dialog" aria-label="Требуют внимания" tabindex="-1">
    <div class="attn-head">
      <span>Требуют внимания</span>
      <b>${accounts.length}</b>
    </div>
    <div class="attn-list">${rows || '<p class="attn-empty">Все аккаунты в норме</p>'}</div>
    <p class="attn-foot">Показаны аккаунты с наименьшим индексом здоровья</p>
  </div>`;
}
