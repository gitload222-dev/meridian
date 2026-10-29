/* ============================================================
   CONCEPT 03 · ШВЕЙЦАРСКИЙ / Grid & Ink
   International typographic style: paper, ink, one red.
   ============================================================ */
import { fmtMoney, fmtMoneyShort, fmtInt, fmtPct, fmtDelta } from '../data.js';
import { icon, rangeControl, segmentSelect, countUp } from '../ui.js';
import { niceMax, attachBarHover, roundedBar } from '../charts.js';

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const poster = `
  <div class="p-sw-grid"></div>
  <div class="p-sw-head"><span>MERIDIAN</span><span>№ 03 / 2026</span></div>
  <div class="p-sw-red"></div>
  <div class="p-sw-letter">A</div>
  <div class="p-sw-data"><b>42,1</b><span>МЛН ₽<br>ВЫРУЧКА<br>30 ДНЕЙ</span></div>
  <div class="p-sw-rule"></div>
  <div class="p-sw-foot"><span>GRID &amp; INK</span><span>SWISS</span></div>`;

export default {
  id: 'swiss', num: '03', name: 'Швейцарский', en: 'Grid & Ink',
  tagline: 'Бумага, линейки и один красный',
  palette: ['#f4f1ea', '#111111', '#e2231a', '#8c887d'],
  bg: '#f4f1ea', accent: '#e2231a', poster,

  render(vm, ctx) {
    const { state } = ctx;
    const k = vm.kpis;
    const rev = vm.revenue;
    const pts = rev.points;
    const n = pts.length;
    const max = niceMax(rev.max * 1.05);

    const W = 760, H = 206, x0 = 54, x1 = 748, y0 = 12, y1 = 172;
    const bw = (x1 - x0) / n;
    const barW = Math.max(2, bw * 0.62);
    const y = v => y1 - (v / max) * (y1 - y0);
    const bars = pts.map((p, i) => ({
      x: x0 + i * bw + (bw - barW) / 2,
      h: y1 - y(p.v),
      top: y(p.v),
    }));
    const avg = rev.avg;
    const avgY = y(avg);

    const months = vm.cohorts;
    const regionsMax = Math.max(...vm.regions.map(r => r.share));

    return `
    <div class="sw-root" id="sw-top">
      <header class="sw-head">
        <div class="sw-head-brand">
          <span class="sw-mark">M</span>
          <span class="sw-head-title">Meridian</span>
          <span class="sw-head-sub">Revenue Intelligence / Отчёт</span>
        </div>
        <div class="sw-head-meta">
          <span>Выпуск 04</span>
          <span class="sw-head-dot"></span>
          <span>${vm.rangeLabel}</span>
        </div>
        <div class="sw-head-actions">
          <button class="sw-btn" data-action="export">${icon('download', 13)} CSV</button>
          <button class="sw-btn sw-btn--red" data-theme-open>${icon('grid', 13)} Концепции</button>
        </div>
      </header>

      <main class="sw-main">
        <section class="sw-title">
          <div class="sw-title-index">01</div>
          <div class="sw-title-main">
            <p class="sw-kicker">Квартальный обзор · ${vm.segment.label}</p>
            <h1>Выручка<br>в цифрах</h1>
          </div>
          <div class="sw-title-side">
            <p>Период</p>
            <b>${vm.rangeLabel}</b>
            <p class="sw-title-side-note">${vm.compareLabel.charAt(0).toUpperCase() + vm.compareLabel.slice(1)}</p>
          </div>
        </section>

        <section class="sw-hero">
          <div class="sw-hero-num">
            <span class="sw-hero-label">Выручка за период</span>
            <div class="sw-hero-value">
              <span data-count="${rev.total}" data-kind="money">${fmtMoney(rev.total)}</span>
              <em class="${rev.delta >= 0 ? 'up' : 'down'}">${fmtDelta(rev.delta)}</em>
            </div>
            <div class="sw-hero-meta">
              <span>${fmtInt(pts.length)} точек данных</span>
              <span>Пик ${fmtMoney(rev.peak.v)}</span>
              <span>Медиана ${fmtMoney(rev.avg)}</span>
            </div>
          </div>
          <div class="sw-hero-side">
            <div class="sw-mini">
              <span>MRR</span><b>${k.mrr.value}</b><em class="${k.mrr.good ? 'up' : 'down'}">${k.mrr.deltaLabel}</em>
            </div>
            <div class="sw-mini">
              <span>NRR</span><b>${k.nrr.value}</b><em class="${k.nrr.good ? 'up' : 'down'}">${k.nrr.deltaLabel}</em>
            </div>
            <div class="sw-mini">
              <span>Отток</span><b>${k.churn.value}</b><em class="${k.churn.good ? 'up' : 'down'}">${k.churn.deltaLabel}</em>
            </div>
          </div>
        </section>

        <section class="sw-controls">
          ${rangeControl('sw', state)}
          ${segmentSelect('sw', state)}
          <div class="sw-legend">
            <span><i class="sw-sq"></i>Выручка</span>
            <span><i class="sw-line"></i>Среднее <b>${fmtMoneyShort(avg)}</b></span>
          </div>
        </section>

        <section class="sw-chart" id="sw-chart">
          <div class="sw-chart-head">
            <h2>Динамика по дням</h2>
            <span>₽ · ${vm.range.label}</span>
          </div>
          <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Столбчатая диаграмма выручки">
            ${[0, .25, .5, .75, 1].map(t => `<line x1="${x0}" x2="${x1}" y1="${y1 - t * (y1 - y0)}" y2="${y1 - t * (y1 - y0)}" stroke="#111" stroke-opacity="${t === 0 ? .55 : .1}" stroke-width="${t === 0 ? 1 : .8}"/>`).join('')}
            ${[0, .5, 1].map(t => `<text x="0" y="${y1 - t * (y1 - y0) + 3}" fill="#8c887d" font-size="8" font-family="JetBrains Mono, monospace">${fmtMoneyShort(max * t)}</text>`).join('')}
            ${bars.map((b, i) => `<rect class="sw-bar" data-i="${i}" x="${b.x.toFixed(1)}" y="${b.top.toFixed(1)}" width="${barW.toFixed(1)}" height="${Math.max(1, b.h).toFixed(1)}" fill="${pts[i].v >= avg ? '#111' : '#c9c4b6'}" data-orig="${pts[i].v >= avg ? '#111' : '#c9c4b6'}"/>`).join('')}
            <line x1="${x0}" x2="${x1}" y1="${avgY}" y2="${avgY}" stroke="#e2231a" stroke-width="1" stroke-dasharray="4 3"/>
            ${[0, Math.round((n - 1) / 2), n - 1].map(i => `<text x="${(x0 + i * bw + bw / 2).toFixed(1)}" y="${H - 8}" text-anchor="${i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}" fill="#8c887d" font-size="8" font-family="JetBrains Mono, monospace">${pts[i].label.toUpperCase()}</text>`).join('')}
          </svg>
        </section>

        <section class="sw-split">
          <article class="sw-panel sw-table-panel" id="sw-accounts">
            <div class="sw-panel-head">
              <h2>Аккаунты</h2>
              <label class="sw-search">
                <input data-search value="${esc(state.search)}" placeholder="ПОИСК" aria-label="Поиск по аккаунтам">
                ${icon('search', 12)}
              </label>
            </div>
            <div class="sw-table">
              <div class="sw-tr sw-th">
                <span>№</span><span>Аккаунт</span><span>Регион</span><span class="sw-right">MRR</span><span class="sw-right">Δ</span>
              </div>
              ${vm.accounts.slice(0, 7).map((a, i) => `
                <button class="sw-tr sw-row" data-account-id="${a.id}">
                  <span class="sw-idx">${String(i + 1).padStart(2, '0')}</span>
                  <span class="sw-name">${esc(a.name)}<em>${esc(a.owner)}</em></span>
                  <span class="sw-region">${esc(a.region)}</span>
                  <span class="sw-right sw-num">${fmtMoney(a.mrr)}</span>
                  <span class="sw-right sw-num ${a.growth >= 0 ? 'up' : 'down'}">${fmtDelta(a.growth)}</span>
                </button>`).join('')}
            </div>
            <div class="sw-panel-foot">
              <span>${vm.accountCount} аккаунтов в выборке</span>
              <button data-open-palette class="sw-link">Полный список →</button>
            </div>
          </article>

          <div class="sw-col">
            <article class="sw-panel sw-funnel-panel">
              <div class="sw-panel-head"><h2>Воронка</h2><span>${vm.range.label}</span></div>
              <div class="sw-funnel">
                ${vm.funnel.map((f, i) => {
                  const pct = f.value / vm.funnel[0].value * 100;
                  return `<div class="sw-frow">
                    <span class="sw-fidx">${String(i + 1).padStart(2, '0')}</span>
                    <span class="sw-flabel">${f.label}</span>
                    <span class="sw-fbar"><i style="width:${Math.max(2, pct)}%"></i></span>
                    <span class="sw-fnum">${fmtInt(f.value)}</span>
                  </div>`;
                }).join('')}
              </div>
            </article>

            <article class="sw-panel sw-regions-panel">
              <div class="sw-panel-head"><h2>Регионы</h2><span>Доля</span></div>
              <div class="sw-regions">
                ${vm.regions.map(r => `
                  <div class="sw-rrow">
                    <span>${r.name}</span>
                    <span class="sw-rbar"><i style="width:${r.share / regionsMax * 100}%"></i></span>
                    <b>${fmtPct(r.share)}</b>
                    <em class="${r.delta >= 0 ? 'up' : 'down'}">${fmtDelta(r.delta)}</em>
                  </div>`).join('')}
              </div>
            </article>

            <article class="sw-panel sw-note-panel">
              <p class="sw-note-mark">“</p>
              <p class="sw-note-text">Рост обеспечивают Enterprise-контракты: три сделки закрылись с расширением на 30%+.</p>
              <p class="sw-note-by">Анна Ковалёва · Head of Revenue</p>
            </article>
          </div>
        </section>

        <section class="sw-bottom">
          <article class="sw-panel">
            <div class="sw-panel-head"><h2>Когорты удержания</h2><span>% возврата</span></div>
            <div class="sw-cohort">
              <div class="sw-cohort-row sw-cohort-head">
                <span>Месяц</span>${['M1','M2','M3','M4','M5','M6'].map(m => `<span>${m}</span>`).join('')}
              </div>
              ${months.values.map((row, ri) => `
                <div class="sw-cohort-row">
                  <span class="sw-cohort-month">${months.months[ri]}</span>
                  ${row.map(v => v == null ? `<span class="sw-cell sw-cell--empty">—</span>`
                    : `<span class="sw-cell" style="--v:${((v - 40) / 60).toFixed(3)};color:${(v - 40) / 60 > 0.55 ? '#f4f1ea' : '#111'}">${v}</span>`).join('')}
                </div>`).join('')}
            </div>
          </article>

          <article class="sw-panel">
            <div class="sw-panel-head"><h2>Каналы</h2><span>Выручка</span></div>
            <div class="sw-channels">
              ${vm.channels.map((c, i) => `
                <div class="sw-crow">
                  <span class="sw-cidx">${String(i + 1).padStart(2, '0')}</span>
                  <span class="sw-cname">${c.name}</span>
                  <span class="sw-cval">${fmtMoney(c.value)}</span>
                  <span class="sw-cshare">${fmtPct(c.share)}</span>
                  <em class="${c.delta >= 0 ? 'up' : 'down'}">${fmtDelta(c.delta)}</em>
                </div>`).join('')}
            </div>
          </article>
        </section>

        <footer class="sw-foot">
          <span>MERIDIAN — REVENUE INTELLIGENCE</span>
          <span>СИНТЕТИЧЕСКИЙ ДАТАСЕТ · ${vm.updated.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
          <span>03 / GRID &amp; INK</span>
        </footer>
      </main>
    </div>`;
  },

  mount(root, vm) {
    attachBarHover(root, '.sw-bar', i => {
      const p = vm.revenue.points[Number(i)];
      const d = p.prev ? (p.v - p.prev) / p.prev * 100 : null;
      return `<div class="tt-date">${p.full}</div>
        <div class="tt-row"><span class="tt-label">Выручка</span><span class="tt-val">${fmtMoney(p.v)}</span></div>
        ${d != null ? `<div class="tt-row"><span class="tt-label">Δ</span><span class="tt-val" style="color:${d >= 0 ? 'var(--good)' : 'var(--bad)'}">${fmtDelta(d)}</span></div>` : ''}`;
    });
    root.querySelectorAll('.sw-bar').forEach(b => {
      b.addEventListener('pointerenter', () => b.setAttribute('fill', '#e2231a'));
      b.addEventListener('pointerleave', () => b.setAttribute('fill', b.dataset.orig));
    });
    root.querySelectorAll('[data-count]').forEach(el => {
      const kind = el.dataset.kind;
      countUp(el, Number(el.dataset.count), v => kind === 'money' ? fmtMoney(v) : fmtInt(v), 950);
    });
  },
};
