import { useEffect, useRef } from 'react';
import { fmtMoney, fmtMoneyShort, fmtInt, fmtPct, fmtDelta, shortDate, longDate, monthYear } from '../lib/data';
import type { ViewModel, AppState } from '../lib/data';
import type { ThemeProps } from '../lib/themes';
import { icon, logo, delta, rangeControl, rangeShort, segmentControl, segmentSelect, avatar, themeButton, countUp, healthColor, tinyBars } from '../lib/ui';
import { linePath, areaPath, sparkPath, donutArcs, niceMax, attachLineHover, attachBarHover, roundedBar, hideTip, arcPath, polar, roundRect, clamp, ticks } from '../lib/charts';
import '../styles/themes/blueprint.css';

/* ============================================================
   CONCEPT 08 · ЧЕРТЁЖ / Blueprint
   An engineering drawing of the revenue system: dimension lines,
   hatching, schedules, title block. No shadows, only linework.
   ============================================================ */

const ESC_MAP: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s: unknown) => String(s).replace(/[&<>"']/g, c => ESC_MAP[c]);


/* dashed dimension line with arrows */
function dim(x1, y1, x2, y2, label, opts: Record<string, any> = {}) {
  const { size = 5, anchor = 'middle', dx = 0, dy = -6, color = 'var(--bp-dim)' } = opts;
  return `<g stroke="${color}" fill="none" stroke-width=".9">
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>
    <path d="M${x1},${y1} l${size},${-size * .55} M${x1},${y1} l${size},${size * .55}" />
    <path d="M${x2},${y2} l${-size},${-size * .55} M${x2},${y2} l${-size},${size * .55}" />
  </g>
  <text x="${(x1 + x2) / 2 + dx}" y="${(y1 + y2) / 2 + dy}" fill="${color}" font-family="JetBrains Mono, monospace" font-size="8.5" text-anchor="${anchor}" letter-spacing=".06em" stroke="#0a2c55" stroke-width="4" paint-order="stroke" stroke-linejoin="round">${label}</text>`;
}

/* vertical dimension line with rotated label */
function vdim(x, ya, yb, label) {
  return `<g stroke="var(--bp-dim)" fill="none" stroke-width=".9">
    <line x1="${x}" y1="${ya}" x2="${x}" y2="${yb}"/>
    <path d="M${x},${ya} l-3.4,5.5 M${x},${ya} l3.4,5.5"/>
    <path d="M${x},${yb} l-3.4,-5.5 M${x},${yb} l3.4,-5.5"/>
  </g>
  <text transform="rotate(-90 ${x + 11} ${(ya + yb) / 2})" x="${x + 11}" y="${(ya + yb) / 2 + 3}" fill="var(--bp-dim)" font-family="JetBrains Mono, monospace" font-size="8.5" text-anchor="middle" letter-spacing=".08em" stroke="#0a2c55" stroke-width="4" paint-order="stroke" stroke-linejoin="round">${label}</text>`;
}

function render(vm: ViewModel, state: AppState): string {
    const k = vm.kpis;
    const rev = vm.revenue;
    const pts = rev.points;
    const n = pts.length;
    const max = niceMax(rev.max * 1.12);

    const peak = rev.peak;

    const dims = [
      { l: 'ВЫРУЧКА', k: k.revenue, kind: 'money' },
      { l: 'MRR', k: k.mrr, kind: 'money' },
      { l: 'NRR', k: k.nrr, kind: 'pct' },
      { l: 'ОТТОК', k: k.churn, kind: 'pct' },
      { l: 'АККАУНТЫ', k: k.accounts, kind: 'int' },
    ];

    const notes = [
      'Все размеры приведены в ₽, без НДС.',
      'Сравнение — с предыдущим периодом той же длины.',
      'Сегмент фильтрует ряды выручки и таблицу деталей.',
      'Пиковое значение отмечено допуском ±2σ.',
    ];

    /* one chart renderer, two geometries: wide sheet and narrow sheet */
    const mkChart = ({ W, H, x0, x1, y0, y1, sheet, small }) => {
      const x = i => x0 + (i / Math.max(1, n - 1)) * (x1 - x0);
      const y = v => y1 - (v / max) * (y1 - y0);
      const line = linePath(pts, x, y, 0.13);
      const peakX = x(peak.i), peakY = y(peak.v);
      const flip = peakX > x1 - (small ? 118 : 232);
      const dir = flip ? -1 : 1;
      const ax = peakX + dir * (small ? 26 : 56);
      const bx = peakX + dir * (small ? 86 : 206);
      const fs = small ? 10 : 8;
      const tickFont = small ? 9.5 : 8;
      const hatchId = `bpHatch${sheet}`;

      return `
        <div class="bp-chartwrap chart-live bp-chartwrap--${sheet}">
          <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Профиль выручки">
            <defs>
              <pattern id="${hatchId}" width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="7" stroke="#bcdcff" stroke-width="1" stroke-opacity=".26"/>
              </pattern>
            </defs>

            ${[0, .25, .5, .75, 1].map(t => `<line x1="${x0}" x2="${x1}" y1="${(y1 - t * (y1 - y0)).toFixed(1)}" y2="${(y1 - t * (y1 - y0)).toFixed(1)}" stroke="#bcdcff" stroke-opacity="${t === 0 ? .5 : .13}" stroke-width=".8"/>`).join('')}
            ${[0, .5, 1].map(t => `<text x="${x0 - (small ? 6 : 8)}" y="${(y1 - t * (y1 - y0) + 3).toFixed(1)}" fill="#9dc4e8" font-size="${fs}" font-family="JetBrains Mono, monospace" text-anchor="end">${fmtMoneyShort(max * t)}</text>`).join('')}

            <path d="${line} L${x1},${y1} L${x0},${y1} Z" fill="url(#${hatchId})"/>
            <path d="${line}" fill="none" stroke="#e8f4ff" stroke-width="1.7" stroke-linejoin="round" pathLength="1" class="bp-line"/>
            ${state.compare ? `<path d="${linePath(pts.map(p => ({ v: p.prev ?? p.v })), x, y, .13)}" fill="none" stroke="#7fd3ff" stroke-opacity=".5" stroke-width="1" stroke-dasharray="5 4"/>` : ''}

            <line x1="${x0}" x2="${x1}" y1="${y1}" y2="${y1}" stroke="#dceaf7" stroke-opacity=".7" stroke-width="1"/>
            ${[0, Math.round((n - 1) / 2), n - 1].map(i => `
              <line x1="${x(i).toFixed(1)}" x2="${x(i).toFixed(1)}" y1="${y1}" y2="${y1 + 5}" stroke="#dceaf7" stroke-opacity=".5"/>
              <text x="${x(i).toFixed(1)}" y="${H - (small ? 8 : 16)}" fill="#9dc4e8" font-size="${tickFont}" font-family="JetBrains Mono, monospace" text-anchor="${i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}">${pts[i].label.toUpperCase()}</text>`).join('')}

            ${small ? '' : `<g class="bp-dimtop">
              ${dim(x0, y0 - 18, x1, y0 - 18, `ОБЩАЯ ДЛИНА · ${pts.length} ТОЧЕК`, { dy: -6 })}
              ${vdim(x1 + 24, y1, y0, `H = ${fmtMoneyShort(max).toUpperCase()}`)}
            </g>`}

            ${small ? `<g class="bp-peak">
              <line x1="${peakX.toFixed(1)}" y1="${peakY.toFixed(1)}" x2="${peakX.toFixed(1)}" y2="${y1}" stroke="#ffd08a" stroke-opacity=".5" stroke-dasharray="2 3"/>
              <circle cx="${peakX.toFixed(1)}" cy="${peakY.toFixed(1)}" r="3.4" fill="#0a2c55" stroke="#ffd08a" stroke-width="1.4"/>
              <text x="${x0}" y="17" fill="#ffd08a" font-size="9.5" font-family="JetBrains Mono, monospace" letter-spacing=".12em">ПИК<tspan dx="7" fill="#ffe3b8" letter-spacing=".02em">${fmtMoney(peak.v)} · ${peak.label}</tspan></text>
            </g>` : `<g class="bp-peak">
              <line x1="${peakX.toFixed(1)}" y1="${peakY.toFixed(1)}" x2="${peakX.toFixed(1)}" y2="${y1}" stroke="#ffd08a" stroke-opacity=".5" stroke-dasharray="2 3"/>
              <circle cx="${peakX.toFixed(1)}" cy="${peakY.toFixed(1)}" r="4.2" fill="#0a2c55" stroke="#ffd08a" stroke-width="1.4"/>
              <path d="M${peakX.toFixed(1)},${peakY.toFixed(1)} L${ax.toFixed(1)},${y0 + 22} L${bx.toFixed(1)},${y0 + 22}" fill="none" stroke="#ffd08a" stroke-opacity=".6" stroke-dasharray="2 3"/>
              <text x="${bx.toFixed(1)}" y="${y0 + 18}" fill="#ffe3b8" font-size="9" font-family="JetBrains Mono, monospace" text-anchor="${flip ? 'start' : 'end'}"><tspan fill="#ffd08a" letter-spacing=".12em">ПИК</tspan><tspan dx="6">${fmtMoney(peak.v)} · ${peak.label}</tspan></text>
            </g>`}

            <line class="hover-cursor" y1="${y0}" y2="${y1}" stroke="#ffffff" stroke-opacity=".45" stroke-dasharray="2 3" opacity="0"/>
            <circle class="hover-dot" r="${small ? 3.4 : 4}" fill="#0a2c55" stroke="#fff" stroke-width="1.8" opacity="0"/>
            <circle class="hover-dot-prev" r="3" fill="#0a2c55" stroke="#7fd3ff" stroke-width="1.2" opacity="0"/>
          </svg>
        </div>`;
    };

    return `
    <div class="bp-root" id="bp-top">
      <div class="bp-grid" aria-hidden="true"></div>
      <div class="bp-frame" aria-hidden="true"></div>

      <header class="bp-head">
        <div class="bp-head-l">
          <span class="bp-mark">${logo(20)}</span>
          <span class="bp-head-name">MERIDIAN</span>
          <span class="bp-head-sep">|</span>
          <span class="bp-head-sub">REVENUE SYSTEMS · DWG 08</span>
        </div>
        <div class="bp-head-r">
          <span class="bp-rev">REV C</span>
          <button class="bp-btn" data-open-palette>${icon('search', 13)} ПОИСК</button>
          <button class="bp-btn" data-theme-open>${icon('grid', 13)} ЛИСТЫ</button>
          <button class="bp-btn bp-btn--ink" data-action="export">${icon('download', 13)} CSV</button>
        </div>
      </header>

      <main class="bp-main">
        <section class="bp-top">
          <div class="bp-title">
            <div class="bp-sheetrow">
              <span>SHEET 08 OF 10</span>
              <span>SCALE 1:100</span>
              <span>${longDate(vm.today).toUpperCase()}</span>
            </div>
            <h1>ВЫРУЧКА<br><span>СИСТЕМА</span></h1>
            <p class="bp-lede">Сборочный чертёж выручки: профиль, допуски, спецификация узлов и сечения воронки. Все элементы связаны и реагируют на фильтры.</p>
            <div class="bp-tags">
              <span>ПЕРИОД · ${vm.range.label.toUpperCase()}</span>
              <span>СЕГМЕНТ · ${vm.segment.label.toUpperCase()}</span>
              <span class="bp-tag-live"><i></i>ONLINE</span>
            </div>
          </div>

          <div class="bp-dims">
            <div class="bp-dims-head">
              <span>ГАБАРИТНЫЕ РАЗМЕРЫ</span>
              <span>±0,5%</span>
            </div>
            ${dims.map(({ l, k: kk, kind }) => `
              <div class="bp-dim">
                <span class="bp-dim-l">${l}</span>
                <b data-count="${kk.raw}" data-kind="${kind}">${kk.value}</b>
                <em class="${kk.good ? 'up' : 'down'}">${kk.deltaLabel}</em>
              </div>`).join('')}
            <div class="bp-dims-foot">
              <span>ДОПУСК ПО ПЕРИОДУ</span>
              <b>${fmtDelta(rev.delta)}</b>
            </div>
          </div>
        </section>

        <section class="bp-elev">
          <div class="bp-panel-head">
            <div>
              <span class="bp-panel-kicker">ELEVATION A–A</span>
              <h2>Профиль выручки</h2>
            </div>
            <div class="bp-panel-ctl">
              <div class="bp-ranges">
                ${['7d','30d','90d','12m'].map((r, i) => `<button class="bp-r ${state.range === r ? 'on' : ''}" data-range="${r}">${['7Д','30Д','90Д','12М'][i]}</button>`).join('')}
              </div>
              <label class="bp-select">
                <select data-segment-select aria-label="Сегмент">
                  ${['all','enterprise','mid','startup'].map(s => `<option value="${s}" ${state.segment === s ? 'selected' : ''}>${{all:'ВСЕ',enterprise:'ENTERPRISE',mid:'MID-MARKET',startup:'STARTUP'}[s]}</option>`).join('')}
                </select>
                ${icon('chevron', 11)}
              </label>
            </div>
          </div>

          ${mkChart({ W: 966, H: 246, x0: 74, x1: 906, y0: 44, y1: 192, sheet: 'desk', small: false })}
          ${mkChart({ W: 400, H: 252, x0: 44, x1: 390, y0: 42, y1: 200, sheet: 'mob', small: true })}

          <div class="bp-chart-foot">
            <span>СРЕДНЕЕ <b>${fmtMoney(rev.avg)}</b></span>
            <span>МИН <b>${fmtMoney(Math.min(...pts.map(p => p.v)))}</b></span>
            <span>МАКС <b>${fmtMoney(rev.max)}</b></span>
            <span class="bp-foot-hand">штриховка — площадь под кривой</span>
          </div>
        </section>

        <section class="bp-mid">
          <article class="bp-spec">
            <div class="bp-panel-head bp-panel-head--tight">
              <div>
                <span class="bp-panel-kicker">SCHEDULE OF PARTS</span>
                <h2>Спецификация узлов</h2>
              </div>
              <label class="bp-search">
                ${icon('search', 12)}
                <input data-search value="${esc(state.search)}" placeholder="ФИЛЬТР" aria-label="Поиск по аккаунтам">
              </label>
            </div>
            <div class="bp-table">
              <div class="bp-tr bp-th">
                <span>ПОЗ.</span><span>НАИМЕНОВАНИЕ</span><span>КОЛ-ВО</span><span>MRR</span><span>ДОПУСК</span>
              </div>
              ${vm.accounts.slice(0, 7).map((a, i) => `
                <button class="bp-tr bp-row" data-account-id="${a.id}">
                  <span class="bp-pos">${String(i + 1).padStart(2, '0')}</span>
                  <span class="bp-part">${esc(a.name)}<em>${esc(a.region)} · ${esc(a.plan)}</em></span>
                  <span class="bp-qty">${a.seats}</span>
                  <span class="bp-mrr">${fmtMoney(a.mrr)}</span>
                  <span class="bp-tol ${a.growth >= 0 ? 'up' : 'down'}">${fmtDelta(a.growth)}</span>
                </button>`).join('')}
            </div>
            <div class="bp-spec-foot">
              <span>ПОЗИЦИЙ В ВЫБОРКЕ: <b>${vm.accountCount}</b></span>
              <button class="bp-link" data-open-palette>ПОЛНАЯ ВЕДОМОСТЬ →</button>
            </div>
          </article>

          <div class="bp-right">
            <article class="bp-section">
              <div class="bp-panel-head bp-panel-head--tight">
                <div>
                  <span class="bp-panel-kicker">SECTION B–B</span>
                  <h2>Сечение воронки</h2>
                </div>
                <span class="bp-panel-note">${vm.range.label.toUpperCase()}</span>
              </div>
              <div class="bp-funnel">
                ${vm.funnel.map((f, i) => {
                  const p = f.value / vm.funnel[0].value;
                  return `<div class="bp-fstep">
                    <span class="bp-fidx">${String(i + 1).padStart(2, '0')}</span>
                    <span class="bp-fshape" style="--w:${(18 + p * 82).toFixed(1)}%"><i></i></span>
                    <span class="bp-flabel">${f.label}</span>
                    <b class="bp-fval">${fmtInt(f.value)}</b>
                    <em class="bp-frate">${f.rate.toFixed(1)}%</em>
                  </div>`;
                }).join('')}
              </div>
            </article>

            <article class="bp-notes">
              <div class="bp-panel-head bp-panel-head--tight">
                <div>
                  <span class="bp-panel-kicker">NOTES</span>
                  <h2>Примечания</h2>
                </div>
                <span class="bp-panel-note">1:100</span>
              </div>
              <ol class="bp-notes-list">
                ${notes.map(nt => `<li>${nt}</li>`).join('')}
              </ol>
              <p class="bp-pencil">сверить с прошлым кварталом ↗</p>
            </article>
          </div>
        </section>

        <section class="bp-plan">
          <div class="bp-panel-head bp-panel-head--tight">
            <div>
              <span class="bp-panel-kicker">PLAN VIEW</span>
              <h2>План распределения</h2>
            </div>
            <span class="bp-panel-note">ДОЛЯ ВЫРУЧКИ</span>
          </div>
          <div class="bp-plan-body">
            <div class="bp-compass" aria-hidden="true">
              <svg viewBox="0 0 240 240">
                <g fill="none" stroke="#bcdcff">
                  <circle cx="120" cy="120" r="106" stroke-opacity=".26"/>
                  <circle cx="120" cy="120" r="78" stroke-opacity=".14" stroke-dasharray="2 4"/>
                  <circle cx="120" cy="120" r="50" stroke-opacity=".14" stroke-dasharray="2 4"/>
                  <circle cx="120" cy="120" r="22" stroke-opacity=".14" stroke-dasharray="2 4"/>
                  <path d="M120,4 L120,236 M4,120 L236,120" stroke-opacity=".18"/>
                  ${Array.from({ length: 36 }, (_, i) => {
                    const a = (i * 10 - 90) * Math.PI / 180;
                    const r1 = i % 9 === 0 ? 96 : 101;
                    return `<path d="M${(120 + Math.cos(a) * r1).toFixed(1)},${(120 + Math.sin(a) * r1).toFixed(1)} L${(120 + Math.cos(a) * 106).toFixed(1)},${(120 + Math.sin(a) * 106).toFixed(1)}" stroke-opacity="${i % 9 === 0 ? .55 : .22}"/>`;
                  }).join('')}
                  <path d="M120,120 L${(120 + Math.cos(-90 * Math.PI / 180) * 106).toFixed(1)},${(120 + Math.sin(-90 * Math.PI / 180) * 106).toFixed(1)}" stroke-opacity=".5" stroke-width="1.2"/>
                  ${vm.regions.map((r, i) => {
                    const a = (-90 + i * (360 / vm.regions.length)) * Math.PI / 180;
                    const rr = 34 + r.share * 1.62;
                    const px = 120 + Math.cos(a) * rr;
                    const py = 120 + Math.sin(a) * rr;
                    const lx = 120 + Math.cos(a) * (rr + 15);
                    const ly = 120 + Math.sin(a) * (rr + 15);
                    const anchor = Math.cos(a) > .25 ? 'start' : Math.cos(a) < -.25 ? 'end' : 'middle';
                    return `<path d="M${px.toFixed(1)},${py.toFixed(1)} L${(120 + Math.cos(a) * 106).toFixed(1)},${(120 + Math.sin(a) * 106).toFixed(1)}" stroke="#7fd3ff" stroke-opacity=".22" stroke-dasharray="1 3"/>
                    <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${(3.6 + r.share / 14).toFixed(1)}" fill="#7fd3ff" fill-opacity=".2" stroke="#7fd3ff" stroke-opacity=".85" stroke-width="1"/>
                    <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="1" fill="#e8f4ff" stroke="none"/>
                    <text x="${lx.toFixed(1)}" y="${(ly + 2.5).toFixed(1)}" text-anchor="${anchor}" font-family="JetBrains Mono, monospace" font-size="6.5" fill="#9dc4e8" letter-spacing=".8">0${i + 1}</text>`;
                  }).join('')}
                </g>
                <text x="120" y="112" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="6.5" fill="#9dc4e8" letter-spacing="2.2">MERIDIAN</text>
                <text x="120" y="130" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="15" fill="#e8f4ff" letter-spacing=".5">${fmtInt(vm.accountCount)}</text>
                <text x="120" y="142" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="6" fill="#6f9cc9" letter-spacing="1.4">АККАУНТОВ</text>
                <text x="13" y="122" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="6.5" fill="#8fb9dd" letter-spacing="1.4">З</text>
              </svg>
            </div>
            <div class="bp-regions">
              ${vm.regions.map((r, i) => { const rm = Math.max(...vm.regions.map(x => x.share)); return `
                <div class="bp-region">
                  <span class="bp-region-idx">${String(i + 1).padStart(2, '0')}</span>
                  <span class="bp-region-name">${r.name.toUpperCase()}</span>
                  <span class="bp-region-bar"><i style="width:${(r.share / rm * 100).toFixed(1)}%"></i></span>
                  <b>${fmtPct(r.share)}</b>
                  <em class="${r.delta >= 0 ? 'up' : 'down'}">${fmtDelta(r.delta)}</em>
                </div>`; }).join('')}
            </div>
            <div class="bp-segments">
              <span class="bp-panel-kicker">COMPONENTS</span>
              ${vm.channels.slice(0, 4).map((c, i) => `
                <div class="bp-comp">
                  <span class="bp-comp-id">C${i + 1}</span>
                  <span class="bp-comp-name">${c.name}</span>
                  <span class="bp-comp-val">${fmtMoney(c.value)}</span>
                  <span class="bp-comp-share">${fmtPct(c.share)}</span>
                </div>`).join('')}
            </div>
          </div>
        </section>

        <footer class="bp-titleblock">
          <div class="bp-tb"><span>ПРОЕКТ</span><b>MERIDIAN / REVENUE INTELLIGENCE</b></div>
          <div class="bp-tb"><span>ЛИСТ</span><b>08 / 10</b></div>
          <div class="bp-tb"><span>МАСШТАБ</span><b>1:100</b></div>
          <div class="bp-tb"><span>ЧЕРТИЛ</span><b>А. КОВАЛЁВА</b></div>
          <div class="bp-tb"><span>ДАТА</span><b>${vm.updated.toLocaleDateString('ru-RU')}</b></div>
          <div class="bp-tb bp-tb--last"><span>РЕВИЗИЯ</span><b>C</b></div>
        </footer>
      </main>
    </div>`;
}

function mount(rootEl: HTMLElement, vm: ViewModel, state: AppState): (() => void) | void {
  // строковая разметка v1: узлы ищутся вручную, DOM здесь нетипизирован
  const root = rootEl as any;
    const max = niceMax(vm.revenue.max * 1.12);
    const tip = p => `<div class="tt-date">${p.full}</div>
        <div class="tt-row"><span class="tt-label">Выручка</span><span class="tt-val">${fmtMoney(p.v)}</span></div>
        ${p.prev != null ? `<div class="tt-row"><span class="tt-label">Прошлый</span><span class="tt-val">${fmtMoney(p.prev)}</span></div>` : ''}`;
    attachLineHover(root.querySelector('.bp-chartwrap--desk'), vm.revenue.points,
      { x0: 74, x1: 906, y0: 44, y1: 192, w: 966, h: 246, yMax: max, yMin: 0 },
      tip);
    attachLineHover(root.querySelector('.bp-chartwrap--mob'), vm.revenue.points,
      { x0: 44, x1: 390, y0: 42, y1: 200, w: 400, h: 252, yMax: max, yMin: 0 },
      tip);
    root.querySelectorAll('[data-count]').forEach(el => {
      const kind = el.dataset.kind;
      const fmt = v => kind === 'money' ? fmtMoney(v) : kind === 'int' ? fmtInt(v) : fmtPct(v);
      countUp(el, Number(el.dataset.count), fmt, 950);
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
    return () => {
      if (typeof cleanup === 'function') cleanup();
      // тултип общий на всю страницу: при смене темы он не должен остаться висеть
      hideTip();
    };
  });

  void actions;
  return <div ref={ref} />;
}
