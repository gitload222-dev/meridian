import { useEffect, useRef } from 'react';
import { fmtMoney, fmtMoneyShort, fmtInt, fmtPct, fmtDelta, shortDate, longDate, monthYear } from '../lib/data';
import type { ViewModel, AppState } from '../lib/data';
import type { ThemeProps } from '../lib/themes';
import { icon, logo, delta, rangeControl, rangeShort, segmentControl, segmentSelect, avatar, themeButton, countUp, healthColor, tinyBars } from '../lib/ui';
import { linePath, areaPath, sparkPath, donutArcs, niceMax, attachLineHover, attachBarHover, roundedBar, arcPath, polar, roundRect, clamp, ticks } from '../lib/charts';
import '../styles/themes/herbarium.css';

/* ============================================================
   CONCEPT 06 · ГЕРБАРИЙ / Field Herbarium
   A botanical field notebook: cream paper, specimen plates,
   ink-green linework, handwritten annotations.
   ============================================================ */

const ESC_MAP: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s: unknown) => String(s).replace(/[&<>"']/g, c => ESC_MAP[c]);

/* procedural botanical plate ------------------------------------------------ */
function plant(vm: ViewModel, seed = 3) {
  let r = seed * 9301 + 49297;
  const rnd = () => { r = (r * 9301 + 49297) % 233280; return r / 233280; };

  const H = 420, baseY = H - 26;
  const stemPts: [number, number][] = [];
  for (let i = 0; i <= 30; i++) {
    const t = i / 30;
    const x = 208 + Math.sin(t * 3.4 + 0.35) * 30 * (1 - t * 0.3) + t * 14;
    stemPts.push([x, baseY - t * (baseY - 62)]);
  }
  const at = (t: number): [number, number] => stemPts[Math.min(30, Math.max(0, Math.round(t * 30)))];
  const dStem = stemPts.map(([x, y], i) => (i === 0 ? `M${x.toFixed(1)},${y.toFixed(1)}` : `L${x.toFixed(1)},${y.toFixed(1)}`)).join(' ');

  const leaves: any[] = [];
  const count = 11;
  for (let i = 0; i < count; i++) {
    const t = 0.12 + (i / count) * 0.8;
    const [x, y] = at(t);
    const side = i % 2 === 0 ? 1 : -1;
    const scale = (0.42 + (1 - t) * 0.62) * (0.9 + rnd() * 0.22);
    const len = 74 * scale;
    const ang = (52 + rnd() * 26) * Math.PI / 180;
    const dx = Math.sin(ang) * len * side;
    const dy = -Math.cos(ang) * len * 0.92;
    const tipX = x + dx, tipY = y + dy;
    const w = len * (0.34 + rnd() * 0.07);
    const nx = -dy / Math.hypot(dx, dy) * w * side;
    const ny = dx / Math.hypot(dx, dy) * w * side;
    const midX = x + dx * 0.5, midY = y + dy * 0.5;
    const d = `M${x.toFixed(1)},${y.toFixed(1)} C${(x + dx * .18 + nx).toFixed(1)},${(y + dy * .18 + ny).toFixed(1)} ${(tipX - dx * .28 + nx * .72).toFixed(1)},${(tipY - dy * .28 + ny * .72).toFixed(1)} ${tipX.toFixed(1)},${tipY.toFixed(1)} C${(tipX - dx * .28 - nx * .58).toFixed(1)},${(tipY - dy * .28 - ny * .58).toFixed(1)} ${(x + dx * .18 - nx * .5).toFixed(1)},${(y + dy * .18 - ny * .5).toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)} Z`;
    const veins = [0.28, 0.48, 0.68].map(k => {
      const vx = x + dx * k, vy = y + dy * k;
      const s2 = side * (1 - k * 0.5);
      return `M${vx.toFixed(1)},${vy.toFixed(1)} l${(nx * 0.5 * s2 + dx * 0.09).toFixed(1)},${(ny * 0.5 * s2 + dy * 0.09).toFixed(1)}`;
    });
    leaves.push({ d, tipX, tipY, midX, midY, veins, i, scale, ang: Math.atan2(dy, dx) });
  }

  const flowers: any[] = [];
  for (let i = 0; i < 7; i++) {
    const [x, y] = at(0.9 + i * 0.013);
    flowers.push({ x: x + (i - 3) * 9.5 + (rnd() - .5) * 3, y: y - 26 - Math.abs(i - 3) * 4.5, r: 4.4 + (i % 3) * 0.9 });
  }

  const goal = vm.goals.revenue;
  return `
  <svg class="hb-plant" viewBox="0 0 420 420" role="img" aria-label="Ботаническая иллюстрация роста">
    <defs>
      <linearGradient id="hbLeaf" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#93a885" stop-opacity=".72"/>
        <stop offset=".55" stop-color="#7a9170" stop-opacity=".5"/>
        <stop offset="1" stop-color="#4c6350" stop-opacity=".55"/>
      </linearGradient>
      <linearGradient id="hbLeaf2" x1="1" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#a3b697" stop-opacity=".6"/>
        <stop offset="1" stop-color="#5a7059" stop-opacity=".5"/>
      </linearGradient>
      <filter id="hbRough" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" result="t"/>
        <feDisplacementMap in="SourceGraphic" in2="t" scale="1.1" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
    </defs>
    <g stroke="#33452f" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="${dStem}" stroke-width="7" opacity=".05" filter="url(#hbRough)"/>
      <path d="${dStem}" stroke-width="1.7" opacity=".9"/>
      ${leaves.map(l => `
        <g transform="rotate(${(l.ang * 180 / Math.PI).toFixed(1)} ${l.tipX.toFixed(1)} ${l.tipY.toFixed(1)})"></g>
        <path d="${l.d}" fill="${l.i % 2 ? 'url(#hbLeaf2)' : 'url(#hbLeaf)'}" stroke-width="1" opacity="${(0.62 + l.scale * 0.34).toFixed(2)}"/>
        <path d="M${(l.midX - (l.tipX - l.midX) * .1).toFixed(1)},${(l.midY - (l.tipY - l.midY) * .1).toFixed(1)} L${l.tipX.toFixed(1)},${l.tipY.toFixed(1)}" stroke-width=".65" opacity=".55"/>
        ${l.veins.map(v => `<path d="${v}" stroke-width=".5" opacity=".42"/>`).join('')}
      `).join('')}
      ${flowers.map(f => `
        <g opacity=".85">
          ${[0, 60, 120, 180, 240, 300].map(a => {
            const rad = (a - 90) * Math.PI / 180;
            const cx = f.x + Math.cos(rad) * f.r * 1.15;
            const cy = f.y + Math.sin(rad) * f.r * 1.15;
            return `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${(f.r * 0.78).toFixed(1)}" ry="${(f.r * 0.52).toFixed(1)}" transform="rotate(${a} ${cx.toFixed(1)} ${cy.toFixed(1)})" fill="#c2674b" fill-opacity=".3" stroke="#a85a41" stroke-width=".55"/>`;
          }).join('')}
          <circle cx="${f.x.toFixed(1)}" cy="${f.y.toFixed(1)}" r="${(f.r * 0.42).toFixed(1)}" fill="#c2674b" fill-opacity=".55" stroke="#a85a41" stroke-width=".5"/>
        </g>`).join('')}
      <path d="M${at(0)[0]},${baseY + 4} q-14,10 0,16 q14,-6 0,-16" fill="#7a9170" fill-opacity=".3" stroke-width=".9"/>
    </g>
    <g stroke="#2f3e2e" stroke-opacity=".26" stroke-width=".8" fill="none">
      <line x1="22" y1="16" x2="22" y2="404"/><line x1="22" y1="404" x2="398" y2="404"/>
      <line x1="22" y1="16" x2="398" y2="16"/><line x1="398" y1="16" x2="398" y2="404"/>
      ${[0, 1, 2, 3, 4].map(i => `<line x1="22" y1="${16 + i * 97}" x2="32" y2="${16 + i * 97}"/>`).join('')}
    </g>
    <text x="38" y="32" font-family="JetBrains Mono, monospace" font-size="6.5" fill="#8b9a80" letter-spacing="1.5">FIG. 1 — CURVA CRESCENDI</text>
    <g transform="translate(38 388)">
      <line x1="0" y1="0" x2="64" y2="0" stroke="#8b9a80" stroke-width="1"/>
      <line x1="0" y1="-3" x2="0" y2="3" stroke="#8b9a80" stroke-width="1"/>
      <line x1="64" y1="-3" x2="64" y2="3" stroke="#8b9a80" stroke-width="1"/>
      <text x="70" y="3" font-family="JetBrains Mono, monospace" font-size="6" fill="#8b9a80" letter-spacing="1">30 ДНЕЙ</text>
    </g>
    <text x="352" y="386" font-family="Caveat, cursive" font-size="16" fill="#c2674b" text-anchor="end" transform="rotate(-4 352 386)">${Math.round(goal * 100)}% к цели</text>
  </svg>`;
}


function render(vm: ViewModel, state: AppState): string {
    const k = vm.kpis;
    const rev = vm.revenue;
    const pts = rev.points;
    const n = pts.length;
    const max = niceMax(rev.max * 1.06);

    const W = 700, H = 210, x0 = 34, x1 = 690, y0 = 16, y1 = 172;
    const x = i => x0 + (i / Math.max(1, n - 1)) * (x1 - x0);
    const y = v => y1 - (v / max) * (y1 - y0);
    const line = linePath(pts, x, y, 0.24);
    const labelIdx = n <= 7 ? pts.map((_, i) => i) : [0, Math.round((n - 1) / 2), n - 1];

    const seasons = [
      { m: 'Весна', v: 0.78, note: 'пробуждение' },
      { m: 'Лето', v: 0.92, note: 'рост' },
      { m: 'Осень', v: 1.0, note: 'сбор' },
      { m: 'Зима', v: 0.84, note: 'покой' },
    ];

    const latin = ['Quercus', 'Pinus', 'Betula', 'Acer', 'Tilia', 'Fraxinus', 'Alnus', 'Ulmus', 'Salix', 'Populus'];
    const specimens = vm.accounts.slice(0, 4);

    return `
    <div class="hb-root" id="hb-top">
      <header class="hb-head">
        <div class="hb-head-l">
          <span class="hb-seal">M</span>
          <div>
            <span class="hb-head-title">Meridian</span>
            <span class="hb-head-sub">Полевой журнал выручки</span>
          </div>
        </div>
        <div class="hb-head-mid">
          <span>Том IV</span><i></i><span>${monthYear(vm.today)}</span><i></i><span>Лист 06</span>
        </div>
        <div class="hb-head-r">
          <button class="hb-btn" data-open-palette>${icon('search', 13)} Поиск</button>
          <button class="hb-btn hb-btn--accent" data-theme-open>${icon('leaf', 13)} Концепции</button>
        </div>
      </header>

      <main class="hb-main">
        <section class="hb-hero">
          <div class="hb-hero-copy">
            <p class="hb-kicker">Наблюдение · ${vm.rangeLabel}</p>
            <h1>Гербарий<br><em>выручки</em></h1>
            <p class="hb-lede">Каждый аккаунт — отдельный вид. Мы собираем, препарируем и подписываем: что растёт, что вянет и где почва ещё плодородна.</p>
            <div class="hb-handnote">${icon('leaf', 15)} сезон сбора: ${vm.segment.label.toLowerCase()}</div>
          </div>
          <div class="hb-plate">
            <div class="hb-plate-paper">
              ${plant(vm, 7)}
            </div>
            <p class="hb-plate-caption">Табл. I · Кривая роста выручки, ${vm.range.label.toLowerCase()}</p>
          </div>
        </section>

        <section class="hb-labels">
          ${[
            { k: k.revenue, n: '01', lat: 'Reditus' },
            { k: k.mrr, n: '02', lat: 'Reditus menstruus' },
            { k: k.accounts, n: '03', lat: 'Clientes vivi' },
            { k: k.nrr, n: '04', lat: 'Retentio' },
            { k: k.churn, n: '05', lat: 'Defluxio' },
          ].map(({ k: kk, n: num, lat }) => `
            <article class="hb-label">
              <div class="hb-label-top">
                <span class="hb-label-num">${num}</span>
                <span class="hb-label-lat">${lat}</span>
              </div>
              <div class="hb-label-value" data-count="${kk.raw}" data-kind="${kk.id === 'accounts' ? 'int' : kk.id === 'revenue' || kk.id === 'mrr' ? 'money' : 'pct'}">${kk.value}</div>
              <div class="hb-label-foot">
                <span>${kk.label}</span>
                <em class="${kk.good ? 'up' : 'down'}">${kk.deltaLabel}</em>
              </div>
              <div class="hb-label-rule"><i style="width:${Math.min(100, 40 + Math.abs(kk.delta) * 8)}%"></i></div>
            </article>`).join('')}
        </section>

        <section class="hb-body">
          <article class="hb-paper hb-chart-paper" id="hb-chart">
            <div class="hb-paper-head">
              <div>
                <p class="hb-paper-label">Кривая роста · Fig. 2</p>
                <h2>Динамика выручки</h2>
              </div>
              <div class="hb-paper-ctl">
                <div class="hb-ranges">
                  ${['7d','30d','90d','12m'].map((r, i) => `<button class="hb-r ${state.range === r ? 'on' : ''}" data-range="${r}">${['7Д','30Д','90Д','12М'][i]}</button>`).join('')}
                </div>
                <label class="hb-select">
                  <select data-segment-select aria-label="Сегмент">
                    ${['all','enterprise','mid','startup'].map(s => `<option value="${s}" ${state.segment === s ? 'selected' : ''}>${{all:'Все сегменты',enterprise:'Enterprise',mid:'Mid-market',startup:'Startup'}[s]}</option>`).join('')}
                  </select>
                  ${icon('chevron', 12)}
                </label>
              </div>
            </div>
            <div class="hb-chartwrap chart-live">
              <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Кривая выручки">
                <g stroke="#2f3e2e" stroke-opacity=".14" stroke-dasharray="1 5">
                  ${[0, .5, 1].map(t => `<line x1="${x0}" x2="${x1}" y1="${y1 - t * (y1 - y0)}" y2="${y1 - t * (y1 - y0)}"/>`).join('')}
                </g>
                ${[0, .5, 1].map(t => `<text x="0" y="${y1 - t * (y1 - y0) + 3}" fill="#8b9a80" font-size="8" font-family="JetBrains Mono, monospace">${fmtMoneyShort(max * t)}</text>`).join('')}
                <path d="${line}" fill="none" stroke="#2f3e2e" stroke-width="1.8" stroke-linecap="round" pathLength="1" class="hb-line"/>
                <path d="${line} L${x(n - 1)},${y1} L${x0},${y1} Z" fill="#8b9a80" opacity=".12"/>
                ${pts.filter((_, i) => i % Math.max(1, Math.round(n / 6)) === 0).map(p => `
                  <g class="hb-leafmark">
                    <circle cx="${x(p.i)}" cy="${y(p.v)}" r="8" fill="#f5efe1" stroke="#c2674b" stroke-width="1" opacity=".9"/>
                    <path d="M${x(p.i)},${y(p.v) - 4} q4,2 0,8 q-4,-6 0,-8" fill="#c2674b" opacity=".55"/>
                  </g>`).join('')}
                <line class="hover-cursor" y1="${y0}" y2="${y1}" stroke="#c2674b" stroke-dasharray="2 4" opacity="0"/>
                <circle class="hover-dot" r="5" fill="#f5efe1" stroke="#c2674b" stroke-width="2" opacity="0"/>
                <circle class="hover-dot-prev" r="3" fill="none" stroke="#8b9a80" stroke-width="1.4" opacity="0"/>
                ${labelIdx.map(i => `<text x="${x(i)}" y="${H - 8}" text-anchor="${i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}" fill="#8b9a80" font-size="8.5" font-family="JetBrains Mono, monospace">${pts[i].label.toUpperCase()}</text>`).join('')}
              </svg>
            </div>
            <div class="hb-paper-foot">
              <span>Пик: <b>${fmtMoney(rev.peak.v)}</b> · ${rev.peak.label}</span>
              <span class="hb-annot">собрано вручную, 30 дней</span>
            </div>
          </article>

          <aside class="hb-side">
            <article class="hb-paper hb-seasons">
              <p class="hb-paper-label">Сезонность · Fig. 3</p>
              <h2>Четыре сезона</h2>
              <div class="hb-season-list">
                ${seasons.map((s, i) => `
                  <div class="hb-season">
                    <span class="hb-season-name">${s.m}</span>
                    <span class="hb-season-bar"><i style="width:${s.v * 100}%"></i></span>
                    <span class="hb-season-val">${fmtPct(s.v * 100, 0)}</span>
                    <em>${s.note}</em>
                  </div>`).join('')}
              </div>
              <p class="hb-season-note">Осень — пик сбора. Квартальные сделки закрываются в октябре.</p>
            </article>

            <article class="hb-paper hb-regions">
              <p class="hb-paper-label">Ареал · Fig. 4</p>
              <h2>География</h2>
              <div class="hb-region-list">
                ${vm.regions.map(r => `
                  <div class="hb-region">
                    <span class="hb-region-dot" style="--s:${(r.share / 46).toFixed(2)}"></span>
                    <span class="hb-region-name">${r.name}</span>
                    <span class="hb-region-lead"></span>
                    <b>${fmtPct(r.share)}</b>
                  </div>`).join('')}
              </div>
            </article>
          </aside>
        </section>

        <section class="hb-specimens" id="hb-specimens">
          <div class="hb-specimens-head">
            <div>
              <p class="hb-paper-label">Коллекция · Fig. 5</p>
              <h2>Образцы</h2>
            </div>
            <label class="hb-search">
              ${icon('search', 13)}
              <input data-search value="${esc(state.search)}" placeholder="Найти образец" aria-label="Поиск по аккаунтам">
            </label>
          </div>
          <div class="hb-specimen-grid">
            ${specimens.length ? specimens.map((a, i) => `
              <button class="hb-specimen" data-account-id="${a.id}">
                <span class="hb-specimen-pin"></span>
                <span class="hb-specimen-latin">${latin[i % latin.length]} ${String(i + 1).padStart(2, '0')}</span>
                <span class="hb-specimen-name">${esc(a.name)}</span>
                <span class="hb-specimen-region">${esc(a.region)}</span>
                <span class="hb-specimen-leaf" style="--h:${a.health}">
                  <svg viewBox="0 0 60 60" aria-hidden="true">
                    <path d="M30,54 C30,38 30,24 30,10" stroke="#3f5741" stroke-width="1.2" fill="none"/>
                    ${[0,1,2].map(j => {
                      const yy = 20 + j * 11, side = j % 2 ? 1 : -1;
                      return `<path d="M30,${yy} Q${30 + side * 11},${yy - 7} ${30 + side * 18},${yy - 12} Q${30 + side * 9},${yy - 2} 30,${yy}" fill="#7d9270" fill-opacity="${(0.35 + a.health / 200).toFixed(2)}" stroke="#3f5741" stroke-width=".7"/>`;
                    }).join('')}
                  </svg>
                </span>
                <span class="hb-specimen-data">
                  <em>MRR</em><b>${fmtMoney(a.mrr)}</b>
                  <em>Δ</em><b class="${a.growth >= 0 ? 'up' : 'down'}">${fmtDelta(a.growth)}</b>
                </span>
                <span class="hb-specimen-health">здоровье ${a.health}</span>
              </button>`).join('') : `<p class="hb-empty">Образцов не найдено. Измените запрос.</p>`}
          </div>
          <div class="hb-specimens-foot">
            <span>Всего в гербарии: ${vm.accountCount}</span>
            <button class="hb-link" data-open-palette>Открыть каталог →</button>
          </div>
        </section>

        <footer class="hb-foot">
          <span>Meridian · полевой журнал выручки · синтетические наблюдения</span>
          <span>${vm.updated.toLocaleDateString('ru-RU')} · лист 06</span>
        </footer>
      </main>
    </div>`;
}

function mount(rootEl: HTMLElement, vm: ViewModel, state: AppState) {
  // строковая разметка v1: узлы ищутся вручную, DOM здесь нетипизирован
  const root = rootEl as any;
    const max = niceMax(vm.revenue.max * 1.06);
    attachLineHover(root.querySelector('.hb-chartwrap'), vm.revenue.points,
      { x0: 34, x1: 690, y0: 16, y1: 172, w: 700, h: 210, yMax: max, yMin: 0 },
      p => `<div class="tt-date">${p.full}</div>
        <div class="tt-row"><span class="tt-label">Выручка</span><span class="tt-val">${fmtMoney(p.v)}</span></div>
        ${p.prev != null ? `<div class="tt-row"><span class="tt-label">Прошлый</span><span class="tt-val">${fmtMoney(p.prev)}</span></div>` : ''}`);
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
    return cleanup;
  });

  void actions;
  return <div ref={ref} />;
}
