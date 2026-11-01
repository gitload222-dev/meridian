import { useEffect, useRef } from 'react';
import { fmtMoney, fmtMoneyShort, fmtInt, fmtPct, fmtDelta, shortDate, longDate, monthYear } from '../lib/data';
import type { ViewModel, AppState } from '../lib/data';
import type { ThemeProps } from '../lib/themes';
import { icon, logo, delta, rangeControl, rangeShort, segmentControl, segmentSelect, avatar, themeButton, countUp, healthColor, tinyBars } from '../lib/ui';
import { linePath, areaPath, sparkPath, donutArcs, niceMax, attachLineHover, attachBarHover, roundedBar, arcPath, polar, roundRect, clamp, ticks } from '../lib/charts';
import '../styles/themes/azure.css';

/* ============================================================
   CONCEPT 01 · ГЛУБИНА / Deep Azure
   Luminous ocean-blue glass. Sonar calm, premium fintech.
   ============================================================ */

const ESC_MAP: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s: unknown) => String(s).replace(/[&<>"']/g, c => ESC_MAP[c]);


function weekday(date: Date) {
  const s = date.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function kpiSparks(vm: ViewModel) {
  const s = vm.revenue.spark;
  return {
    mrr: s,
    accounts: s.map((v, i) => v * 0.55 + i * 2600 + 9000),
    nrr: s.map((v, i) => v * 0.22 + Math.sin(i / 2.1) * 18000 + 42000),
    conversion: s.map((v, i) => v * 0.18 + Math.cos(i / 2.7) * 14000 + 52000),
  };
}

function render(vm: ViewModel, state: AppState): string {
    const k = vm.kpis;
    const rev = vm.revenue;
    const points = rev.points;
    const n = points.length;
    const max = niceMax(rev.max * 1.1);
    const W = 780, H = 296, x0 = 48, x1 = 762, y0 = 16, y1 = 238;
    const x = i => x0 + (i / Math.max(1, n - 1)) * (x1 - x0);
    const y = v => y1 - (v / max) * (y1 - y0);

    const line = linePath(points, x, y, 0.16);
    const area = areaPath(points, x, y, y1, 0.16);
    const prevPts = points.map(p => ({ v: p.prev ?? p.v }));
    const prevLine = linePath(prevPts, x, y, 0.16);

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => max * t);
    const labelIdx = n <= 7 ? points.map((_, i) => i) : [0, Math.round((n - 1) * 0.25), Math.round((n - 1) * 0.5), Math.round((n - 1) * 0.75), n - 1];

    const sparks = kpiSparks(vm);
    const kpiCards = [
      { key: 'mrr', icon: 'wallet', k: k.mrr },
      { key: 'accounts', icon: 'users', k: k.accounts },
      { key: 'nrr', icon: 'target', k: k.nrr },
      { key: 'conversion', icon: 'activity', k: k.conversion },
    ];

    const goal = vm.goals.revenue;
    const circ = 2 * Math.PI * 42;
    const totalHealth = vm.health.healthy + vm.health.watch + vm.health.risk;
    const healthyPct = Math.round(vm.health.healthy / totalHealth * 100);
    const donut = donutArcs([vm.health.healthy, vm.health.watch, vm.health.risk], 60, 60, 52, 13, 4);
    const donutColors = ['#4be3b0', '#f3b95f', '#ff7a90'];

    const rows = vm.accounts.slice(0, 6);
    const sortMark = key => state.sort.key === key ? (state.sort.dir === 'asc' ? ' ↑' : ' ↓') : '';

    return `
    <div class="az-shell" id="az-top">
      <div class="az-ambient" aria-hidden="true"><i class="a1"></i><i class="a2"></i><i class="a3"></i></div>

      <aside class="az-rail">
        <div class="az-rail-logo">${logo(28)}</div>
        <nav class="az-nav" aria-label="Разделы">
          <button class="az-nav-btn is-active" data-scroll="az-top" title="Обзор" aria-label="Обзор">${icon('grid', 19)}</button>
          <button class="az-nav-btn" data-scroll="az-revenue" title="Выручка" aria-label="Выручка">${icon('wave', 19)}</button>
          <button class="az-nav-btn" data-scroll="az-accounts" title="Клиенты" aria-label="Клиенты">${icon('users', 19)}</button>
          <button class="az-nav-btn" data-scroll="az-health" title="Здоровье" aria-label="Здоровье">${icon('target', 19)}</button>
          <button class="az-nav-btn" data-action="export" title="Экспорт" aria-label="Экспорт">${icon('download', 19)}</button>
        </nav>
        <div class="az-rail-bottom">
          <button class="az-nav-btn" data-open-palette title="Поиск ⌘K" aria-label="Поиск">${icon('search', 19)}</button>
          <span class="az-rail-line"></span>
          <div class="az-rail-avatar">АК</div>
        </div>
      </aside>

      <main class="az-main">
        <header class="az-topbar">
          <div class="az-crumb">
            <span class="az-crumb-brand">${logo(17)} Meridian</span>
            <span class="az-crumb-sep">/</span>
            <span>Пространство</span><span class="az-crumb-sep">/</span><b>Обзор</b>
          </div>
          <div class="az-topbar-right">
            <span class="az-live"><i></i>LIVE</span>
            <button class="az-searchbtn" data-open-palette>
              ${icon('search', 15)}<span>Поиск</span><kbd>⌘K</kbd>
            </button>
            ${themeButton('az', 'Глубина')}
            <button class="az-iconbtn az-bell" data-action="attention" aria-label="Уведомления" aria-expanded="false" aria-haspopup="dialog">${icon('bell', 17)}<i class="az-dot"></i></button>
            <div class="az-user">АК</div>
          </div>
        </header>

        <section class="az-hero">
          <div class="az-hero-copy">
            <p class="az-date">${weekday(vm.today)} · ${vm.rangeLabel}</p>
            <h1>Пульс выручки</h1>
            <p class="az-sub">Выручка, удержание и здоровье клиентов в одном контуре.</p>
          </div>
          <div class="az-controls">
            ${rangeControl('az', state)}
            ${segmentSelect('az', state)}
            <button class="az-export" data-action="export" title="Экспорт CSV">${icon('download', 15)}<span>CSV</span></button>
          </div>
        </section>

        <section class="az-kpis" aria-label="Ключевые метрики">
          ${kpiCards.map(({ key, icon: ic, k: kk }) => `
            <article class="az-kpi">
              <div class="az-kpi-top"><span>${kk.label}</span><span class="az-kpi-ico">${icon(ic, 15)}</span></div>
              <div class="az-kpi-value" data-count="${kk.raw}" data-kind="${key === 'accounts' ? 'int' : key === 'mrr' ? 'money' : 'pct'}">${kk.value}</div>
              <div class="az-kpi-foot">
                ${delta(kk)}
                <span class="az-kpi-note">${kk.note}</span>
              </div>
              <svg class="az-spark" viewBox="0 0 132 32" preserveAspectRatio="none" aria-hidden="true">
                <path d="${sparkPath(sparks[key], 132, 32, 2)} L130,32 L2,32 Z" fill="url(#azSparkFill)" opacity=".5"/>
                <path d="${sparkPath(sparks[key], 132, 32, 2)}" fill="none" stroke="var(--accent-2)" stroke-width="1.4" stroke-linecap="round"/>
              </svg>
            </article>`).join('')}
        </section>

        <section class="az-grid">
          <article class="az-card az-revenue" id="az-revenue">
            <div class="az-card-head">
              <div>
                <p class="az-label">Выручка за период</p>
                <div class="az-rev-line">
                  <h2 class="az-rev-value" data-count="${rev.total}" data-kind="money">${fmtMoney(rev.total)}</h2>
                  ${delta(k.revenue)}
                </div>
                <p class="az-rev-note">${vm.rangeLabel} · ${vm.compareLabel}</p>
              </div>
              <div class="az-legend">
                <span class="az-legend-item"><i class="az-dotline"></i>Текущий</span>
                <span class="az-legend-item"><i class="az-dashline"></i>Прошлый</span>
                <button class="az-toggle ${state.compare ? 'is-on' : ''}" data-action="compare" aria-pressed="${state.compare}">
                  <i></i>Сравнение
                </button>
              </div>
            </div>

            <div class="az-chartwrap chart-live" data-chart="revenue">
              <svg class="az-chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="График выручки">
                <defs>
                  <linearGradient id="azArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stop-color="#3f8dff" stop-opacity=".55"/>
                    <stop offset=".55" stop-color="#2f6bff" stop-opacity=".16"/>
                    <stop offset="1" stop-color="#2f6bff" stop-opacity="0"/>
                  </linearGradient>
                  <linearGradient id="azLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stop-color="#5aa8ff"/><stop offset="1" stop-color="#66e9ff"/>
                  </linearGradient>
                  <linearGradient id="azSparkFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stop-color="#57e6ff" stop-opacity=".28"/><stop offset="1" stop-color="#57e6ff" stop-opacity="0"/>
                  </linearGradient>
                  <filter id="azGlow" x="-20%" y="-40%" width="140%" height="180%">
                    <feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>
                ${yTicks.map(v => `<line x1="${x0}" x2="${x1}" y1="${y(v)}" y2="${y(v)}" stroke="rgba(140,180,255,.09)" stroke-dasharray="2 5"/>`).join('')}
                ${yTicks.map(v => `<text x="0" y="${y(v) + 3}" fill="#7189ad" font-size="9" font-family="Inter, sans-serif">${fmtMoneyShort(v)}</text>`).join('')}
                <path d="${area}" fill="url(#azArea)" class="az-area"/>
                ${state.compare ? `<path d="${prevLine}" fill="none" stroke="rgba(180,210,255,.35)" stroke-width="1.4" stroke-dasharray="4 5"/>` : ''}
                <path d="${line}" fill="none" stroke="url(#azLine)" stroke-width="2.4" stroke-linecap="round" filter="url(#azGlow)" pathLength="1" class="az-line"/>
                <line class="hover-cursor az-cursor" y1="${y0}" y2="${y1}" stroke="rgba(180,225,255,.45)" stroke-dasharray="3 4" opacity="0"/>
                <circle class="hover-dot az-focus" r="4.5" fill="#dff7ff" stroke="#3f8dff" stroke-width="2.5" opacity="0"/>
                <circle class="hover-dot-prev" r="3" fill="#0a1730" stroke="rgba(190,220,255,.6)" stroke-width="1.5" opacity="0"/>
                ${labelIdx.map(i => `<text x="${x(i)}" y="${H - 20}" text-anchor="${i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}" fill="#7189ad" font-size="9" font-family="Inter, sans-serif">${points[i].label}</text>`).join('')}
              </svg>
            </div>
            <div class="az-chart-foot">
              <span><i class="az-pulse"></i> Пик: ${fmtMoney(rev.peak.v)} · ${rev.peak.label}</span>
              <span>Среднее в день: <b>${fmtMoney(rev.avg)}</b></span>
            </div>
          </article>

          <div class="az-side">
          <article class="az-card az-goal">
            <div class="az-card-head">
              <p class="az-label">Квартальная цель</p>
              <span class="az-goal-tag">Q4 · 2026</span>
            </div>
            <div class="az-goal-body">
              <div class="az-ring">
                <svg viewBox="0 0 100 100" aria-hidden="true">
                  <defs><linearGradient id="azGoalGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stop-color="#57e6ff"/><stop offset="1" stop-color="#4d7dff"/>
                  </linearGradient></defs>
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(120,170,255,.14)" stroke-width="6"/>
                  <circle cx="50" cy="50" r="42" fill="none" stroke="url(#azGoalGrad)" stroke-width="6" stroke-linecap="round"
                    stroke-dasharray="${(circ * goal).toFixed(1)} ${circ.toFixed(1)}" transform="rotate(-90 50 50)"/>
                </svg>
                <div class="az-ring-label"><b>${Math.round(goal * 100)}%</b><span>выполнено</span></div>
              </div>
              <div class="az-goal-copy">
                <b>${fmtMoney(vm.mrr * 3.1)}</b>
                <span>из ${fmtMoney(vm.mrr * 4)}</span>
                <p>До закрытия квартала — 9 недель.</p>
              </div>
            </div>
            <div class="az-goal-bars">
              <div><span>Выручка</span><i><b style="width:${goal * 100}%"></b></i><em>${Math.round(goal * 100)}%</em></div>
              <div><span>Аккаунты</span><i><b style="width:${vm.goals.accounts * 100}%"></b></i><em>${Math.round(vm.goals.accounts * 100)}%</em></div>
              <div><span>NRR</span><i><b style="width:${vm.goals.nrr * 100}%"></b></i><em>${Math.round(vm.goals.nrr * 100)}%</em></div>
            </div>
          </article>

          <article class="az-card az-channels">
            <div class="az-card-head">
              <p class="az-label">Каналы привлечения</p>
              <span class="az-mini">Доля выручки</span>
            </div>
            <div class="az-ch-list">
              ${vm.channels.slice(0, 4).map((c, i) => `
                <div class="az-ch" data-ch="${i}">
                  <div class="az-ch-top"><span>${c.name}</span><b>${fmtPct(c.share)}</b></div>
                  <div class="az-ch-bar"><i style="width:${c.share * 2.6}%"></i></div>
                  <div class="az-ch-bottom"><span>${fmtMoney(c.value)}</span><em class="${c.delta >= 0 ? 'up' : 'down'}">${fmtDelta(c.delta)}</em></div>
                </div>`).join('')}
            </div>
            <div class="az-ch-foot">
              <span>Прочие каналы</span><b>${fmtMoney(vm.channels.slice(4).reduce((s, c) => s + c.value, 0))}</b>
            </div>
          </article>

          </div>

          <article class="az-card az-accounts" id="az-accounts">
            <div class="az-card-head az-acc-head">
              <div>
                <p class="az-label">Ключевые аккаунты</p>
                <h3 class="az-acc-title">${vm.accountCount} в выборке</h3>
              </div>
              <div class="az-acc-tools">
                <label class="az-searchfield">
                  ${icon('search', 14)}
                  <input data-search value="${esc(state.search)}" placeholder="Найти аккаунт" aria-label="Поиск по аккаунтам">
                </label>
                <button class="az-ghost" data-action="export">${icon('download', 14)}</button>
              </div>
            </div>
            <div class="az-table" role="table">
              <div class="az-tr az-th" role="row">
                <button data-sort="name" role="columnheader">Аккаунт${sortMark('name')}</button>
                <span role="columnheader">Сегмент</span>
                <button data-sort="mrr" role="columnheader">MRR${sortMark('mrr')}</button>
                <button data-sort="growth" role="columnheader">Рост${sortMark('growth')}</button>
                <button data-sort="health" role="columnheader">Здоровье${sortMark('health')}</button>
              </div>
              ${rows.length ? rows.map(a => `
                <button class="az-tr az-row" data-account-id="${a.id}" role="row">
                  <span class="az-acc" role="cell">${avatar(a, 'az-av')}<span><b>${esc(a.name)}</b><em>${esc(a.owner)} · ${esc(a.region)}</em></span></span>
                  <span class="az-seg" role="cell">${a.segment === 'enterprise' ? 'Enterprise' : a.segment === 'mid' ? 'Mid-market' : 'Startup'}</span>
                  <span class="az-mrr" role="cell">${fmtMoney(a.mrr)}</span>
                  <span class="az-growth ${a.growth >= 0 ? 'up' : 'down'}" role="cell">${fmtDelta(a.growth)}</span>
                  <span class="az-hbar" role="cell"><i><b style="width:${a.health}%"></b></i><em>${a.health}</em></span>
                </button>`).join('') : `<div class="az-empty">Ничего не найдено. Попробуйте другой запрос.</div>`}
            </div>
            <div class="az-acc-foot">
              <span>Показаны ${Math.min(6, rows.length)} из ${vm.accountCount}</span>
              <button class="az-link" data-open-palette>Все аккаунты ${icon('arrowRight', 14)}</button>
            </div>
          </article>

          <article class="az-card az-health" id="az-health">
            <div class="az-card-head">
              <p class="az-label">Здоровье клиентов</p>
              <span class="az-mini">${totalHealth} аккаунтов</span>
            </div>
            <div class="az-health-body">
              <div class="az-donut">
                <svg viewBox="0 0 120 120" aria-hidden="true">
                  ${donut.map((d, i) => `<path d="${d.d}" fill="${donutColors[i]}" opacity="${i === 0 ? 1 : 0.92}"/>`).join('')}
                </svg>
                <div class="az-donut-label"><b>${healthyPct}%</b><span>здоровы</span></div>
              </div>
              <div class="az-health-legend">
                <div><i style="background:#4be3b0"></i><span>Здоровые</span><b>${vm.health.healthy}</b></div>
                <div><i style="background:#f3b95f"></i><span>Наблюдение</span><b>${vm.health.watch}</b></div>
                <div><i style="background:#ff7a90"></i><span>В зоне риска</span><b>${vm.health.risk}</b></div>
              </div>
            </div>
            <div class="az-risk">
              <p class="az-label">Требуют внимания</p>
              ${vm.riskAccounts.slice(0, 3).map(a => `
                <button class="az-risk-row" data-account-id="${a.id}">
                  <span>${a.name}</span><span class="az-risk-score">${a.health}</span>${icon('chevronRight', 13)}
                </button>`).join('')}
            </div>
          </article>

          <article class="az-card az-funnel">
            <div class="az-card-head">
              <p class="az-label">Воронка активации</p>
              <span class="az-mini">${vm.range.label}</span>
            </div>
            <div class="az-funnel-body">
              ${vm.funnel.map((f, i) => `
                <div class="az-fstep">
                  <div class="az-fstep-top"><span>${f.label}</span><b>${fmtInt(f.value)}</b></div>
                  <div class="az-fstep-bar"><i style="width:${[100, 62, 40, 26, 13][i]}%"></i></div>
                  <div class="az-fstep-meta"><em>${fmtPct(f.rate)} от визитов</em><span>${i > 0 ? fmtPct(f.value / vm.funnel[i - 1].value * 100, 0) + ' шаг' : ''}</span></div>
                </div>`).join('')}
            </div>
          </article>

          <article class="az-card az-movers">
            <div class="az-card-head">
              <p class="az-label">Быстрее всех растут</p>
              <span class="az-mini">Δ MRR</span>
            </div>
            <div class="az-movers-list">
              ${vm.topMovers.map((a, i) => `
                <button class="az-mover" data-account-id="${a.id}">
                  <span class="az-mover-rank">${String(i + 1).padStart(2, '0')}</span>
                  ${avatar(a, 'az-av')}
                  <span class="az-mover-name"><b>${esc(a.name)}</b><em>${fmtMoney(a.mrr)}</em></span>
                  <span class="az-mover-delta">${fmtDelta(a.growth)}</span>
                </button>`).join('')}
            </div>
            <div class="az-movers-foot">
              <span>Средний рост топ-4</span>
              <b>${fmtDelta(vm.topMovers.reduce((s, a) => s + a.growth, 0) / 4)}</b>
            </div>
          </article>
        </section>

        <footer class="az-footer">
          <span>Meridian Revenue Intelligence · синтетический датасет</span>
          <span>Обновлено ${vm.updated.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} · ${vm.rangeLabel}</span>
        </footer>
      </main>
    </div>`;
}

function mount(rootEl: HTMLElement, vm: ViewModel, state: AppState) {
  // строковая разметка v1: узлы ищутся вручную, DOM здесь нетипизирован
  const root = rootEl as any;
    const rev = vm.revenue;
    const n = rev.points.length;
    const max = niceMax(rev.max * 1.1);
    const geom = { x0: 48, x1: 762, y0: 16, y1: 238, w: 780, h: 296, yMax: max, yMin: 0 };
    const chart = root.querySelector('[data-chart="revenue"]');
    attachLineHover(chart, rev.points, geom, (p) => {
      const d = p.prev ? (p.v - p.prev) / p.prev * 100 : 0;
      return `<div class="tt-date">${p.full} · ${p.weekday}</div>
        <div class="tt-row"><span class="tt-label">Выручка</span><span class="tt-val">${fmtMoney(p.v)}</span></div>
        ${p.prev != null ? `<div class="tt-row"><span class="tt-label">Прошлый</span><span class="tt-val">${fmtMoney(p.prev)}</span></div>
        <div class="tt-sep"></div>
        <div class="tt-row"><span class="tt-label">Динамика</span><span class="tt-delta ${d >= 0 ? 'up' : 'down'}" style="color:${d >= 0 ? 'var(--good)' : 'var(--bad)'}">${fmtDelta(d)}</span></div>` : ''}`;
    });

    attachBarHover(root, '.az-ch', (i) => {
      const c = vm.channels[Number(i)];
      return `<div class="tt-date">${c.name}</div>
        <div class="tt-row"><span class="tt-label">Выручка</span><span class="tt-val">${fmtMoney(c.value)}</span></div>
        <div class="tt-row"><span class="tt-label">Доля</span><span class="tt-val">${fmtPct(c.share)}</span></div>
        <div class="tt-row"><span class="tt-label">Δ доли</span><span class="tt-val" style="color:${c.delta >= 0 ? 'var(--good)' : 'var(--bad)'}">${fmtDelta(c.delta)}</span></div>`;
    });

    root.querySelectorAll('[data-count]').forEach(el => {
      const target = Number(el.dataset.count);
      const kind = el.dataset.kind;
      const fmt = v => kind === 'money' ? fmtMoney(v) : kind === 'int' ? fmtInt(v) : fmtPct(v);
      countUp(el, target, fmt, 1050);
    });

    root.querySelectorAll('.az-nav-btn[data-scroll]').forEach(btn => {
      btn.addEventListener('click', () => {
        root.querySelectorAll('.az-nav-btn').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
      });
    });
}

/* ---------------- React-обёртка ----------------
   Разметка темы — та же строка, что в v1: визуальная верность 1:1.
   React отвечает за монтирование, жизненный цикл и code-splitting. */
export default function Theme({ vm, state, actions, onReady }: ThemeProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    root.innerHTML = render(vm, state);
    const cleanup = mount(root, vm, state);
    onReady?.();
    return cleanup;
  });

  void actions;
  return <div ref={ref} />;
}
