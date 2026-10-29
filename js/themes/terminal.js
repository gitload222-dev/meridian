/* ============================================================
   CONCEPT 04 · ТЕРМИНАЛ / Meridian Terminal
   Dense trading-desk console. Mono, phosphor, tape.
   ============================================================ */
import { fmtMoney, fmtMoneyShort, fmtInt, fmtPct, fmtDelta } from '../data.js';
import { icon, logo, countUp } from '../ui.js';
import { niceMax, linePath, areaPath, attachLineHover, sparkPath, roundedBar } from '../charts.js';

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const poster = `
  <div class="p-tm-head"><i></i><i></i><i></i><span>~/meridian — revenue</span></div>
  <div class="p-tm-body">
    <div class="p-tm-row"><b>42,1</b><span>МЛН ₽</span><em>▲ 2,0%</em></div>
    <div class="p-tm-candles">
      ${[42, 58, 51, 66, 61, 74, 68, 82, 76, 88, 79, 92].map((h, i) =>
        `<i style="--h:${h}%;--c:${i % 3 === 2 ? '#ff6b5e' : '#45e0c0'}"></i>`).join('')}
    </div>
    <div class="p-tm-log">&gt; scan --segment=all --window=30d<br>&gt; nrr 110.5% · churn 1.9% · ok<br>&gt; <span class="caret">█</span></div>
  </div>
  <div class="p-tm-foot"><span>TERMINAL</span><span>04</span></div>`;

export default {
  id: 'terminal', num: '04', name: 'Терминал', en: 'Meridian Terminal',
  tagline: 'Плотный консольный интерфейс',
  palette: ['#050908', '#0f1a16', '#45e0c0', '#e8f5ef'],
  bg: '#050908', accent: '#45e0c0', poster,

  render(vm, ctx) {
    const { state } = ctx;
    const k = vm.kpis;
    const rev = vm.revenue;
    const pts = rev.points;
    const n = pts.length;
    const max = niceMax(rev.max * 1.04);

    const W = 900, H = 300, x0 = 52, x1 = 886, y0 = 18, y1 = 252;
    const x = i => x0 + (i / Math.max(1, n - 1)) * (x1 - x0);
    const y = v => y1 - (v / max) * (y1 - y0);
    const line = linePath(pts, x, y, 0.14);
    const area = areaPath(pts, x, y, y1, 0.14);

    const spread = rev.peak.v - Math.min(...pts.map(p => p.v));

    const tape = [...vm.allAccounts].slice(0, 9);

    const grid = [
      { key: 'revenue', label: 'REV', k: k.revenue, fmt: 'money' },
      { key: 'mrr', label: 'MRR', k: k.mrr, fmt: 'money' },
      { key: 'nrr', label: 'NRR', k: k.nrr, fmt: 'pct' },
      { key: 'conv', label: 'CV%', k: k.conversion, fmt: 'pct' },
      { key: 'churn', label: 'CHN', k: k.churn, fmt: 'pct' },
      { key: 'arpa', label: 'ARPA', k: k.arpa, fmt: 'money' },
    ];

    return `
    <div class="tm-root" id="tm-top">
      <header class="tm-bar">
        <div class="tm-bar-l">
          <span class="tm-logo">${logo(16)}</span>
          <span class="tm-cmd">meridian</span>
          <span class="tm-slash">/</span>
          <span class="tm-path">revenue / overview</span>
          <span class="tm-badge">LIVE</span>
        </div>
        <div class="tm-bar-r">
          <button class="tm-kbd" data-open-palette><span>⌘K</span> поиск</button>
          <button class="tm-theme" data-theme-open>${icon('layers', 13)} <span>04 / Терминал</span></button>
          <span class="tm-clock" id="tm-clock">--:--:--</span>
        </div>
      </header>

      <div class="tm-body">
        <aside class="tm-side">
          <div class="tm-side-head">
            <span class="tm-side-title">TAPE</span>
            <span class="tm-side-sub">ACCOUNTS</span>
          </div>
          <div class="tm-tape">
            ${tape.map(a => `
              <button class="tm-tick" data-account-id="${a.id}">
                <span class="tm-tick-sym">${esc(a.name.slice(0, 12))}</span>
                <span class="tm-tick-num">${(a.mrr / 1000).toFixed(0)}K</span>
                <span class="tm-tick-d ${a.growth >= 0 ? 'up' : 'down'}">${a.growth >= 0 ? '▲' : '▼'}${Math.abs(a.growth).toFixed(1)}</span>
              </button>`).join('')}
          </div>
          <div class="tm-side-block">
            <span class="tm-side-title">SIGNALS</span>
            <div class="tm-signals">
              <div><span class="tm-sig-dot g"></span>NRR &gt; 110%</div>
              <div><span class="tm-sig-dot g"></span>Churn &lt; 2%</div>
              <div><span class="tm-sig-dot a"></span>3 аккаунта в риске</div>
              <div><span class="tm-sig-dot g"></span>Квота 74%</div>
            </div>
          </div>
          <div class="tm-side-foot">
            <span>CPU</span><span class="tm-cpu"><i style="width:38%"></i></span><em>38%</em>
          </div>
        </aside>

        <main class="tm-main">
          <div class="tm-headrow">
            <div>
              <p class="tm-eyebrow">&gt; overview --range=${state.range} --segment=${state.segment}</p>
              <h1>REVENUE <span>CONSOLE</span></h1>
            </div>
            <div class="tm-ctl">
              <div class="tm-ctl-group">
                ${['7d', '30d', '90d', '12m'].map((r, i) => `<button class="tm-r ${state.range === r ? 'on' : ''}" data-range="${r}">${['7D','30D','90D','12M'][i]}</button>`).join('')}
              </div>
              <div class="tm-ctl-group">
                ${['all', 'enterprise', 'mid', 'startup'].map((s, i) => `<button class="tm-r ${state.segment === s ? 'on' : ''}" data-segment="${s}">${['ALL','ENT','MID','STR'][i]}</button>`).join('')}
              </div>
              <button class="tm-icon" data-action="export" title="CSV">${icon('download', 13)}</button>
            </div>
          </div>

          <section class="tm-kpirow">
            ${grid.map((g, i) => `
              <div class="tm-kpi">
                <div class="tm-kpi-h"><span>${g.label}</span><em class="${g.k.good ? 'up' : 'down'}">${g.k.deltaLabel}</em></div>
                <b data-count="${g.k.raw}" data-kind="${g.fmt}">${g.k.value}</b>
                <svg viewBox="0 0 100 22" preserveAspectRatio="none" aria-hidden="true">
                  <path d="${sparkPath(vm.revenue.spark.slice(-14), 100, 22, 2)}" fill="none" stroke="${g.k.good ? 'var(--tm-green)' : 'var(--tm-red)'}" stroke-width="1.2" opacity=".8"/>
                </svg>
              </div>`).join('')}
          </section>

          <section class="tm-chartcard">
            <div class="tm-chart-h">
              <div class="tm-chart-title">
                <span class="tm-chart-sym">MRD</span>
                <span class="tm-chart-name">REVENUE / 1D</span>
                <span class="tm-chart-price" data-count="${rev.total}" data-kind="money">${fmtMoney(rev.total)}</span>
                <span class="tm-chart-d ${rev.delta >= 0 ? 'up' : 'down'}">${fmtDelta(rev.delta)}</span>
              </div>
              <div class="tm-chart-stats">
                <span>H <b>${fmtMoneyShort(rev.peak.v)}</b></span>
                <span>L <b>${fmtMoneyShort(Math.min(...pts.map(p => p.v)))}</b></span>
                <span>AVG <b>${fmtMoneyShort(rev.avg)}</b></span>
                <span>SPRD <b>${fmtMoneyShort(spread)}</b></span>
              </div>
            </div>
            <div class="tm-chartwrap chart-live">
              <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="График выручки">
                <defs>
                  <linearGradient id="tmFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stop-color="#45e0c0" stop-opacity=".28"/>
                    <stop offset="1" stop-color="#45e0c0" stop-opacity="0"/>
                  </linearGradient>
                </defs>
                ${[0, .25, .5, .75, 1].map(t => `<line x1="${x0}" x2="${x1}" y1="${y1 - t * (y1 - y0)}" y2="${y1 - t * (y1 - y0)}" stroke="rgba(69,224,192,.09)" stroke-width="1"/>`).join('')}
                ${[0, .5, 1].map(t => `<text x="0" y="${y1 - t * (y1 - y0) + 3}" fill="#4d6b60" font-size="9" font-family="JetBrains Mono, monospace">${fmtMoneyShort(max * t)}</text>`).join('')}
                <path d="${area}" fill="url(#tmFill)"/>
                <path d="${line}" fill="none" stroke="#45e0c0" stroke-width="1.6" pathLength="1" class="tm-line"/>
                ${state.compare ? `<path d="${linePath(pts.map(p => ({ v: p.prev ?? p.v })), x, y, 0.14)}" fill="none" stroke="rgba(232,245,239,.28)" stroke-width="1" stroke-dasharray="3 4"/>` : ''}
                <line class="hover-cursor" y1="${y0}" y2="${y1}" stroke="rgba(69,224,192,.5)" stroke-dasharray="2 3" opacity="0"/>
                <circle class="hover-dot" r="3.5" fill="#45e0c0" stroke="#050908" stroke-width="2" opacity="0"/>
                <circle class="hover-dot-prev" r="2.5" fill="#050908" stroke="rgba(232,245,239,.5)" stroke-width="1" opacity="0"/>
                ${[0, Math.round((n - 1) / 2), n - 1].map(i => `<text x="${x(i)}" y="${H - 14}" text-anchor="${i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}" fill="#4d6b60" font-size="9" font-family="JetBrains Mono, monospace">${pts[i].label.toUpperCase()}</text>`).join('')}
                <line x1="${x0}" x2="${x1}" y1="${y1}" y2="${y1}" stroke="rgba(69,224,192,.35)"/>
              </svg>
              <div class="tm-crosshair-label" aria-hidden="true"></div>
            </div>
          </section>

          <section class="tm-lower">
            <article class="tm-panel tm-book">
              <div class="tm-panel-h"><span>ORDER BOOK / ACCOUNTS</span><span class="tm-panel-sub">${vm.accountCount}</span></div>
              <div class="tm-book-head">
                <span>SYM</span><span>SEG</span><span>REGION</span><span class="r">MRR</span><span class="r">CHG</span><span class="r">HLTH</span>
              </div>
              <div class="tm-book-body">
                ${vm.accounts.slice(0, 10).map(a => `
                  <button class="tm-book-row" data-account-id="${a.id}">
                    <span class="tm-sym">${esc(a.name)}</span>
                    <span class="tm-seg">${a.segment === 'enterprise' ? 'ENT' : a.segment === 'mid' ? 'MID' : 'STR'}</span>
                    <span class="tm-reg">${esc(a.region)}</span>
                    <span class="r tm-mono">${fmtInt(a.mrr)}</span>
                    <span class="r tm-mono ${a.growth >= 0 ? 'up' : 'down'}">${a.growth >= 0 ? '+' : ''}${a.growth.toFixed(1)}</span>
                    <span class="r tm-mono ${a.health >= 80 ? 'up' : a.health >= 65 ? 'amb' : 'down'}">${a.health}</span>
                  </button>`).join('')}
              </div>
            </article>

            <div class="tm-right">
              <article class="tm-panel tm-depth">
                <div class="tm-panel-h"><span>CHANNEL DEPTH</span><span class="tm-panel-sub">SHARE</span></div>
                <div class="tm-depth-body">
                  ${vm.channels.map((c, i) => `
                    <div class="tm-depth-row">
                      <span class="tm-depth-name">${c.name}</span>
                      <span class="tm-depth-bar"><i style="width:${c.share * 2.8}%"></i></span>
                      <span class="tm-mono">${c.share.toFixed(1)}</span>
                    </div>`).join('')}
                </div>
              </article>

              <article class="tm-panel tm-funnel">
                <div class="tm-panel-h"><span>CONVERSION PATH</span><span class="tm-panel-sub">30D</span></div>
                <div class="tm-funnel-body">
                  ${vm.funnel.map((f, i) => `
                    <div class="tm-frow">
                      <span class="tm-fnum">${String(i + 1).padStart(2, '0')}</span>
                      <span class="tm-flabel">${f.label}</span>
                      <span class="tm-fval tm-mono">${fmtInt(f.value)}</span>
                      <span class="tm-frate tm-mono">${f.rate.toFixed(1)}%</span>
                    </div>`).join('')}
                </div>
              </article>

              <article class="tm-panel tm-log">
                <div class="tm-panel-h"><span>EVENT LOG</span><span class="tm-panel-sub">TAIL -F</span></div>
                <div class="tm-log-body">
                  <p><em>17:42:08</em> sync.complete rows=1326</p>
                  <p><em>17:42:07</em> query nrr window=30d <b class="ok">ok</b></p>
                  <p><em>17:41:55</em> warn account=Кристалл health=58</p>
                  <p><em>17:41:12</em> export csv rows=28 <b class="ok">ok</b></p>
                  <p><em>17:40:03</em> stream connected <b class="ok">ok</b></p>
                  <p class="tm-caret">&gt; <span>█</span></p>
                </div>
              </article>
            </div>
          </section>

          <footer class="tm-foot">
            <span>MERIDIAN TERMINAL v2.4.1 · SYNTHETIC FEED</span>
            <span>FN:1 HELP · F2 RANGE · F3 EXPORT · ⌘K SEARCH</span>
          </footer>
        </main>
      </div>
    </div>`;
  },

  mount(root, vm) {
    const n = vm.revenue.points.length;
    const max = niceMax(vm.revenue.max * 1.04);
    attachLineHover(root.querySelector('.tm-chartwrap'), vm.revenue.points,
      { x0: 52, x1: 886, y0: 18, y1: 252, w: 900, h: 300, yMax: max, yMin: 0 },
      p => {
        const d = p.prev ? (p.v - p.prev) / p.prev * 100 : null;
        return `<div class="tt-date">${p.full}</div>
          <div class="tt-row"><span class="tt-label">REV</span><span class="tt-val">${fmtMoney(p.v)}</span></div>
          ${p.prev != null ? `<div class="tt-row"><span class="tt-label">PREV</span><span class="tt-val">${fmtMoney(p.prev)}</span></div>
          <div class="tt-row"><span class="tt-label">CHG</span><span class="tt-val" style="color:${d >= 0 ? '#45e0c0' : '#ff6b5e'}">${fmtDelta(d)}</span></div>` : ''}`;
      });

    root.querySelectorAll('[data-count]').forEach(el => {
      const kind = el.dataset.kind;
      const fmt = v => kind === 'money' ? fmtMoney(v) : kind === 'int' ? fmtInt(v) : fmtPct(v);
      countUp(el, Number(el.dataset.count), fmt, 900);
    });

    const clock = root.querySelector('#tm-clock');
    const tick = () => {
      if (!document.body.contains(clock)) return;
      clock.textContent = new Date().toLocaleTimeString('ru-RU', { hour12: false });
    };
    tick();
    const id = setInterval(tick, 1000);
    setTimeout(() => clearInterval(id), 600000);
  },
};
