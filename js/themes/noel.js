/* ============================================================
   CONCEPT 02 · СОЧЕЛЬНИК / Noël
   Warm winter. Paper, candlelight, snow, an advent calendar.
   ============================================================ */
import { fmtMoney, fmtMoneyShort, fmtInt, fmtPct, fmtDelta, longDate } from '../data.js';
import { icon, logo, rangeControl, segmentSelect, avatar, countUp } from '../ui.js';
import { linePath, areaPath, sparkPath, niceMax, attachLineHover } from '../charts.js';

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const poster = `
  <div class="p-noel-stars"></div>
  <div class="p-noel-moon"></div>
  <div class="p-noel-hills"><i></i><i></i></div>
  <div class="p-noel-pines"><i></i><i></i><i></i><i></i></div>
  <div class="p-noel-cabin"><span class="w1"></span><span class="w2"></span></div>
  <div class="p-noel-title">Тихо<br><em>идёт снег</em></div>
  <div class="p-noel-snow">${Array.from({ length: 14 }, (_, i) => {
    const x = (i * 37) % 100, s = 1.2 + (i % 3) * 0.7, d = 5 + (i % 5), delay = -(i * 0.7);
    return `<i style="--x:${x}%;--s:${s}px;--d:${d}s;--delay:${delay}s"></i>`;
  }).join('')}</div>
  <div class="p-noel-foot">СОЧЕЛЬНИК · 02</div>`;

function snowLayer(count = 34) {
  let out = '';
  for (let i = 0; i < count; i++) {
    const x = (i * 47.3) % 100;
    const size = 1 + ((i * 7) % 5) * 0.7;
    const dur = 9 + (i % 9) * 2.2;
    const delay = -(i * 0.63) % dur;
    const drift = (i % 2 ? 1 : -1) * (8 + (i % 6) * 6);
    const op = 0.25 + ((i * 3) % 5) * 0.12;
    out += `<i style="left:${x}%;width:${size}px;height:${size}px;animation-duration:${dur}s;animation-delay:${delay}s;--drift:${drift}px;opacity:${op}"></i>`;
  }
  return `<div class="nl-snow" aria-hidden="true">${out}</div>`;
}

function daysToNewYear(today) {
  const ny = new Date(today.getFullYear() + 1, 0, 1);
  return Math.ceil((ny - today) / 86400000);
}

function candle(v, max) {
  const h = Math.max(10, Math.round(v / max * 100));
  return `<span class="nl-candle" style="--h:${h}%"><i></i></span>`;
}

export default {
  id: 'noel', num: '02', name: 'Сочельник', en: 'Noël', 
  tagline: 'Тёплый свет, снег и бумага',
  palette: ['#0e2a22', '#1f4a38', '#e0a35e', '#f7efe0'],
  bg: '#0c241d', accent: '#e0a35e', poster,

  render(vm, ctx) {
    const { state } = ctx;
    const k = vm.kpis;
    const rev = vm.revenue;
    const pts = rev.points;
    const n = pts.length;
    const max = niceMax(rev.max * 1.08);
    const W = 760, H = 232, x0 = 40, x1 = 748, y0 = 18, y1 = 190;
    const x = i => x0 + (i / Math.max(1, n - 1)) * (x1 - x0);
    const y = v => y1 - (v / max) * (y1 - y0);
    const line = linePath(pts, x, y, 0.18);
    const area = areaPath(pts, x, y, y1, 0.18);
    const prevLine = linePath(pts.map(p => ({ v: p.prev ?? p.v })), x, y, 0.18);
    const labelIdx = n <= 7 ? pts.map((_, i) => i) : [0, Math.round((n - 1) * .33), Math.round((n - 1) * .66), n - 1];

    const daysLeft = daysToNewYear(vm.today);
    const goal = vm.goals.revenue;

    const bulbs = 12;
    const retention = Array.from({ length: bulbs }, (_, i) => {
      const base = 92 - i * 2.1 + Math.sin(i * 1.3) * 2.4;
      return { i, v: Math.max(58, base) };
    });

    const last24 = pts.slice(-24);
    const maxDay = Math.max(...last24.map(p => p.v));
    const doors = Array.from({ length: 24 }, (_, i) => {
      const p = last24[i] || pts[pts.length - 1];
      return { i, p, open: i < 3 };
    });

    const rows = vm.accounts.slice(0, 5);

    return `
    <div class="nl-root" id="nl-top">
      ${snowLayer(window.innerWidth < 760 ? 20 : 34)}
      <div class="nl-aurora" aria-hidden="true"><i></i><i></i><i></i></div>

      <header class="nl-head">
        <div class="nl-brand">${logo(24)}<span>Meridian</span><em>зимняя сессия</em></div>
        <nav class="nl-nav">
          <button class="is-on" data-scroll="nl-top">Обзор</button>
          <button data-scroll="nl-revenue">Выручка</button>
          <button data-scroll="nl-clients">Клиенты</button>
          <button data-scroll="nl-advent">Календарь</button>
        </nav>
        <div class="nl-head-right">
          <button class="nl-concept" data-theme-open>
            <span class="nl-concept-spark">${icon('snow', 13)}</span>
            <span>Сочельник</span>
            ${icon('grid', 13)}
          </button>
          <button class="nl-bell" data-open-palette aria-label="Поиск">${icon('search', 16)}</button>
          <span class="nl-avatar">АК</span>
        </div>
      </header>

      <main class="nl-main">
        <section class="nl-hero">
          <div class="nl-hero-left">
            <p class="nl-eyebrow">${longDate(vm.today)} · ${vm.rangeLabel}</p>
            <h1>Добрый вечер, Анна.<br><em>Зима приносит рост.</em></h1>
            <p class="nl-lede">Выручка держится выше плана третий месяц подряд. Самое время замедлиться и посмотреть на цифры у камина.</p>
            <div class="nl-hero-meta">
              <div><b>${daysLeft}</b><span>${daysLeft === 1 ? 'день' : daysLeft < 5 ? 'дня' : 'дней'} до Нового года</span></div>
              <span class="nl-hero-rule"></span>
              <div><b>${fmtPct(vm.kpis.nrr.raw)}</b><span>удержание выручки</span></div>
            </div>
          </div>
          <div class="nl-hero-right">
            ${rangeControl('nl', state)}
            ${segmentSelect('nl', state)}
          </div>
        </section>

        <section class="nl-grid">
          <article class="nl-card nl-chart" id="nl-revenue">
            <div class="nl-card-head">
              <div>
                <p class="nl-label">Выручка за период</p>
                <div class="nl-big-row">
                  <h2 class="nl-big" data-count="${rev.total}" data-kind="money">${fmtMoney(rev.total)}</h2>
                  <span class="nl-chip ${rev.delta >= 0 ? 'is-good' : 'is-bad'}">${fmtDelta(rev.delta)}</span>
                </div>
                <p class="nl-note">${vm.rangeLabel} · ${vm.compareLabel}</p>
              </div>
              <div class="nl-legend">
                <span><i class="nl-l1"></i>Сейчас</span>
                <span><i class="nl-l2"></i>Год назад</span>
              </div>
            </div>
            <div class="nl-chartwrap chart-live">
              <svg class="nl-chart-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Динамика выручки">
                <defs>
                  <linearGradient id="nlFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stop-color="#f0b46b" stop-opacity=".34"/>
                    <stop offset="1" stop-color="#f0b46b" stop-opacity="0"/>
                  </linearGradient>
                  <linearGradient id="nlStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stop-color="#e7a55e"/><stop offset=".5" stop-color="#f6d29a"/><stop offset="1" stop-color="#ffe9c4"/>
                  </linearGradient>
                  <filter id="nlGlow" x="-20%" y="-50%" width="140%" height="200%">
                    <feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>
                ${[0, .25, .5, .75, 1].map(t => `<line x1="${x0}" x2="${x1}" y1="${y1 - t * (y1 - y0)}" y2="${y1 - t * (y1 - y0)}" stroke="rgba(247,239,224,.09)" stroke-dasharray="1 6" stroke-linecap="round"/>`).join('')}
                ${[0, .5, 1].map(t => `<text x="0" y="${y1 - t * (y1 - y0) + 3}" fill="#7d9a8c" font-size="9" font-family="Inter, sans-serif">${fmtMoneyShort(max * t)}</text>`).join('')}
                <path d="${area}" fill="url(#nlFill)" class="nl-area"/>
                ${state.compare ? `<path d="${prevLine}" fill="none" stroke="rgba(247,239,224,.28)" stroke-width="1.3" stroke-dasharray="3 6" stroke-linecap="round"/>` : ''}
                <path d="${line}" fill="none" stroke="url(#nlStroke)" stroke-width="2.3" stroke-linecap="round" filter="url(#nlGlow)" pathLength="1" class="nl-line"/>
                ${pts.filter((_, i) => i % Math.max(1, Math.round(n / 7)) === 0).map(p => `<circle cx="${x(p.i)}" cy="${y(p.v)}" r="2.2" fill="#ffeccb" opacity=".85"/>`).join('')}
                <line class="hover-cursor" y1="${y0}" y2="${y1}" stroke="rgba(255,236,203,.4)" stroke-dasharray="2 5" opacity="0"/>
                <circle class="hover-dot" r="4.5" fill="#fff6e6" stroke="#e0a35e" stroke-width="2.5" opacity="0"/>
                <circle class="hover-dot-prev" r="3" fill="#0c241d" stroke="rgba(247,239,224,.5)" stroke-width="1.4" opacity="0"/>
                ${labelIdx.map(i => `<text x="${x(i)}" y="${H - 16}" text-anchor="${i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}" fill="#7d9a8c" font-size="9" font-family="Inter, sans-serif">${pts[i].label}</text>`).join('')}
              </svg>
            </div>
            <div class="nl-chart-foot">
              <span>${icon('spark', 12)} Пик ${fmtMoney(rev.peak.v)} · ${rev.peak.label}</span>
              <span>В среднем <b>${fmtMoney(rev.avg)}</b> в день</span>
            </div>
          </article>

          <aside class="nl-rail">
            <article class="nl-card nl-globe">
              <div class="nl-globe-head">
                <p class="nl-label">Цель квартала</p>
                <span class="nl-hand">почти</span>
              </div>
              <div class="nl-globe-art">
                <div class="nl-globe-glass">
                  <div class="nl-globe-inner">
                    <b>${Math.round(goal * 100)}<small>%</small></b>
                    <span>выполнено</span>
                  </div>
                  <div class="nl-globe-tree">${icon('snow', 40)}</div>
                  <div class="nl-globe-snow">${Array.from({ length: 9 }, (_, i) => `<i style="left:${8 + i * 10}%;animation-delay:${-i * .7}s;animation-duration:${4 + i % 3}s"></i>`).join('')}</div>
                </div>
                <div class="nl-globe-base"></div>
              </div>
              <div class="nl-globe-foot">
                <div><b>${fmtMoney(vm.mrr * 3.1)}</b><span>из ${fmtMoney(vm.mrr * 4)}</span></div>
                <div class="nl-globe-delta">${icon('up', 13)} ${fmtDelta(6.4)}</div>
              </div>
            </article>

            <article class="nl-card nl-kpis">
              ${[
                { k: k.mrr, ic: 'wallet' },
                { k: k.accounts, ic: 'users' },
                { k: k.churn, ic: 'activity' },
              ].map(({ k: kk, ic }) => `
                <div class="nl-kpi">
                  <span class="nl-kpi-ico">${icon(ic, 14)}</span>
                  <div class="nl-kpi-body">
                    <span class="nl-kpi-label">${kk.label}</span>
                    <b data-count="${kk.raw}" data-kind="${kk.id === 'accounts' ? 'int' : kk.id === 'mrr' ? 'money' : 'pct'}">${kk.value}</b>
                    <em class="${kk.good ? 'up' : 'down'}">${kk.deltaLabel}</em>
                  </div>
                </div>`).join('')}
            </article>
          </aside>

          <article class="nl-card nl-garland">
            <div class="nl-card-head">
              <div>
                <p class="nl-label">Гирлянда удержания</p>
                <p class="nl-note">Когорты по неделям · ярче — выше возврат</p>
              </div>
              <span class="nl-hand nl-hand-r">12 недель</span>
            </div>
            <div class="nl-garland-wire">
              <svg viewBox="0 0 600 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0,14 C100,52 200,52 300,26 C400,0 500,4 600,20" fill="none" stroke="rgba(247,239,224,.18)" stroke-width="1.2"/></svg>
              ${retention.map(r => `
                <span class="nl-bulb" style="--v:${(r.v - 55) / 45}">
                  <i></i>
                  <em>${Math.round(r.v)}</em>
                </span>`).join('')}
            </div>
            <div class="nl-garland-foot">
              <span>Средний возврат за 12 недель</span>
              <b>${fmtPct(retention.reduce((s, r) => s + r.v, 0) / retention.length)}</b>
            </div>
          </article>

          <article class="nl-card nl-regions">
            <div class="nl-card-head">
              <div>
                <p class="nl-label">Тепло по регионам</p>
                <p class="nl-note">Доля выручки и динамика</p>
              </div>
              <span class="nl-hand nl-hand-r">где теплее</span>
            </div>
            <div class="nl-regions-list">
              ${vm.regions.map((r, i) => `
                <div class="nl-region">
                  <div class="nl-region-top">
                    <span>${r.name}</span>
                    <span class="nl-region-nums"><em class="${r.delta >= 0 ? 'up' : 'down'}">${fmtDelta(r.delta)}</em><b>${fmtPct(r.share)}</b></span>
                  </div>
                  <div class="nl-region-bar"><i style="width:${r.share * 1.9}%"></i></div>
                </div>`).join('')}
            </div>
          </article>

          <article class="nl-card nl-advent" id="nl-advent">
            <div class="nl-card-head">
              <div>
                <p class="nl-label">Адвент-календарь выручки</p>
                <p class="nl-note">24 дня · откройте любую ячейку</p>
              </div>
              <span class="nl-hand nl-hand-r">по дням</span>
            </div>
            <div class="nl-doors">
              ${doors.map(d => `
                <button class="nl-door ${d.open ? 'is-open' : ''}" data-door="${d.i}" aria-label="День ${d.i + 1}">
                  <span class="nl-door-face"><em>${String(d.i + 1).padStart(2, '0')}</em></span>
                  <span class="nl-door-back">
                    <b>${(d.p.v / 1e6).toFixed(2).replace('.', ',')}</b>
                    <i>млн · ${d.p.label}</i>
                  </span>
                </button>`).join('')}
            </div>
            <div class="nl-advent-foot">
              <span>${icon('gift', 13)} Нажмите на окошко</span>
              <b>Максимум: ${fmtMoney(maxDay)}</b>
            </div>
          </article>

          <article class="nl-card nl-clients" id="nl-clients">
            <div class="nl-card-head">
              <div>
                <p class="nl-label">Тёплые клиенты</p>
                <p class="nl-note">${vm.accountCount} аккаунтов в выборке</p>
              </div>
              <label class="nl-search">
                ${icon('search', 13)}
                <input data-search value="${esc(state.search)}" placeholder="Поиск" aria-label="Поиск по аккаунтам">
              </label>
            </div>
            <div class="nl-list">
              ${rows.length ? rows.map(a => `
                <button class="nl-row" data-account-id="${a.id}">
                  ${avatar(a, 'nl-av')}
                  <span class="nl-row-name"><b>${esc(a.name)}</b><em>${esc(a.region)} · ${esc(a.owner)}</em></span>
                  <span class="nl-row-mrr">${fmtMoney(a.mrr)}</span>
                  <span class="nl-row-candle">${candle(a.health, 100)}<em>${a.health}</em></span>
                </button>`).join('') : `<p class="nl-empty">Ничего не нашлось — попробуйте другой запрос.</p>`}
            </div>
          </article>
        </section>

        <footer class="nl-foot">
          <span>${icon('snow', 13)} Meridian · зимняя сессия</span>
          <span>Синтетические данные · обновлено ${vm.updated.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
        </footer>
      </main>
    </div>`;
  },

  mount(root, vm, ctx) {
    const rev = vm.revenue;
    const n = rev.points.length;
    const max = niceMax(rev.max * 1.08);
    attachLineHover(root.querySelector('.nl-chartwrap'), rev.points,
      { x0: 40, x1: 748, y0: 18, y1: 190, w: 760, h: 232, yMax: max, yMin: 0 },
      p => `<div class="tt-date">${p.full}</div>
        <div class="tt-row"><span class="tt-label">Выручка</span><span class="tt-val">${fmtMoney(p.v)}</span></div>
        ${p.prev != null ? `<div class="tt-row"><span class="tt-label">Год назад</span><span class="tt-val">${fmtMoney(p.prev)}</span></div>` : ''}`);

    root.querySelectorAll('[data-count]').forEach(el => {
      const target = Number(el.dataset.count);
      const kind = el.dataset.kind;
      const fmt = v => kind === 'money' ? fmtMoney(v) : kind === 'int' ? fmtInt(v) : fmtPct(v);
      countUp(el, target, fmt, 1000);
    });

    root.querySelectorAll('.nl-door').forEach(door => {
      door.addEventListener('click', () => {
        const was = door.classList.contains('is-open');
        door.classList.toggle('is-open', !was);
      });
    });

    root.querySelectorAll('.nl-nav button[data-scroll]').forEach(b => {
      b.addEventListener('click', () => {
        root.querySelectorAll('.nl-nav button').forEach(x => x.classList.remove('is-on'));
        b.classList.add('is-on');
      });
    });
  },
};
