import { useEffect, useRef } from 'react';
import { fmtMoney, fmtMoneyShort, fmtInt, fmtPct, fmtDelta, shortDate, longDate, monthYear } from '../lib/data';
import type { ViewModel, AppState } from '../lib/data';
import type { ThemeProps } from '../lib/themes';
import { icon, logo, delta, rangeControl, rangeShort, segmentControl, segmentSelect, avatar, themeButton, countUp, healthColor, tinyBars } from '../lib/ui';
import { linePath, areaPath, sparkPath, donutArcs, niceMax, attachLineHover, attachBarHover, roundedBar, arcPath, polar, roundRect, clamp, ticks } from '../lib/charts';
import '../styles/themes/orbital.css';

/* ============================================================
   CONCEPT 10 · ОРБИТА / Orbital
   Mission-control telemetry: a radial flight instrument, orbital
   rings, star field and a signal trace. Cold, precise, spacious.
   ============================================================ */

const ESC_MAP: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s: unknown) => String(s).replace(/[&<>"']/g, c => ESC_MAP[c]);


function render(vm: ViewModel, state: AppState): string {
    const k = vm.kpis;
    const rev = vm.revenue;
    const pts = rev.points;
    const n = pts.length;
    const max = niceMax(rev.max * 1.08);

    const peak = rev.peak;

    /* radial instrument */
    const R = 104, CX = 130, CY = 130;
    const goal = vm.goals.revenue;
    const arcBg = arcPath(CX, CY, R, R - 9, 0, 360);
    const arcVal = arcPath(CX, CY, R, R - 9, 0, Math.max(6, goal * 360));

    const segs = [
      { id: 'all', l: 'ВСЕ' },
      { id: 'enterprise', l: 'ENT' },
      { id: 'mid', l: 'MID' },
      { id: 'startup', l: 'STR' },
    ];

    const systems = [
      { l: 'MRR', k: k.mrr, d: k.mrr.deltaLabel, good: k.mrr.good, fill: .82 },
      { l: 'NRR', k: k.nrr, d: k.nrr.deltaLabel, good: k.nrr.good, fill: Math.min(1, k.nrr.raw / 120) },
      { l: 'ОТТОК', k: k.churn, d: k.churn.deltaLabel, good: k.churn.good, fill: Math.min(1, k.churn.raw / 4) },
      { l: 'КОНВЕРСИЯ', k: k.conversion, d: k.conversion.deltaLabel, good: k.conversion.good, fill: Math.min(1, k.conversion.raw / 8) },
      { l: 'ARPA', k: k.arpa, d: k.arpa.deltaLabel, good: k.arpa.good, fill: .61 },
    ];

    const mkChart = ({ W, H, x0, x1, y0, y1, sheet, small }) => {
      const x = i => x0 + (i / Math.max(1, n - 1)) * (x1 - x0);
      const y = v => y1 - (v / max) * (y1 - y0);
      const line = linePath(pts, x, y, 0.14);
      const peakX = x(peak.i), peakY = y(peak.v);
      const fs = small ? 9 : 8;
      const fill = `orFill${sheet}`, stroke = `orStroke${sheet}`;
      return `
          <div class="or-chartwrap chart-live or-chartwrap--${sheet}">
            <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Траектория выручки">
              <defs>
                <linearGradient id="${fill}" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stop-color="#7fe3ff" stop-opacity=".26"/>
                  <stop offset="1" stop-color="#7fe3ff" stop-opacity="0"/>
                </linearGradient>
                <linearGradient id="${stroke}" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stop-color="#5aa8ff"/>
                  <stop offset=".55" stop-color="#8ff0e2"/>
                  <stop offset="1" stop-color="#d7fbff"/>
                </linearGradient>
              </defs>

              ${[0, .25, .5, .75, 1].map(t => `<line x1="${x0}" x2="${x1}" y1="${(y1 - t * (y1 - y0)).toFixed(1)}" y2="${(y1 - t * (y1 - y0)).toFixed(1)}" stroke="#7fe3ff" stroke-opacity="${t === 0 ? .35 : .07}" stroke-width="1"/>`).join('')}
              ${small ? '' : [0, 1, 2, 3, 4, 5, 6, 7].map(i => `<line x1="${(x0 + i * (x1 - x0) / 7).toFixed(1)}" x2="${(x0 + i * (x1 - x0) / 7).toFixed(1)}" y1="${y0}" y2="${y1}" stroke="#7fe3ff" stroke-opacity=".05"/>`).join('')}
              ${[0, .5, 1].map(t => `<text x="${x0 - (small ? 6 : 10)}" y="${(y1 - t * (y1 - y0) + 3).toFixed(1)}" fill="#6f9ab8" font-size="${fs}" font-family="JetBrains Mono, monospace" text-anchor="end">${fmtMoneyShort(max * t)}</text>`).join('')}

              <path d="${line} L${x1},${y1} L${x0},${y1} Z" fill="url(#${fill})"/>
              <path d="${line}" fill="none" stroke="url(#${stroke})" stroke-width="2" stroke-linejoin="round" pathLength="1" class="or-line"/>
              ${state.compare ? `<path d="${linePath(pts.map(p => ({ v: p.prev ?? p.v })), x, y, .14)}" fill="none" stroke="#7fa8c9" stroke-opacity=".5" stroke-width="1" stroke-dasharray="3 4"/>` : ''}

              ${[0, Math.round((n - 1) / 2), n - 1].map(i => `
                <text x="${x(i).toFixed(1)}" y="${H - (small ? 8 : 10)}" fill="#6f9ab8" font-size="${fs}" font-family="JetBrains Mono, monospace" text-anchor="${i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}">${pts[i].label.toUpperCase()}</text>`).join('')}

              <g class="or-peak">
                <line x1="${peakX.toFixed(1)}" y1="${peakY.toFixed(1)}" x2="${peakX.toFixed(1)}" y2="${y1}" stroke="#8ff0e2" stroke-opacity=".35" stroke-dasharray="2 4"/>
                ${small ? '' : `<circle cx="${peakX.toFixed(1)}" cy="${peakY.toFixed(1)}" r="8" fill="none" stroke="#8ff0e2" stroke-opacity=".35"/>`}
                <circle cx="${peakX.toFixed(1)}" cy="${peakY.toFixed(1)}" r="${small ? 3 : 3.4}" fill="#eafcff" stroke="#8ff0e2" stroke-width="1.6"/>
                <text x="${(peakX + (peakX > x1 - (small ? 110 : 180) ? -12 : 12)).toFixed(1)}" y="${(peakY - (small ? 10 : 16)).toFixed(1)}" fill="#bff3ff" font-size="${fs + .5}" font-family="JetBrains Mono, monospace" letter-spacing=".08em" text-anchor="${peakX > x1 - (small ? 110 : 180) ? 'end' : 'start'}">ПИК ${fmtMoney(peak.v)}</text>
              </g>

              <line class="hover-cursor" y1="${y0}" y2="${y1}" stroke="#d7fbff" stroke-opacity=".5" stroke-dasharray="2 4" opacity="0"/>
              <circle class="hover-dot" r="${small ? 3.6 : 4.5}" fill="#050a14" stroke="#d7fbff" stroke-width="1.8" opacity="0"/>
              <circle class="hover-dot-prev" r="3" fill="#050a14" stroke="#7fa8c9" stroke-width="1.2" opacity="0"/>
            </svg>
          </div>`;
    };

    return `
    <div class="or-root" id="or-top">
      <div class="or-space" aria-hidden="true">
        <span class="or-starfield"></span>
        <span class="or-glow or-glow--a"></span>
        <span class="or-glow or-glow--b"></span>
      </div>

      <header class="or-bar">
        <div class="or-bar-l">
          <span class="or-mark">${logo(18)}</span>
          <span class="or-brand">MERIDIAN</span>
          <span class="or-bar-div"></span>
          <span class="or-bar-sub">ORBITAL · REVENUE TELEMETRY</span>
        </div>
        <div class="or-bar-r">
          <span class="or-link"><i></i>LINK STABLE</span>
          <span class="or-clock">${vm.updated.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} UTC+3</span>
          <button class="or-btn" data-open-palette>${icon('search', 13)}<span>ПОИСК</span></button>
          <button class="or-btn" data-theme-open>${icon('grid', 13)}<span>КОНЦЕПТЫ</span></button>
          <button class="or-btn or-btn--fill" data-action="export">${icon('download', 13)}<span>CSV</span></button>
        </div>
      </header>

      <main class="or-main">
        <section class="or-hero">
          <div class="or-hero-copy">
            <div class="or-eyebrow">
              <span class="or-eyebrow-n">MISSION 10</span>
              <span class="or-eyebrow-line"></span>
              <span>${longDate(vm.today).toUpperCase()}</span>
            </div>
            <h1>ОРБИТА<br><span>ВЫРУЧКИ</span></h1>
            <p class="or-lede">Телеметрия выручки в реальном времени. Инструменты, траектория, состав экипажа — на одном пульте. Выберите окно наблюдения и сегмент.</p>
            <div class="or-controls">
              <div class="or-windows" role="group" aria-label="Период">
                ${['7d', '30d', '90d', '12m'].map((r, i) => `<button class="or-win ${state.range === r ? 'is-on' : ''}" data-range="${r}"><em>${['7', '30', '90', '365'][i]}</em><span>${['ДН', 'ДН', 'ДН', 'ДН'][i]}</span></button>`).join('')}
              </div>
              <div class="or-segs" role="group" aria-label="Сегмент">
                ${segs.map(s => `<button class="or-seg ${state.segment === s.id ? 'is-on' : ''}" data-segment="${s.id}">${s.l}</button>`).join('')}
              </div>
            </div>
            <div class="or-readouts">
              <div class="or-ro">
                <span>ВЫРУЧКА</span>
                <b data-count="${k.revenue.raw}" data-kind="money">${k.revenue.value}</b>
                <em class="${k.revenue.good ? 'up' : 'down'}">${k.revenue.deltaLabel}</em>
              </div>
              <div class="or-ro">
                <span>АККАУНТЫ</span>
                <b data-count="${k.accounts.raw}" data-kind="int">${k.accounts.value}</b>
                <em class="${k.accounts.good ? 'up' : 'down'}">${k.accounts.deltaLabel}</em>
              </div>
              <div class="or-ro">
                <span>ПЕРИОД</span>
                <b class="or-ro-txt">${vm.range.label}</b>
                <em class="or-ro-note">${vm.segment.label}</em>
              </div>
            </div>
          </div>

          <div class="or-instrument">
            <div class="or-instrument-head">
              <span>ТОПЛИВО ЦЕЛИ</span>
              <span class="or-inst-code">GAUGE-01</span>
            </div>
            <svg viewBox="0 0 260 260" class="or-gauge" role="img" aria-label="Выполнение цели по выручке">
              <defs>
                <linearGradient id="orArc" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stop-color="#8ff0e2"/>
                  <stop offset="1" stop-color="#5aa8ff"/>
                </linearGradient>
                <filter id="orGlow" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="3" result="b"/>
                  <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>
              <g class="or-ticks">
                ${Array.from({ length: 60 }, (_, i) => {
                  const a = i * 6;
                  const r1 = i % 5 === 0 ? 118 : 122;
                  const p1 = polar(CX, CY, r1, a), p2 = polar(CX, CY, 126, a);
                  return `<line x1="${p1.x.toFixed(1)}" y1="${p1.y.toFixed(1)}" x2="${p2.x.toFixed(1)}" y2="${p2.y.toFixed(1)}" stroke="#7fe3ff" stroke-opacity="${i % 5 === 0 ? .55 : .18}" stroke-width="1"/>`;
                }).join('')}
              </g>
              <path d="${arcBg}" fill="none" stroke="#7fe3ff" stroke-opacity=".1" stroke-width="9"/>
              <path d="${arcVal}" fill="none" stroke="url(#orArc)" stroke-width="9" filter="url(#orGlow)" stroke-linecap="butt"/>
              <circle cx="${CX}" cy="${CY}" r="72" fill="none" stroke="#7fe3ff" stroke-opacity=".1"/>
              <circle cx="${CX}" cy="${CY}" r="52" fill="none" stroke="#7fe3ff" stroke-opacity=".16" stroke-dasharray="1 4"/>
              <path d="M${CX - 84},${CY} h8 M${CX + 76},${CY} h8 M${CX},${CY - 84} v8 M${CX},${CY + 76} v8" stroke="#7fe3ff" stroke-opacity=".5"/>
              <text x="${CX}" y="${CY - 16}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="7" fill="#7fa8c9" letter-spacing="2.4">ЦЕЛЬ</text>
              <text x="${CX}" y="${CY + 16}" text-anchor="middle" font-family="Russo One, sans-serif" font-size="34" fill="#eafcff" letter-spacing=".5">${Math.round(goal * 100)}<tspan font-size="16" fill="#7fe3ff">%</tspan></text>
              <text x="${CX}" y="${CY + 34}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="6.5" fill="#5f87a8" letter-spacing="1.6">QUARTER PLAN</text>
            </svg>
            <div class="or-instrument-foot">
              <div><span>ПЛАН</span><b>${fmtMoney(rev.total / goal)}</b></div>
              <div><span>ФАКТ</span><b>${fmtMoney(rev.total)}</b></div>
            </div>
          </div>
        </section>

        <section class="or-trace">
          <div class="or-trace-head">
            <div>
              <span class="or-kicker">SIGNAL · ${vm.range.label.toUpperCase()}</span>
              <h2>Траектория выручки</h2>
            </div>
            <div class="or-trace-legend">
              <span><i class="or-lg or-lg--line"></i>сигнал</span>
              ${state.compare ? '<span><i class="or-lg or-lg--ghost"></i>прошлый</span>' : ''}
              <span><i class="or-lg or-lg--peak"></i>пик</span>
            </div>
          </div>

          ${mkChart({ W: 980, H: 252, x0: 62, x1: 946, y0: 34, y1: 206, sheet: 'desk', small: false })}
          ${mkChart({ W: 380, H: 216, x0: 38, x1: 372, y0: 34, y1: 174, sheet: 'mob', small: true })}

          <div class="or-trace-foot">
            <div><span>СРЕДНЕЕ</span><b>${fmtMoney(rev.avg)}</b></div>
            <div><span>МИН</span><b>${fmtMoney(Math.min(...pts.map(p => p.v)))}</b></div>
            <div><span>МАКС</span><b>${fmtMoney(rev.max)}</b></div>
            <div><span>ДЕЛЬТА</span><b class="${rev.delta >= 0 ? 'up' : 'down'}">${fmtDelta(rev.delta)}</b></div>
            <div class="or-trace-sig">${pts.length} замеров · ${vm.range.label}</div>
          </div>
        </section>

        <section class="or-grid">
          <article class="or-panel or-panel--systems">
            <div class="or-panel-head">
              <div>
                <span class="or-kicker">SUBSYSTEMS</span>
                <h3>Показатели систем</h3>
              </div>
              <span class="or-panel-tag">NOMINAL</span>
            </div>
            <div class="or-systems">
              ${systems.map(sy => `
                <div class="or-sys">
                  <span class="or-sys-l">${sy.l}</span>
                  <b>${sy.k.value}</b>
                  <span class="or-sys-bar"><i style="width:${(sy.fill * 100).toFixed(1)}%"></i></span>
                  <em class="${sy.good ? 'up' : 'down'}">${sy.d}</em>
                </div>`).join('')}
            </div>
          </article>

          <article class="or-panel or-panel--funnel">
            <div class="or-panel-head">
              <div>
                <span class="or-kicker">STAGES</span>
                <h3>Ступени вывода</h3>
              </div>
              <span class="or-panel-tag">${vm.range.label.toUpperCase()}</span>
            </div>
            <div class="or-stages">
              ${vm.funnel.map((f, i) => {
                const p = f.value / vm.funnel[0].value;
                return `<div class="or-stage">
                  <span class="or-stage-n">${String(i + 1).padStart(2, '0')}</span>
                  <div class="or-stage-body">
                    <div class="or-stage-top"><span>${f.label}</span><b>${fmtInt(f.value)}</b></div>
                    <span class="or-stage-bar"><i style="width:${Math.max(4, p * 100).toFixed(1)}%"></i></span>
                  </div>
                  <em>${f.rate.toFixed(1)}%</em>
                </div>`;
              }).join('')}
            </div>
          </article>

          <article class="or-panel or-panel--orbit">
            <div class="or-panel-head">
              <div>
                <span class="or-kicker">ORBIT MAP</span>
                <h3>Секторы</h3>
              </div>
              <span class="or-panel-tag">GEO</span>
            </div>
            <div class="or-orbit">
              <svg viewBox="0 0 200 200" aria-hidden="true">
                <g fill="none" stroke="#7fe3ff">
                  <circle cx="100" cy="100" r="86" stroke-opacity=".14"/>
                  <circle cx="100" cy="100" r="62" stroke-opacity=".1" stroke-dasharray="2 5"/>
                  <circle cx="100" cy="100" r="34" stroke-opacity=".1"/>
                  ${vm.regions.map((r, i) => {
                    const a = -90 + i * (360 / vm.regions.length);
                    const rr = 30 + r.share * 1.08;
                    const p = polar(100, 100, rr, a);
                    const q = polar(100, 100, 86, a);
                    return `<line x1="${p.x.toFixed(1)}" y1="${p.y.toFixed(1)}" x2="${q.x.toFixed(1)}" y2="${q.y.toFixed(1)}" stroke-opacity=".18" stroke-dasharray="1 3"/>
                    <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${(3 + r.share / 12).toFixed(1)}" fill="#7fe3ff" fill-opacity=".2" stroke="#7fe3ff" stroke-opacity=".85"/>
                    <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="1.1" fill="#eafcff" stroke="none"/>`;
                  }).join('')}
                  <circle cx="100" cy="100" r="4" fill="#8ff0e2" fill-opacity=".8" stroke="none"/>
                </g>
                <text x="100" y="97" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="6" fill="#6f9ab8" letter-spacing="1.4">MERIDIAN</text>
              </svg>
              <div class="or-orbit-legend">
                ${vm.regions.map((r, i) => `
                  <div class="or-orbit-row">
                    <span class="or-orbit-i">0${i + 1}</span>
                    <span class="or-orbit-n">${r.name}</span>
                    <span class="or-orbit-bar"><i style="width:${(r.share / 45 * 100).toFixed(1)}%"></i></span>
                    <b>${fmtPct(r.share)}</b>
                    <em class="${r.delta >= 0 ? 'up' : 'down'}">${fmtDelta(r.delta)}</em>
                  </div>`).join('')}
              </div>
            </div>
          </article>
        </section>

        <section class="or-crew">
          <div class="or-crew-head">
            <div>
              <span class="or-kicker">CREW MANIFEST</span>
              <h3>Экипаж · ${vm.accountCount} аккаунтов</h3>
            </div>
            <label class="or-search">
              ${icon('search', 12)}
              <input data-search value="${esc(state.search)}" placeholder="ПОИСК ПО ЭКИПАЖУ" aria-label="Поиск по аккаунтам">
            </label>
          </div>
          <div class="or-table">
            <div class="or-tr or-th">
              <span>ID</span><span>ЭКИПАЖ</span><span>СЕКТОР</span><span>ТЕЛЕМЕТРИЯ</span><span>MRR</span><span>ДЕЛЬТА</span>
            </div>
            ${vm.accounts.slice(0, 6).map((a, i) => `
              <button class="or-tr or-row" data-account-id="${a.id}">
                <span class="or-td-id">${String(i + 1).padStart(3, '0')}</span>
                <span class="or-td-name">${esc(a.name)}<em>${esc(a.owner)}</em></span>
                <span class="or-td-reg">${esc(a.region)}</span>
                <span class="or-td-health">
                  <span class="or-hbar"><i style="width:${a.health}%"></i></span>
                  <em>${a.health}</em>
                </span>
                <span class="or-td-mrr">${fmtMoney(a.mrr)}</span>
                <span class="or-td-d ${a.growth >= 0 ? 'up' : 'down'}">${fmtDelta(a.growth)}</span>
              </button>`).join('')}
          </div>
          <div class="or-crew-foot">
            <span>ПОКАЗАНО ${Math.min(6, vm.accountCount)} ИЗ ${vm.accountCount}</span>
            <button class="or-link" data-open-palette>ПОЛНЫЙ МАНИФЕСТ →</button>
          </div>
        </section>

        <footer class="or-foot">
          <span>MERIDIAN ORBITAL · REV 10</span>
          <span class="or-foot-mid">${longDate(vm.today)} · ${vm.updated.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
          <span>СИГНАЛ ${vm.range.label.toUpperCase()} · ${vm.segment.label.toUpperCase()}</span>
        </footer>
      </main>
    </div>`;
}

function mount(rootEl: HTMLElement, vm: ViewModel, state: AppState) {
  // строковая разметка v1: узлы ищутся вручную, DOM здесь нетипизирован
  const root = rootEl as any;
    const max = niceMax(vm.revenue.max * 1.08);
    const tip = p => `<div class="tt-date">${p.full}</div>
        <div class="tt-row"><span class="tt-label">Выручка</span><span class="tt-val">${fmtMoney(p.v)}</span></div>
        ${p.prev != null ? `<div class="tt-row"><span class="tt-label">Прошлый</span><span class="tt-val">${fmtMoney(p.prev)}</span></div>` : ''}`;
    attachLineHover(root.querySelector('.or-chartwrap--desk'), vm.revenue.points,
      { x0: 62, x1: 946, y0: 34, y1: 206, w: 980, h: 252, yMax: max, yMin: 0 }, tip);
    attachLineHover(root.querySelector('.or-chartwrap--mob'), vm.revenue.points,
      { x0: 38, x1: 372, y0: 34, y1: 174, w: 380, h: 216, yMax: max, yMin: 0 }, tip);

    root.querySelectorAll('[data-count]').forEach(el => {
      const kind = el.dataset.kind;
      const fmt = v => kind === 'money' ? fmtMoney(v) : kind === 'int' ? fmtInt(v) : fmtPct(v);
      countUp(el, Number(el.dataset.count), fmt, 1000);
    });
}

/* ---------------- React-обёртка ----------------
   Разметка темы — та же строка, что в v1: визуальная верность 1:1.
   React отвечает за монтирование, жизненный цикл и code-splitting. */
export default function Theme({ vm, state, actions }: ThemeProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    root.innerHTML = render(vm, state);
    return mount(root, vm, state);
  });

  void actions;
  return <div ref={ref} />;
}
