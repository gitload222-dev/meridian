import { useEffect, useRef } from 'react';
import { fmtMoney, fmtMoneyShort, fmtInt, fmtPct, fmtDelta, shortDate, longDate, monthYear } from '../lib/data';
import type { ViewModel, AppState } from '../lib/data';
import type { ThemeProps } from '../lib/themes';
import { icon, logo, delta, rangeControl, rangeShort, segmentControl, segmentSelect, avatar, themeButton, countUp, healthColor, tinyBars } from '../lib/ui';
import { linePath, areaPath, sparkPath, donutArcs, niceMax, attachLineHover, attachBarHover, roundedBar, hideTip, arcPath, polar, roundRect, clamp, ticks } from '../lib/charts';
import '../styles/themes/brutal.css';

/* ============================================================
   CONCEPT 07 · БЕТОН / Concrete & Acid
   Neo-brutalist grid: hard edges, offset shadows, acid accent,
   oversized numerals, mono labels.
   ============================================================ */

const ESC_MAP: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s: unknown) => String(s).replace(/[&<>"']/g, c => ESC_MAP[c]);


function render(vm: ViewModel, state: AppState): string {
    const k = vm.kpis;
    const rev = vm.revenue;
    const pts = rev.points;
    const n = pts.length;
    const max = niceMax(rev.max * 1.04);

    const W = 780, H = 250, x0 = 62, x1 = 772, y0 = 12, y1 = 206;
    const bw = (x1 - x0) / n;
    const y = v => y1 - (v / max) * (y1 - y0);

    const rows = vm.accounts.slice(0, 6);
    const channels = vm.channels.slice(0, 4);

    return `
    <div class="br-root" id="br-top">
      <header class="br-head">
        <div class="br-head-l">
          <span class="br-mark">M/</span>
          <span class="br-head-name">MERIDIAN</span>
          <span class="br-head-tag">REVENUE INTELLIGENCE</span>
        </div>
        <div class="br-head-r">
          <button class="br-btn" data-open-palette>${icon('search', 14)} ПОИСК</button>
          <button class="br-btn br-btn--acid" data-theme-open>${icon('grid', 14)} КОНЦЕПЦИИ</button>
          <button class="br-btn br-btn--solid" data-action="export">ЭКСПОРТ</button>
        </div>
      </header>

      <main class="br-main">
        <section class="br-top">
          <div class="br-title">
            <p class="br-eyebrow">ОТЧЁТ / 04 / ${vm.rangeLabel.toUpperCase()}</p>
            <h1>ВЫРУЧКА<br><span>БЕЗ</span><br>УКРАШЕНИЙ</h1>
            <div class="br-title-foot">
              <span>${vm.segment.label}</span>
              <span>${fmtInt(n)} ТОЧЕК</span>
              <span class="br-live"><i></i>LIVE</span>
            </div>
          </div>

          <div class="br-hero">
            <div class="br-hero-box">
              <span class="br-hero-label">ВЫРУЧКА ЗА ПЕРИОД</span>
              <b class="br-hero-num" data-count="${rev.total}" data-kind="money">${fmtMoney(rev.total)}</b>
              <span class="br-hero-delta ${rev.delta >= 0 ? 'up' : 'down'}">${fmtDelta(rev.delta)} ${vm.compareLabel}</span>
            </div>
            <div class="br-hero-grid">
              ${[
                { k: k.mrr, l: 'MRR' },
                { k: k.accounts, l: 'АККАУНТЫ' },
                { k: k.nrr, l: 'NRR' },
                { k: k.churn, l: 'ОТТОК' },
              ].map(({ k: kk, l }) => `
                <div class="br-mini">
                  <span>${l}</span>
                  <b data-count="${kk.raw}" data-kind="${kk.id === 'accounts' ? 'int' : kk.id === 'mrr' ? 'money' : 'pct'}">${kk.value}</b>
                  <em class="${kk.good ? 'up' : 'down'}">${kk.deltaLabel}</em>
                </div>`).join('')}
            </div>
          </div>
        </section>

        <section class="br-controls">
          <div class="br-ctl-group">
            <span class="br-ctl-label">ПЕРИОД</span>
            <div class="br-chips">
              ${['7d','30d','90d','12m'].map((r, i) => `<button class="br-chip ${state.range === r ? 'on' : ''}" data-range="${r}">${['7Д','30Д','90Д','12М'][i]}</button>`).join('')}
            </div>
          </div>
          <div class="br-ctl-group">
            <span class="br-ctl-label">СЕГМЕНТ</span>
            <div class="br-chips">
              ${['all','enterprise','mid','startup'].map((s, i) => `<button class="br-chip ${state.segment === s ? 'on' : ''}" data-segment="${s}">${['ВСЕ','ENT','MID','STR'][i]}</button>`).join('')}
            </div>
          </div>
          <div class="br-ctl-spacer"></div>
          <button class="br-chip br-chip--ghost" data-action="compare">СРАВНЕНИЕ ${state.compare ? '●' : '○'}</button>
        </section>

        <section class="br-chart-block">
          <div class="br-block-head">
            <h2>ДИНАМИКА / ДЕНЬ</h2>
            <span>₽ · ${vm.range.label.toUpperCase()} · МАКС ${fmtMoneyShort(max).toUpperCase()}</span>
          </div>
          <div class="br-chart">
            <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Выручка по дням">
              ${[0, .5, 1].map(t => `<line x1="${x0}" x2="${x1}" y1="${y1 - t * (y1 - y0)}" y2="${y1 - t * (y1 - y0)}" stroke="#111" stroke-opacity="${t === 0 ? .6 : .13}" stroke-width="1"/>`).join('')}
              ${[0, .5, 1].map(t => `<text x="0" y="${y1 - t * (y1 - y0) + 3}" fill="#6f6c63" font-size="9" font-family="JetBrains Mono, monospace">${fmtMoneyShort(max * t)}</text>`).join('')}
              ${pts.map((p, i) => {
                const h = Math.max(1, y1 - y(p.v));
                return `<rect class="br-bar" data-i="${i}" x="${(x0 + i * bw + bw * 0.16).toFixed(1)}" y="${y(p.v).toFixed(1)}" width="${Math.max(2, bw * 0.68).toFixed(1)}" height="${h.toFixed(1)}" fill="${i === n - 1 ? '#c9f227' : '#111'}" stroke="#111" stroke-width="${i === n - 1 ? 1.4 : 0}"/>`;
              }).join('')}
              ${state.compare ? `<path d="${pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${(x0 + i * bw + bw / 2).toFixed(1)},${y(p.prev ?? p.v).toFixed(1)}`).join(' ')}" fill="none" stroke="#6f6c63" stroke-width="1.4" stroke-dasharray="4 3"/>` : ''}
              ${[0, Math.round((n - 1) / 2), n - 1].map(i => `<text x="${(x0 + i * bw + bw / 2).toFixed(1)}" y="${H - 8}" text-anchor="${i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}" fill="#6f6c63" font-size="9" font-family="JetBrains Mono, monospace">${pts[i].label.toUpperCase()}</text>`).join('')}
            </svg>
          </div>
          <div class="br-chart-foot">
            <span>ПИК <b>${fmtMoney(rev.peak.v)}</b></span>
            <span>СРЕДНЕЕ <b>${fmtMoney(rev.avg)}</b></span>
            <span>ПОСЛЕДНИЙ <b>${fmtMoney(pts[n - 1].v)}</b></span>
          </div>
        </section>

        <section class="br-mid">
          <article class="br-block br-table-block">
            <div class="br-block-head">
              <h2>АККАУНТЫ / ${vm.accountCount}</h2>
              <label class="br-search">
                ${icon('search', 13)}
                <input data-search value="${esc(state.search)}" placeholder="ФИЛЬТР" aria-label="Поиск по аккаунтам">
              </label>
            </div>
            <div class="br-table">
              <div class="br-tr br-th">
                <span>№</span><span>НАЗВАНИЕ</span><span>MRR</span><span>Δ</span><span>ЗДОР</span>
              </div>
              ${rows.map((a, i) => `
                <button class="br-tr br-row" data-account-id="${a.id}">
                  <span class="br-num">${String(i + 1).padStart(2, '0')}</span>
                  <span class="br-name">${esc(a.name)}<em>${esc(a.owner)}</em></span>
                  <span class="br-mrr">${fmtMoney(a.mrr)}</span>
                  <span class="${a.growth >= 0 ? 'up' : 'down'}">${fmtDelta(a.growth)}</span>
                  <span class="br-health"><span class="br-hbar"><b style="width:${a.health}%"></b></span><em>${a.health}</em></span>
                </button>`).join('')}
            </div>
            <button class="br-more" data-open-palette>ВСЕ АККАУНТЫ →</button>
          </article>

          <div class="br-right">
            <article class="br-block br-acid-block">
              <div class="br-block-head br-block-head--dark">
                <h2>ЦЕЛЬ КВАРТАЛА</h2>
                <span>Q4</span>
              </div>
              <div class="br-goal-num">${Math.round(vm.goals.revenue * 100)}<small>%</small></div>
              <div class="br-goal-bar"><i style="width:${vm.goals.revenue * 100}%"></i></div>
              <p class="br-goal-note">${fmtMoney(vm.mrr * 3.1)} ИЗ ${fmtMoney(vm.mrr * 4)}</p>
            </article>

            <article class="br-block">
              <div class="br-block-head"><h2>КАНАЛЫ</h2><span>ДОЛЯ</span></div>
              <div class="br-channels">
                ${channels.map((c, i) => `
                  <div class="br-channel">
                    <span class="br-ch-name">${c.name.toUpperCase()}</span>
                    <span class="br-ch-bar"><i style="width:${c.share * 2.7}%"></i></span>
                    <span class="br-ch-val">${fmtPct(c.share)}</span>
                  </div>`).join('')}
              </div>
            </article>

            <article class="br-block br-regions">
              <div class="br-block-head"><h2>РЕГИОНЫ</h2><span>Δ</span></div>
              ${vm.regions.map(r => `
                <div class="br-region">
                  <span>${r.name.toUpperCase()}</span>
                  <b>${fmtPct(r.share)}</b>
                  <em class="${r.delta >= 0 ? 'up' : 'down'}">${fmtDelta(r.delta)}</em>
                </div>`).join('')}
            </article>
          </div>
        </section>

        <section class="br-funnel-block">
          <div class="br-block-head"><h2>ВОРОНКА</h2><span>${vm.range.label.toUpperCase()}</span></div>
          <div class="br-funnel">
            ${vm.funnel.map((f, i) => {
              const p = f.value / vm.funnel[0].value * 100;
              return `<div class="br-fstep">
                <span class="br-fnum">${String(i + 1).padStart(2, '0')}</span>
                <span class="br-flabel">${f.label.toUpperCase()}</span>
                <span class="br-fbar"><i style="width:${Math.max(1.5, p)}%"></i></span>
                <span class="br-fval">${fmtInt(f.value)}</span>
                <span class="br-frate">${f.rate.toFixed(1)}%</span>
              </div>`;
            }).join('')}
          </div>
        </section>

        <footer class="br-foot">
          <span>MERIDIAN / 07 / CONCRETE &amp; ACID</span>
          <span>СИНТЕТИЧЕСКИЕ ДАННЫЕ · ${vm.updated.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
        </footer>
      </main>
    </div>`;
}

function mount(rootEl: HTMLElement, vm: ViewModel, state: AppState): (() => void) | void {
  // строковая разметка v1: узлы ищутся вручную, DOM здесь нетипизирован
  const root = rootEl as any;
    attachBarHover(root, '.br-bar', i => {
      const p = vm.revenue.points[Number(i)];
      return `<div class="tt-date">${p.full}</div>
        <div class="tt-row"><span class="tt-label">Выручка</span><span class="tt-val">${fmtMoney(p.v)}</span></div>`;
    });
    root.querySelectorAll('[data-count]').forEach(el => {
      const kind = el.dataset.kind;
      const fmt = v => kind === 'money' ? fmtMoney(v) : kind === 'int' ? fmtInt(v) : fmtPct(v);
      countUp(el, Number(el.dataset.count), fmt, 900);
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
