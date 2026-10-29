/* ============================================================
   CONCEPT 09 · ГАЗЕТА / Broadsheet
   A financial daily: masthead, lead story, engraved chart,
   market table, column rules. Data as journalism.
   ============================================================ */
import { fmtMoney, fmtMoneyShort, fmtInt, fmtPct, fmtDelta, longDate } from '../data.js';
import { icon, logo, countUp } from '../ui.js';
import { niceMax, linePath, attachLineHover } from '../charts.js';

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const WEEKDAYS = ['ВОСКРЕСЕНЬЕ', 'ПОНЕДЕЛЬНИК', 'ВТОРНИК', 'СРЕДА', 'ЧЕТВЕРГ', 'ПЯТНИЦА', 'СУББОТА'];

const poster = `
  <div class="p-np-top"><span>№ 214</span><span>29.X.2026</span><span>ЦЕНА: БЕСПЛАТНО</span></div>
  <div class="p-np-mast">Meridian</div>
  <div class="p-np-sub">ЕЖЕДНЕВНАЯ ГАЗЕТА О ВЫРУЧКЕ · REVENUE INTELLIGENCE</div>
  <div class="p-np-rule"></div>
  <div class="p-np-cols">
    <div class="p-np-col"><b>Выручка растёт третий квартал подряд</b><i></i><i></i><i></i><i></i><i></i></div>
    <div class="p-np-col small"><b>Сводка</b><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
    <div class="p-np-col small"><b>Рынок</b><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
  </div>
  <div class="p-np-stamp">ВЫПУСК 09</div>`;

export default {
  id: 'broadsheet', num: '09', name: 'Газета', en: 'Broadsheet',
  tagline: 'Финансовая ежедневная газета',
  palette: ['#f3efe3', '#16130f', '#a32b22', '#8b8477'],
  bg: '#f3efe3', accent: '#a32b22', poster,

  render(vm, ctx) {
    const { state } = ctx;
    const k = vm.kpis;
    const rev = vm.revenue;
    const pts = rev.points;
    const n = pts.length;
    const max = niceMax(rev.max * 1.1);

    const peak = rev.peak;

    const up = rev.delta >= 0;
    const headline = `${up ? 'Выручка выросла' : 'Выручка снизилась'} на ${fmtPct(Math.abs(rev.delta))}`;

    const topChannel = [...vm.channels].sort((a, b) => b.share - a.share)[0];
    const topRegion = [...vm.regions].sort((a, b) => b.share - a.share)[0];
    const bestRegion = [...vm.regions].sort((a, b) => b.delta - a.delta)[0];
    const worstRegion = [...vm.regions].sort((a, b) => a.delta - b.delta)[0];
    const risk = vm.riskAccounts[0];
    const mover = vm.topMovers[0];
    const healthPct = Math.round(vm.health.healthy / vm.allAccounts.length * 100);

    const summary = [
      { l: 'Выручка за период', k: k.revenue, big: true },
      { l: 'Повторяемая выручка, MRR', k: k.mrr },
      { l: 'Активные аккаунты', k: k.accounts },
      { l: 'Net revenue retention', k: k.nrr },
      { l: 'Конверсия триал → оплата', k: k.conversion },
      { l: 'Отток', k: k.churn },
      { l: 'ARPA', k: k.arpa },
    ];

    const mkChart = ({ W, H, x0, x1, y0, y1, sheet, small }) => {
      const x = i => x0 + (i / Math.max(1, n - 1)) * (x1 - x0);
      const y = v => y1 - (v / max) * (y1 - y0);
      const line = linePath(pts, x, y, 0.13);
      const peakX = x(peak.i), peakY = y(peak.v);
      const flip = peakX > x1 - (small ? 110 : 200);
      const fs = small ? 9.5 : 8.5;
      const dots = `npDots${sheet}`;
      return `
          <div class="np-chartwrap chart-live np-chartwrap--${sheet}">
            <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Динамика выручки">
              <defs>
                <pattern id="${dots}" width="5" height="5" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r=".8" fill="#16130f" fill-opacity=".28"/>
                </pattern>
              </defs>

              ${[0, .5, 1].map(t => `<line x1="${x0}" x2="${x1}" y1="${(y1 - t * (y1 - y0)).toFixed(1)}" y2="${(y1 - t * (y1 - y0)).toFixed(1)}" stroke="#16130f" stroke-opacity="${t === 0 ? .55 : .16}" stroke-width="${t === 0 ? 1 : .7}" stroke-dasharray="${t === 0 ? '' : '1 4'}"/>`).join('')}
              ${[0, .5, 1].map(t => `<text x="${x0 - (small ? 6 : 10)}" y="${(y1 - t * (y1 - y0) + 3).toFixed(1)}" fill="#5d564c" font-size="${fs}" font-family="JetBrains Mono, monospace" text-anchor="end">${fmtMoneyShort(max * t)}</text>`).join('')}

              <path d="${line} L${x1},${y1} L${x0},${y1} Z" fill="url(#${dots})"/>
              <path d="${line}" fill="none" stroke="#16130f" stroke-width="1.6" stroke-linejoin="round" pathLength="1" class="np-line"/>
              ${state.compare ? `<path d="${linePath(pts.map(p => ({ v: p.prev ?? p.v })), x, y, .13)}" fill="none" stroke="#a32b22" stroke-opacity=".65" stroke-width="1" stroke-dasharray="4 3"/>` : ''}

              ${[0, Math.round((n - 1) / 2), n - 1].map(i => `
                <line x1="${x(i).toFixed(1)}" x2="${x(i).toFixed(1)}" y1="${y1}" y2="${y1 + 4}" stroke="#16130f" stroke-opacity=".5"/>
                <text x="${x(i).toFixed(1)}" y="${H - (small ? 8 : 18)}" fill="#5d564c" font-size="${fs}" font-family="JetBrains Mono, monospace" text-anchor="${i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}">${pts[i].label.toUpperCase()}</text>`).join('')}

              <g>
                <line x1="${peakX.toFixed(1)}" y1="${peakY.toFixed(1)}" x2="${peakX.toFixed(1)}" y2="${y1}" stroke="#a32b22" stroke-opacity=".45" stroke-dasharray="2 3"/>
                <circle cx="${peakX.toFixed(1)}" cy="${peakY.toFixed(1)}" r="${small ? 3 : 3.6}" fill="#f3efe3" stroke="#a32b22" stroke-width="1.6"/>
                ${small
                  ? `<text x="${x0}" y="15" fill="#a32b22" font-size="9.5" font-family="JetBrains Mono, monospace" letter-spacing=".1em">ПИК<tspan dx="6" fill="#7a2019">${fmtMoney(peak.v)} · ${peak.label.toUpperCase()}</tspan></text>`
                  : `<path d="M${peakX.toFixed(1)},${peakY.toFixed(1)} L${(peakX + (flip ? -40 : 40)).toFixed(1)},${y0 - 4} L${(peakX + (flip ? -132 : 132)).toFixed(1)},${y0 - 4}" fill="none" stroke="#a32b22" stroke-opacity=".6"/>
                     <text x="${(peakX + (flip ? -136 : 136)).toFixed(1)}" y="${y0 - 7}" fill="#a32b22" font-size="8.5" font-family="JetBrains Mono, monospace" text-anchor="${flip ? 'start' : 'end'}">ПИК ${fmtMoney(peak.v)} · ${peak.label.toUpperCase()}</text>`}
              </g>

              <line class="hover-cursor" y1="${y0}" y2="${y1}" stroke="#16130f" stroke-opacity=".5" stroke-dasharray="2 3" opacity="0"/>
              <circle class="hover-dot" r="${small ? 3.4 : 4}" fill="#f3efe3" stroke="#16130f" stroke-width="1.6" opacity="0"/>
              <circle class="hover-dot-prev" r="3" fill="#f3efe3" stroke="#a32b22" stroke-width="1.2" opacity="0"/>
            </svg>
          </div>`;
    };

    return `
    <div class="np-root" id="np-top">
      <div class="np-paper" aria-hidden="true"></div>

      <div class="np-topstrip">
        <div class="np-topstrip-l">
          <span>${WEEKDAYS[vm.today.getDay()]}, ${longDate(vm.today).toUpperCase()}</span>
          <span class="np-dot">·</span>
          <span>№ 214</span>
          <span class="np-dot">·</span>
          <span>ЦЕНА: БЕСПЛАТНО</span>
        </div>
        <div class="np-topstrip-r">
          <button class="np-tool" data-open-palette>${icon('search', 12)} ПОИСК</button>
          <button class="np-tool" data-theme-open>${icon('grid', 12)} ВЫПУСКИ</button>
          <button class="np-tool" data-action="export">${icon('download', 12)} CSV</button>
        </div>
      </div>

      <header class="np-masthead">
        <div class="np-mast-side">
          <b>ЕЖЕДНЕВНАЯ ГАЗЕТА</b>
          <span>данных о выручке</span>
          <span>основана в 2019</span>
        </div>
        <div class="np-wordmark">
          <h1>Meridian</h1>
          <div class="np-wordmark-sub">REVENUE · INTELLIGENCE · DAILY</div>
        </div>
        <div class="np-mast-side np-mast-side--r">
          <b>САНКТ-ПЕТЕРБУРГ</b>
          <span>Москва · Берлин · Остин</span>
          <span>meridian.report</span>
        </div>
      </header>

      <div class="np-mast-rule"><i></i></div>

      <div class="np-edition">
        <div class="np-edition-l">
          <span class="np-edition-k">ВЫПУСК</span>
          <span class="np-edition-v">${vm.range.label.toUpperCase()}</span>
          <span class="np-edition-k">РУБРИКА</span>
          <span class="np-edition-v">${vm.segment.label.toUpperCase()}</span>
          <span class="np-edition-k np-live"><i></i>ЖИВЫЕ ДАННЫЕ</span>
        </div>
        <div class="np-edition-r">
          <div class="np-tabs" role="group" aria-label="Период">
            ${['7d', '30d', '90d', '12m'].map((r, i) => `<button class="np-tab ${state.range === r ? 'is-on' : ''}" data-range="${r}">${['НЕДЕЛЯ', 'МЕСЯЦ', 'КВАРТАЛ', 'ГОД'][i]}</button>`).join('')}
          </div>
          <label class="np-select">
            <select data-segment-select aria-label="Сегмент">
              ${['all', 'enterprise', 'mid', 'startup'].map(s => `<option value="${s}" ${state.segment === s ? 'selected' : ''}>${{ all: 'ВСЕ СЕГМЕНТЫ', enterprise: 'ENTERPRISE', mid: 'MID-MARKET', startup: 'STARTUP' }[s]}</option>`).join('')}
            </select>
            ${icon('chevron', 12)}
          </label>
        </div>
      </div>

      <main class="np-main">
        <section class="np-front">
          <article class="np-lead">
            <div class="np-kicker"><span>ГЛАВНОЕ</span><i></i><span>${vm.range.label}</span></div>
            <h2 class="np-headline">${headline}<br><em>за ${vm.range.label.toLowerCase()}</em></h2>
            <p class="np-standfirst">Выручка достигла ${k.revenue.value}. ${rev.delta >= 0 ? 'Рост обеспечили' : 'Давление оказали'} ${topChannel.name.toLowerCase()} и ${bestRegion.name}: ${fmtDelta(bestRegion.delta)} к прошлому периоду. Всего в базе ${fmtInt(vm.accountCount)} активных аккаунтов.</p>
            <div class="np-byline">
              <span>Аналитический отдел Meridian</span>
              <span class="np-byline-dot"></span>
              <span>${longDate(vm.today)}</span>
            </div>
            <div class="np-body">
              <p><span class="np-dropcap">${up ? 'Р' : 'С'}</span>${up ? `ост выручки к предыдущему периоду составил ${fmtDelta(rev.delta)}` : `нижение выручки к предыдущему периоду составило ${fmtDelta(rev.delta)}`}. ${topRegion.name} остаётся крупнейшим рынком с долей ${fmtPct(topRegion.share)}; вклад ${topChannel.name.toLowerCase()} — ${fmtPct(topChannel.share)} от общей суммы. Средний чек по портфелю — ${k.arpa.value}.</p>
              <p>Здоровье портфеля: ${healthPct}% клиентов находятся в зелёной зоне, ${vm.health.risk} требуют внимания. Самый быстрорастущий аккаунт — ${esc(mover.name)} (${fmtDelta(mover.growth)}), самый уязвимый — ${esc(risk.name)} с индексом ${risk.health}.</p>
            </div>
            <blockquote class="np-quote">
              «${worstRegion.delta < 0 ? `${worstRegion.name} — ${fmtDelta(worstRegion.delta)}. Это не структурный сдвиг: календарь и одно крупное продление.` : `${bestRegion.name} — ${fmtDelta(bestRegion.delta)}. Подтверждение спроса на годовые контракты.`}»
              <cite>Из еженедельной записки отдела revenue operations</cite>
            </blockquote>
          </article>

          <aside class="np-summary">
            <div class="np-summary-head">
              <h3>Сводка</h3>
              <span>КЛЮЧЕВЫЕ ПОКАЗАТЕЛИ</span>
            </div>
            ${summary.map(({ l, k: kk, big }) => `
              <div class="np-srow ${big ? 'np-srow--big' : ''}">
                <span class="np-srow-l">${l}</span>
                <b data-count="${kk.raw}" data-kind="${kk.id === 'accounts' ? 'int' : kk.id === 'nrr' || kk.id === 'conversion' || kk.id === 'churn' ? 'pct' : 'money'}">${kk.value}</b>
                <em class="${kk.good ? 'up' : 'down'}">${kk.deltaLabel}</em>
              </div>`).join('')}
            <div class="np-summary-foot">
              <span>ДАННЫЕ НА ${vm.updated.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
              <span>${vm.range.label.toUpperCase()}</span>
            </div>
          </aside>
        </section>

        <section class="np-figure">
          <div class="np-figure-head">
            <div class="np-figure-title">
              <span class="np-figure-k">РИС. 1 · ГРАФИК ПЕРИОДА</span>
              <h3>Динамика выручки по дням</h3>
            </div>
            <div class="np-figure-legend">
              <span><i class="np-lg-line"></i>${vm.range.label}</span>
              ${state.compare ? '<span><i class="np-lg-dash"></i>предыдущий</span>' : ''}
              <span><i class="np-lg-peak"></i>пик</span>
            </div>
          </div>

          ${mkChart({ W: 1000, H: 250, x0: 54, x1: 986, y0: 30, y1: 194, sheet: 'desk', small: false })}
          ${mkChart({ W: 380, H: 232, x0: 40, x1: 374, y0: 40, y1: 186, sheet: 'mob', small: true })}

          <div class="np-caption">
            <span><b>Среднее</b> ${fmtMoney(rev.avg)} · <b>Минимум</b> ${fmtMoney(Math.min(...pts.map(p => p.v)))} · <b>Максимум</b> ${fmtMoney(rev.max)}</span>
            <span class="np-caption-src">Источник: Meridian Revenue Cloud, ${pts.length} наблюдений</span>
          </div>
        </section>

        <section class="np-tape">
          <div class="np-tape-label">
            <span>КАНАЛЫ</span>
            <em>доля выручки</em>
          </div>
          ${vm.channels.map(c => `
            <div class="np-tape-cell">
              <span class="np-tape-name">${c.name}</span>
              <b>${fmtPct(c.share)}</b>
              <em class="${c.delta >= 0 ? 'up' : 'down'}">${fmtDelta(c.delta)}</em>
              <span class="np-tape-bar"><i style="width:${(c.share / 34 * 100).toFixed(1)}%"></i></span>
            </div>`).join('')}
          <div class="np-tape-cell np-tape-cell--last">
            <span class="np-tape-name">Итого</span>
            <b>100%</b>
            <em class="up">${fmtDelta(rev.delta)}</em>
            <span class="np-tape-bar"><i style="width:100%"></i></span>
          </div>
        </section>

        <section class="np-two">
          <article class="np-table-block">
            <div class="np-block-head">
              <div>
                <span class="np-block-k">ТАБЛИЦА · КЛИЕНТЫ</span>
                <h3>Крупнейшие аккаунты</h3>
              </div>
              <label class="np-search">
                ${icon('search', 12)}
                <input data-search value="${esc(state.search)}" placeholder="НАЙТИ" aria-label="Поиск по аккаунтам">
              </label>
            </div>
            <div class="np-table">
              <div class="np-tr np-th">
                <span>№</span><span>Аккаунт</span><span>Сегмент</span><span>MRR</span><span>Рост</span>
              </div>
              ${vm.accounts.slice(0, 8).map((a, i) => `
                <button class="np-tr np-row" data-account-id="${a.id}">
                  <span class="np-td-n">${String(i + 1).padStart(2, '0')}</span>
                  <span class="np-td-name">${esc(a.name)}<em>${esc(a.region)} · ${esc(a.owner)}</em></span>
                  <span class="np-td-seg">${esc(a.plan)}</span>
                  <span class="np-td-mrr">${fmtMoney(a.mrr)}</span>
                  <span class="np-td-d ${a.growth >= 0 ? 'up' : 'down'}">${fmtDelta(a.growth)}</span>
                </button>`).join('')}
            </div>
            <div class="np-block-foot">
              <span>Показаны 8 из ${vm.accountCount}</span>
              <button class="np-more" data-open-palette>Полный список →</button>
            </div>
          </article>

          <div class="np-side">
            <article class="np-block">
              <div class="np-block-head np-block-head--tight">
                <div>
                  <span class="np-block-k">ВОРОНКА · ${vm.range.label.toUpperCase()}</span>
                  <h3>Путь до оплаты</h3>
                </div>
              </div>
              <div class="np-funnel">
                ${vm.funnel.map((f, i) => {
                  const p = f.value / vm.funnel[0].value;
                  return `<div class="np-fstep">
                    <span class="np-fname">${f.label}</span>
                    <span class="np-fbar"><i style="width:${(p * 100).toFixed(1)}%"></i></span>
                    <b>${fmtInt(f.value)}</b>
                    <em>${f.rate.toFixed(1)}%</em>
                  </div>`;
                }).join('')}
              </div>
            </article>

            <article class="np-block">
              <div class="np-block-head np-block-head--tight">
                <div>
                  <span class="np-block-k">ГЕОГРАФИЯ</span>
                  <h3>Распределение выручки</h3>
                </div>
              </div>
              <div class="np-geo">
                ${vm.regions.map(r => `
                  <div class="np-geo-row">
                    <span class="np-geo-name">${r.name}</span>
                    <span class="np-geo-dots"></span>
                    <b>${fmtPct(r.share)}</b>
                    <em class="${r.delta >= 0 ? 'up' : 'down'}">${fmtDelta(r.delta)}</em>
                  </div>`).join('')}
              </div>
              <div class="np-block-foot np-block-foot--plain">
                <span>Сумма долей — 100% выручки периода</span>
              </div>
            </article>
          </div>
        </section>

        <footer class="np-footer">
          <div class="np-footer-l">
            <span>MERIDIAN DAILY</span>
            <i></i>
            <span>№ 214 · ${vm.updated.toLocaleDateString('ru-RU')}</span>
          </div>
          <div class="np-footer-r">
            <span>Данные обновлены ${vm.updated.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
            <span>Печать · ${vm.range.label}</span>
          </div>
        </footer>
      </main>
    </div>`;
  },

  mount(root, vm) {
    const max = niceMax(vm.revenue.max * 1.1);
    const tip = p => `<div class="tt-date">${p.full}</div>
        <div class="tt-row"><span class="tt-label">Выручка</span><span class="tt-val">${fmtMoney(p.v)}</span></div>
        ${p.prev != null ? `<div class="tt-row"><span class="tt-label">Прошлый</span><span class="tt-val">${fmtMoney(p.prev)}</span></div>` : ''}`;
    attachLineHover(root.querySelector('.np-chartwrap--desk'), vm.revenue.points,
      { x0: 54, x1: 986, y0: 30, y1: 194, w: 1000, h: 250, yMax: max, yMin: 0 }, tip);
    attachLineHover(root.querySelector('.np-chartwrap--mob'), vm.revenue.points,
      { x0: 40, x1: 374, y0: 40, y1: 186, w: 380, h: 232, yMax: max, yMin: 0 }, tip);

    root.querySelectorAll('[data-count]').forEach(el => {
      const kind = el.dataset.kind;
      const fmt = v => kind === 'money' ? fmtMoney(v) : kind === 'int' ? fmtInt(v) : fmtPct(v);
      countUp(el, Number(el.dataset.count), fmt, 900);
    });
  },
};
