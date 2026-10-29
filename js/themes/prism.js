/* ============================================================
   CONCEPT 05 · ПРИЗМА / Prism
   Iridescent bento. Mesh gradients, glass, chromatic type.
   ============================================================ */
import { fmtMoney, fmtMoneyShort, fmtInt, fmtPct, fmtDelta } from '../data.js';
import { icon, logo, countUp } from '../ui.js';
import { niceMax, linePath, areaPath, attachLineHover, sparkPath, donutArcs, polar, arcPath } from '../charts.js';

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const poster = `
  <div class="p-pr-blur p1"></div>
  <div class="p-pr-blur p2"></div>
  <div class="p-pr-blur p3"></div>
  <div class="p-pr-orb"></div>
  <div class="p-pr-type">Prism</div>
  <div class="p-pr-sub">SPECTRUM · 05</div>
  <div class="p-pr-line"></div>`;

const SPECTRUM = ['#ff6ec7', '#a78bfa', '#5eead4', '#fbbf24', '#fb7185'];

export default {
  id: 'prism', num: '05', name: 'Призма', en: 'Prism',
  tagline: 'Иридесцентное стекло и спектр',
  palette: ['#08070c', '#a78bfa', '#5eead4', '#ff6ec7'],
  bg: '#08070c', accent: '#a78bfa', poster,

  render(vm, ctx) {
    const { state } = ctx;
    const k = vm.kpis;
    const rev = vm.revenue;
    const pts = rev.points;
    const n = pts.length;
    const max = niceMax(rev.max * 1.06);

    const W = 700, H = 240, x0 = 6, x1 = 694, y0 = 18, y1 = 196;
    const x = i => x0 + (i / Math.max(1, n - 1)) * (x1 - x0);
    const y = v => y1 - (v / max) * (y1 - y0);
    const line = linePath(pts, x, y, 0.2);
    const area = areaPath(pts, x, y, y1, 0.2);

    const total = vm.health.healthy + vm.health.watch + vm.health.risk;
    const arcs = donutArcs([vm.health.healthy, vm.health.watch, vm.health.risk], 80, 80, 70, 17, 5);

    const goals = [
      { label: 'Выручка', v: vm.goals.revenue, c: '#ff6ec7' },
      { label: 'Аккаунты', v: vm.goals.accounts, c: '#a78bfa' },
      { label: 'NRR', v: vm.goals.nrr, c: '#5eead4' },
    ];

    return `
    <div class="pr-root" id="pr-top">
      <div class="pr-mesh" aria-hidden="true"><i class="m1"></i><i class="m2"></i><i class="m3"></i><i class="m4"></i></div>
      <div class="pr-grain" aria-hidden="true"></div>

      <header class="pr-head">
        <div class="pr-brand">${logo(26)}<span>Prism</span><em>by Meridian</em></div>
        <nav class="pr-nav">
          <button class="is-on" data-scroll="pr-top">Обзор</button>
          <button data-scroll="pr-chart">Динамика</button>
          <button data-scroll="pr-segments">Сегменты</button>
          <button data-scroll="pr-accounts">Аккаунты</button>
        </nav>
        <div class="pr-head-r">
          <button class="pr-pill" data-open-palette>${icon('search', 14)}<span>Найти</span><kbd>⌘K</kbd></button>
          <button class="pr-concept" data-theme-open><i></i><span>Призма</span>${icon('grid', 13)}</button>
        </div>
      </header>

      <main class="pr-main">
        <section class="pr-hero">
          <div class="pr-hero-l">
            <div class="pr-tag"><i></i>Обзор · ${vm.rangeLabel}</div>
            <h1>Спектр<br><span>роста</span></h1>
            <p>Каждый сегмент преломляет выручку по-своему. Смотрите, где свет ярче.</p>
            <div class="pr-ctl">
              <div class="pr-ranges">
                ${['7d','30d','90d','12m'].map((r, i) => `<button class="pr-r ${state.range === r ? 'on' : ''}" data-range="${r}">${['7Д','30Д','90Д','12М'][i]}</button>`).join('')}
              </div>
              <label class="pr-select">
                <select data-segment-select aria-label="Сегмент">
                  ${['all','enterprise','mid','startup'].map(s => `<option value="${s}" ${state.segment === s ? 'selected' : ''}>${{all:'Все сегменты',enterprise:'Enterprise',mid:'Mid-market',startup:'Startup'}[s]}</option>`).join('')}
                </select>
                ${icon('chevron', 13)}
              </label>
            </div>
          </div>

          <div class="pr-hero-r">
            <div class="pr-orb">
              <div class="pr-orb-core"></div>
              <div class="pr-orb-ring r1"></div>
              <div class="pr-orb-ring r2"></div>
              <div class="pr-orb-ring r3"></div>
              <span class="pr-orb-label">Q4<br><b>${Math.round(vm.goals.revenue * 100)}%</b></span>
            </div>
            <div class="pr-orb-caption">
              <span>Квартальная цель</span>
              <b>${fmtMoney(vm.mrr * 3.1)} <em>/ ${fmtMoney(vm.mrr * 4)}</em></b>
            </div>
          </div>
        </section>

        <section class="pr-bento">
          <article class="pr-card pr-card--big" id="pr-chart">
            <div class="pr-card-h">
              <div>
                <p class="pr-label">Выручка</p>
                <div class="pr-bigrow">
                  <h2 class="pr-big" data-count="${rev.total}" data-kind="money">${fmtMoney(rev.total)}</h2>
                  <span class="pr-delta ${rev.delta >= 0 ? 'up' : 'down'}">${fmtDelta(rev.delta)}</span>
                </div>
              </div>
              <div class="pr-legend">
                <span><i style="background:linear-gradient(90deg,#ff6ec7,#a78bfa)"></i>Сейчас</span>
                <span><i class="dash"></i>Прошлый</span>
              </div>
            </div>
            <div class="pr-chartwrap chart-live">
              <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Выручка по дням">
                <defs>
                  <linearGradient id="prArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stop-color="#ff6ec7" stop-opacity=".45"/>
                    <stop offset=".5" stop-color="#a78bfa" stop-opacity=".22"/>
                    <stop offset="1" stop-color="#5eead4" stop-opacity="0"/>
                  </linearGradient>
                  <linearGradient id="prStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stop-color="#ff9de2"/><stop offset=".5" stop-color="#c4b5fd"/><stop offset="1" stop-color="#5eead4"/>
                  </linearGradient>
                </defs>
                ${[0, .33, .66, 1].map(t => `<line x1="${x0}" x2="${x1}" y1="${y1 - t * (y1 - y0)}" y2="${y1 - t * (y1 - y0)}" stroke="rgba(255,255,255,.07)" stroke-dasharray="2 6"/>`).join('')}
                ${[0, .5, 1].map(t => `<text x="0" y="${y1 - t * (y1 - y0) + 3}" fill="#6f6a80" font-size="9" font-family="Inter, sans-serif">${fmtMoneyShort(max * t)}</text>`).join('')}
                <path d="${area}" fill="url(#prArea)" class="pr-area"/>
                ${state.compare ? `<path d="${linePath(pts.map(p => ({ v: p.prev ?? p.v })), x, y, .2)}" fill="none" stroke="rgba(255,255,255,.24)" stroke-width="1.2" stroke-dasharray="3 5"/>` : ''}
                <path d="${line}" fill="none" stroke="url(#prStroke)" stroke-width="2.6" stroke-linecap="round" pathLength="1" class="pr-line"/>
                <line class="hover-cursor" y1="${y0}" y2="${y1}" stroke="rgba(255,255,255,.35)" stroke-dasharray="2 4" opacity="0"/>
                <circle class="hover-dot" r="4.5" fill="#fff" stroke="#c4b5fd" stroke-width="2.5" opacity="0"/>
                <circle class="hover-dot-prev" r="3" fill="#0b0910" stroke="rgba(255,255,255,.4)" stroke-width="1.2" opacity="0"/>
                ${[0, Math.round((n-1)/3), Math.round((n-1)*2/3), n-1].map(i => `<text x="${x(i)}" y="${H - 14}" text-anchor="${i === 0 ? 'start' : i === n-1 ? 'end' : 'middle'}" fill="#6f6a80" font-size="9" font-family="Inter, sans-serif">${pts[i].label}</text>`).join('')}
              </svg>
            </div>
            <div class="pr-card-f">
              <span>Пик <b>${fmtMoney(rev.peak.v)}</b></span>
              <span>Среднее <b>${fmtMoney(rev.avg)}</b></span>
              <span class="pr-live"><i></i>LIVE</span>
            </div>
          </article>

          <article class="pr-card pr-card--kpi pr-k1">
            <p class="pr-label">MRR</p>
            <b class="pr-kpi-v" data-count="${k.mrr.raw}" data-kind="money">${k.mrr.value}</b>
            <span class="pr-kpi-d ${k.mrr.good ? 'up' : 'down'}">${k.mrr.deltaLabel}</span>
            <svg viewBox="0 0 120 34" preserveAspectRatio="none" aria-hidden="true">
              <path d="${sparkPath(rev.spark, 120, 34, 3)}" fill="none" stroke="#ff9de2" stroke-width="1.6"/>
            </svg>
          </article>

          <article class="pr-card pr-card--kpi pr-k2">
            <p class="pr-label">Аккаунты</p>
            <b class="pr-kpi-v" data-count="${k.accounts.raw}" data-kind="int">${k.accounts.value}</b>
            <span class="pr-kpi-d ${k.accounts.good ? 'up' : 'down'}">${k.accounts.deltaLabel}</span>
            <svg viewBox="0 0 120 34" preserveAspectRatio="none" aria-hidden="true">
              <path d="${sparkPath(rev.spark.map((v,i)=>v*0.4+i*900), 120, 34, 3)}" fill="none" stroke="#5eead4" stroke-width="1.6"/>
            </svg>
          </article>

          <article class="pr-card pr-card--health">
            <div class="pr-card-h"><p class="pr-label">Здоровье</p><span class="pr-mini">${total}</span></div>
            <div class="pr-health">
              <div class="pr-donut">
                <svg viewBox="0 0 160 160" aria-hidden="true">
                  ${arcs.map((a, i) => `<path d="${a.d}" fill="${SPECTRUM[i]}" opacity="${i === 0 ? 1 : .9}"/>`).join('')}
                </svg>
                <div class="pr-donut-c"><b>${Math.round(vm.health.healthy / total * 100)}%</b><span>здоровы</span></div>
              </div>
              <div class="pr-hlegend">
                <div><i style="background:#ff6ec7"></i>Здоровые<b>${vm.health.healthy}</b></div>
                <div><i style="background:#a78bfa"></i>Наблюдение<b>${vm.health.watch}</b></div>
                <div><i style="background:#5eead4"></i>В риске<b>${vm.health.risk}</b></div>
              </div>
            </div>
          </article>

          <article class="pr-card pr-card--segments" id="pr-segments">
            <div class="pr-card-h"><p class="pr-label">Сегменты</p><span class="pr-mini">доля выручки</span></div>
            <div class="pr-segs">
              ${vm.channels.map((c, i) => `
                <div class="pr-seg">
                  <div class="pr-seg-top"><span>${c.name}</span><b>${fmtPct(c.share)}</b></div>
                  <div class="pr-seg-bar"><i style="width:${c.share * 2.7}%;background:linear-gradient(90deg,${SPECTRUM[i % 5]},${SPECTRUM[(i + 1) % 5]})"></i></div>
                  <div class="pr-seg-bot"><span>${fmtMoney(c.value)}</span><em class="${c.delta >= 0 ? 'up' : 'down'}">${fmtDelta(c.delta)}</em></div>
                </div>`).join('')}
            </div>
          </article>

          <article class="pr-card pr-card--goals">
            <div class="pr-card-h"><p class="pr-label">Цели</p><span class="pr-mini">Q4</span></div>
            <div class="pr-goals">
              ${goals.map(g => `
                <div class="pr-goal">
                  <div class="pr-goal-ring">
                    <svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="25" fill="none" stroke="rgba(255,255,255,.09)" stroke-width="5"/>
                    <circle cx="30" cy="30" r="25" fill="none" stroke="${g.c}" stroke-width="5" stroke-linecap="round"
                      stroke-dasharray="${(2 * Math.PI * 25 * g.v).toFixed(1)} 999" transform="rotate(-90 30 30)"/></svg>
                    <b>${Math.round(g.v * 100)}</b>
                  </div>
                  <span>${g.label}</span>
                </div>`).join('')}
            </div>
          </article>

          <article class="pr-card pr-card--accounts" id="pr-accounts">
            <div class="pr-card-h">
              <p class="pr-label">Аккаунты</p>
              <label class="pr-search">${icon('search', 13)}<input data-search value="${esc(state.search)}" placeholder="Поиск" aria-label="Поиск по аккаунтам"></label>
            </div>
            <div class="pr-list">
              ${vm.accounts.slice(0, 6).map(a => `
                <button class="pr-row" data-account-id="${a.id}">
                  <span class="pr-av" style="background:linear-gradient(140deg,${a.color},#a78bfa)">${a.initials}</span>
                  <span class="pr-row-name"><b>${esc(a.name)}</b><em>${esc(a.region)} · ${esc(a.owner)}</em></span>
                  <span class="pr-row-mrr">${fmtMoney(a.mrr)}</span>
                  <span class="pr-row-h"><i style="width:${a.health}%"></i></span>
                </button>`).join('')}
            </div>
          </article>
        </section>

        <footer class="pr-foot">
          <span>${logo(14)} Prism · визуальная концепция 05</span>
          <span>${vm.updated.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} · ${vm.rangeLabel}</span>
        </footer>
      </main>
    </div>`;
  },

  mount(root, vm) {
    const max = niceMax(vm.revenue.max * 1.06);
    attachLineHover(root.querySelector('.pr-chartwrap'), vm.revenue.points,
      { x0: 6, x1: 694, y0: 18, y1: 196, w: 700, h: 240, yMax: max, yMin: 0 },
      p => `<div class="tt-date">${p.full}</div>
        <div class="tt-row"><span class="tt-label">Выручка</span><span class="tt-val">${fmtMoney(p.v)}</span></div>
        ${p.prev != null ? `<div class="tt-row"><span class="tt-label">Прошлый</span><span class="tt-val">${fmtMoney(p.prev)}</span></div>` : ''}`);
    root.querySelectorAll('[data-count]').forEach(el => {
      const kind = el.dataset.kind;
      const fmt = v => kind === 'money' ? fmtMoney(v) : fmtInt(v);
      countUp(el, Number(el.dataset.count), fmt, 950);
    });
    root.querySelectorAll('.pr-nav button[data-scroll]').forEach(b => b.addEventListener('click', () => {
      root.querySelectorAll('.pr-nav button').forEach(x => x.classList.remove('is-on'));
      b.classList.add('is-on');
    }));
  },
};
