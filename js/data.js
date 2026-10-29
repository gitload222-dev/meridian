/* ============================================================
   MERIDIAN · data layer
   Deterministic synthetic revenue-intelligence dataset.
   ============================================================ */

const DAY = 86_400_000;
const HISTORY = 800;

export const RANGES = [
  { id: '7d',  label: '7 дней',  short: '7Д',  days: 7,   tick: 1 },
  { id: '30d', label: '30 дней', short: '30Д', days: 30,  tick: 1 },
  { id: '90d', label: '90 дней', short: '90Д', days: 90,  tick: 1 },
  { id: '12m', label: '12 месяцев', short: '12М', days: 365, tick: 7 },
];

export const SEGMENTS = [
  { id: 'all',        label: 'Все сегменты', short: 'Все',        share: 1,    accounts: 1326, nrr: 112.4, churn: 1.9, conv: 4.8, funnel: 1 },
  { id: 'enterprise', label: 'Enterprise',   short: 'Enterprise', share: 0.52, accounts: 152,  nrr: 118.6, churn: 0.7, conv: 6.2, funnel: 0.28 },
  { id: 'mid',        label: 'Mid-market',   short: 'Mid-market', share: 0.30, accounts: 392,  nrr: 111.2, churn: 1.6, conv: 5.1, funnel: 0.38 },
  { id: 'startup',    label: 'Startup',      short: 'Startup',    share: 0.18, accounts: 782,  nrr: 106.8, churn: 3.4, conv: 4.2, funnel: 0.34 },
];

const MONTHS_GEN = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const MONTHS_SHORT = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
const MONTHS_NOM = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const WEEKDAYS = ['вс','пн','вт','ср','чт','пт','сб'];

const nfInt = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nf2 = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function fmtInt(v) { return nfInt.format(Math.round(v)); }

export function fmtMoney(v, opts = {}) {
  const sign = v < 0 ? '−' : '';
  const a = Math.abs(v);
  if (opts.full || a < 10_000) return sign + nfInt.format(a) + ' ₽';
  if (a < 1_000_000) return sign + nf1.format(a / 1000) + ' тыс. ₽';
  if (a < 1_000_000_000) return sign + nf1.format(a / 1_000_000) + ' млн ₽';
  return sign + nf2.format(a / 1_000_000_000) + ' млрд ₽';
}

export function fmtMoneyShort(v) {
  const a = Math.abs(v);
  const sign = v < 0 ? '−' : '';
  if (a >= 1_000_000_000) return sign + nf2.format(a / 1_000_000_000) + ' млрд';
  if (a >= 1_000_000) return sign + nf1.format(a / 1_000_000) + ' млн';
  if (a >= 1_000) return sign + nfInt.format(a / 1000) + ' тыс.';
  return sign + nfInt.format(a);
}

export function fmtPct(v, digits = 1) {
  const f = digits === 0 ? nfInt : digits === 2 ? nf2 : nf1;
  return f.format(v) + '%';
}

export function fmtSigned(v, digits = 1) {
  const f = digits === 0 ? nfInt : digits === 2 ? nf2 : nf1;
  return (v > 0 ? '+' : v < 0 ? '−' : '') + f.format(Math.abs(v));
}

export function fmtDelta(v, digits = 1) {
  return fmtSigned(v, digits) + '%';
}

export function shortDate(d) {
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}
export function longDate(d) {
  return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]} ${d.getFullYear()}`;
}
export function monthYear(d) {
  return `${MONTHS_NOM[d.getMonth()]} ${d.getFullYear()}`;
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d, n) { return new Date(d.getTime() + n * DAY); }

/* deterministic RNG */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TODAY = startOfDay(new Date());
const START = addDays(TODAY, -(HISTORY - 1));

const SEG_GEN = [
  { id: 'enterprise', weight: 0.52, noise: 0.026, trend: 1.05, seed: 1207, acctStart: 126, acctEnd: 152 },
  { id: 'mid',        weight: 0.30, noise: 0.038, trend: 1.02, seed: 4411, acctStart: 350, acctEnd: 392 },
  { id: 'startup',    weight: 0.18, noise: 0.055, trend: 0.98, seed: 9021, acctStart: 690, acctEnd: 782 },
];

/* ---------- daily series ---------- */
const days = [];
const rngs = Object.fromEntries(SEG_GEN.map(s => [s.id, mulberry32(s.seed)]));
const acctRngs = Object.fromEntries(SEG_GEN.map(s => [s.id, mulberry32(s.seed + 77)]));
const metaRng = mulberry32(20261029);

for (let i = 0; i < HISTORY; i++) {
  const date = addDays(START, i);
  const wd = date.getDay();
  const seasonal = [0.70, 1.04, 1.07, 1.05, 1.02, 0.96, 0.72][wd];
  const monthEnd = date.getDate() >= 27 ? 1.10 : date.getDate() <= 2 ? 1.04 : 1;
  const t = i / (HISTORY - 1);

  const row = { t: i, date, revenue: 0, users: 0, trials: 0, accounts: 0, conversion: 0, churn: 0, nrr: 0, bySegment: {} };

  for (const s of SEG_GEN) {
    const r = rngs[s.id]();
    const trend = (0.82 + 0.42 * t) * (1 + 0.012 * Math.sin(i / 31 + s.seed));
    const value = 1_180_000 * s.weight * trend * seasonal * monthEnd * (1 + s.noise * (r * 2 - 1));
    row.bySegment[s.id] = value;
    row.revenue += value;

    const ar = acctRngs[s.id]();
    const acct = s.acctStart + (s.acctEnd - s.acctStart) * t + (ar * 2 - 1) * 0.9;
    row.accounts += acct;
  }

  row.users = Math.round(row.revenue / 1950 + 900 * Math.sin(i / 11) + metaRng() * 340);
  row.trials = Math.round(row.revenue / 42_000 + metaRng() * 40);
  row.conversion = 4.5 + 0.35 * Math.sin(i / 19) + (metaRng() - 0.5) * 0.5;
  row.churn = 1.85 + 0.18 * Math.cos(i / 23) + (metaRng() - 0.5) * 0.18;
  row.nrr = 111.4 + 1.1 * Math.sin(i / 47) + (metaRng() - 0.5) * 1.2;
  days.push(row);
}

/* ---------- accounts ---------- */
const ACCOUNT_SEED = [
  ['Квант', 'enterprise', 'СНГ', 1_240_000, 18.4, 94, 'А. Волкова', 2019, 'Enterprise', 420],
  ['Northwind', 'enterprise', 'Европа', 980_000, 12.1, 91, 'М. Лебедев', 2018, 'Enterprise', 360],
  ['Атлас Групп', 'enterprise', 'СНГ', 862_000, 6.8, 87, 'И. Соколова', 2020, 'Enterprise', 280],
  ['Lumen Labs', 'mid', 'Северная Америка', 624_000, 22.6, 96, 'Д. Орлов', 2021, 'Scale', 190],
  ['Полярная', 'enterprise', 'СНГ', 590_000, 3.2, 78, 'Н. Гусева', 2019, 'Enterprise', 240],
  ['Sable & Co', 'mid', 'Европа', 482_000, 9.4, 88, 'П. Ким', 2020, 'Scale', 160],
  ['Октава', 'mid', 'СНГ', 455_000, -2.1, 71, 'Е. Морозов', 2021, 'Scale', 150],
  ['Meridian Health', 'enterprise', 'Северная Америка', 440_000, 15.8, 90, 'А. Волкова', 2022, 'Enterprise', 210],
  ['Тайга', 'mid', 'СНГ', 392_000, 7.3, 84, 'С. Рахимов', 2020, 'Growth', 130],
  ['Hoshi', 'mid', 'Азия', 361_000, 11.2, 86, 'П. Ким', 2022, 'Growth', 120],
  ['Верста', 'startup', 'СНГ', 312_000, 26.4, 93, 'И. Соколова', 2023, 'Growth', 74],
  ['Cobalt', 'mid', 'Европа', 296_000, -4.6, 64, 'М. Лебедев', 2021, 'Growth', 95],
  ['Сигма', 'startup', 'СНГ', 281_000, 19.7, 89, 'Д. Орлов', 2023, 'Growth', 66],
  ['Fieldnote', 'startup', 'Северная Америка', 264_000, 8.9, 82, 'Н. Гусева', 2022, 'Growth', 58],
  ['Импульс', 'mid', 'СНГ', 251_000, 1.4, 73, 'С. Рахимов', 2021, 'Growth', 88],
  ['Kite', 'startup', 'Европа', 238_000, 14.3, 85, 'П. Ким', 2023, 'Starter', 41],
  ['Кедр', 'startup', 'СНГ', 226_000, 5.6, 80, 'Е. Морозов', 2022, 'Growth', 52],
  ['Nimbus', 'mid', 'Азия', 212_000, -1.2, 69, 'М. Лебедев', 2020, 'Growth', 78],
  ['Форма', 'startup', 'СНГ', 196_000, 31.8, 97, 'А. Волкова', 2024, 'Starter', 29],
  ['Aster', 'startup', 'Европа', 181_000, 12.8, 83, 'Н. Гусева', 2023, 'Starter', 33],
  ['Ритм', 'startup', 'СНГ', 166_000, 4.1, 76, 'С. Рахимов', 2022, 'Starter', 38],
  ['Vela', 'startup', 'Северная Америка', 151_000, 9.6, 81, 'Д. Орлов', 2023, 'Starter', 26],
  ['Кристалл', 'mid', 'СНГ', 142_000, -6.8, 58, 'И. Соколова', 2019, 'Growth', 70],
  ['Mono Studio', 'startup', 'Европа', 126_000, 17.2, 88, 'П. Ким', 2024, 'Starter', 18],
  ['Дрейф', 'startup', 'СНГ', 112_000, 2.9, 72, 'Е. Морозов', 2023, 'Starter', 21],
  ['Парус', 'startup', 'СНГ', 96_000, -3.4, 61, 'С. Рахимов', 2022, 'Starter', 24],
  ['Quill', 'startup', 'Северная Америка', 86_000, 6.7, 77, 'А. Волкова', 2024, 'Starter', 14],
  ['Сфера', 'startup', 'СНГ', 74_000, 21.5, 90, 'Н. Гусева', 2024, 'Starter', 11],
];

const ACCOUNT_COLORS = ['#5B8CFF', '#46C2A8', '#E8A33D', '#D96C8A', '#8A7BF0', '#4FB3D9', '#C07A4E', '#6FAE5B'];

function accountEvents(name, seed) {
  const r = mulberry32(seed);
  const pool = [
    ['Продлил подписку на 12 месяцев', 'договор', 2],
    ['Превысил лимит активных мест', 'продукт', 4],
    ['Открыл квартальный отчёт для совета', 'активность', 7],
    ['Встреча с CSM: план расширения', 'встреча', 11],
    ['Подключил новый источник данных', 'продукт', 15],
    ['Снизил активность на 18%', 'риск', 19],
    ['Оплатил счёт № 2041', 'биллинг', 24],
  ];
  return pool
    .map((e, i) => ({ title: e[0], kind: e[1], days: e[2] + Math.floor(r() * 3), i }))
    .sort((a, b) => a.days - b.days)
    .slice(0, 5);
}

const accounts = ACCOUNT_SEED.map((a, i) => {
  const [name, segment, region, mrr, growth, health, owner, since, plan, seats] = a;
  const r = mulberry32(4000 + i * 37);
  const spark = [];
  let base = 0.72 + r() * 0.2;
  for (let k = 0; k < 24; k++) {
    base += (growth / 100) / 24 + (r() - 0.5) * 0.035;
    spark.push(Math.max(0.2, base));
  }
  const usage = Math.round(Math.min(99, Math.max(18, health * 0.72 + (r() * 2 - 1) * 22)));
  return {
    id: 'acc-' + (i + 1),
    name, segment, region, mrr, growth, health, owner, since, plan, seats,
    usage,
    color: ACCOUNT_COLORS[i % ACCOUNT_COLORS.length],
    initials: name.split(/[\s&]+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase(),
    spark,
    email: 'hello@' + name.toLowerCase().replace(/[^a-zа-я0-9]+/gi, '') + '.io',
    events: accountEvents(name, 900 + i),
    ltv: Math.round(mrr * (18 + r() * 14)),
    sinceLabel: `с ${since}`,
  };
});

/* ---------- helpers ---------- */
function sum(arr) { return arr.reduce((a, b) => a + b, 0); }
function avg(arr) { return sum(arr) / arr.length; }

function sliceDays(daysN, segmentId) {
  const seg = segmentId === 'all' ? null : segmentId;
  const take = (start, count) => days.slice(start, start + count).map(d => ({
    ...d,
    revenue: seg ? d.bySegment[seg] : d.revenue,
  }));
  const end = days.length;
  const current = take(end - daysN, daysN);
  const previous = take(end - daysN * 2, daysN);
  return { current, previous };
}

function buildPoints(current, previous, tick, seg) {
  if (tick === 1) {
    return current.map((d, i) => ({
      i, date: d.date, label: shortDate(d.date), full: longDate(d.date),
      weekday: WEEKDAYS[d.date.getDay()],
      v: d.revenue, prev: previous[i] ? previous[i].revenue : null,
    }));
  }
  const points = [];
  for (let i = 0; i < current.length; i += tick) {
    const chunk = current.slice(i, i + tick);
    const prevChunk = previous.slice(i, i + tick);
    const last = chunk[chunk.length - 1];
    const first = chunk[0];
    points.push({
      i: points.length,
      date: last.date,
      label: shortDate(last.date),
      full: `${first.date.getDate()}–${last.date.getDate()} ${MONTHS_GEN[last.date.getMonth()]}`,
      weekday: WEEKDAYS[last.date.getDay()],
      v: sum(chunk.map(d => d.revenue)),
      prev: prevChunk.length ? sum(prevChunk.map(d => d.revenue)) : null,
    });
  }
  return points;
}

function rangeLabel(daysN, rangeId) {
  const end = TODAY;
  const start = addDays(end, -(daysN - 1));
  if (rangeId === '12m') {
    const s = addDays(end, -364);
    return `${MONTHS_NOM[s.getMonth()]} ${s.getFullYear()} — ${MONTHS_NOM[end.getMonth()].toLowerCase()} ${end.getFullYear()}`;
  }
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()}–${end.getDate()} ${MONTHS_GEN[end.getMonth()]}`;
  }
  return `${start.getDate()} ${MONTHS_GEN[start.getMonth()]} — ${end.getDate()} ${MONTHS_GEN[end.getMonth()]}`;
}

function compareLabel(rangeId) {
  return { '7d': 'к прошлой неделе', '30d': 'к прошлым 30 дням', '90d': 'к прошлому кварталу', '12m': 'к прошлому году' }[rangeId];
}

/* ---------- view model ---------- */
export function buildViewModel(state) {
  const range = RANGES.find(r => r.id === state.range) || RANGES[1];
  const segment = SEGMENTS.find(s => s.id === state.segment) || SEGMENTS[0];
  const segId = segment.id;
  const { current, previous } = sliceDays(range.days, segId);
  const points = buildPoints(current, previous, range.tick, segId);

  const revTotal = sum(current.map(d => d.revenue));
  const prevRevTotal = sum(previous.map(d => d.revenue));
  const revDelta = prevRevTotal ? (revTotal - prevRevTotal) / prevRevTotal * 100 : 0;

  const last30 = days.slice(-30).map(d => segId === 'all' ? d.revenue : d.bySegment[segId]);
  const prev30 = days.slice(-60, -30).map(d => segId === 'all' ? d.revenue : d.bySegment[segId]);
  const mrr = sum(last30);
  const mrrDelta = (mrr - sum(prev30)) / sum(prev30) * 100;

  const acctNow = days[days.length - 1].accounts * (segId === 'all' ? 1 : { enterprise: 0.115, mid: 0.296, startup: 0.589 }[segId]);
  const acctPrev = current[0].accounts * (segId === 'all' ? 1 : { enterprise: 0.115, mid: 0.296, startup: 0.589 }[segId]);
  const acctDelta = (acctNow - acctPrev) / acctPrev * 100;

  const conv = avg(current.map(d => d.conversion)) + (segment.conv - 4.8);
  const convPrev = avg(previous.map(d => d.conversion)) + (segment.conv - 4.8);
  const churn = avg(current.map(d => d.churn)) * (segment.churn / 1.9);
  const churnPrev = avg(previous.map(d => d.churn)) * (segment.churn / 1.9);
  const nrr = avg(current.map(d => d.nrr)) + (segment.nrr - 112.4);
  const nrrPrev = avg(previous.map(d => d.nrr)) + (segment.nrr - 112.4);
  const arpa = mrr / Math.max(1, acctNow);
  const ltv = arpa / (churn / 100);

  const kpis = {
    revenue: {
      id: 'revenue', label: 'Выручка', value: fmtMoney(revTotal), raw: revTotal,
      delta: revDelta, deltaLabel: fmtDelta(revDelta), note: compareLabel(state.range), good: revDelta >= 0,
    },
    mrr: {
      id: 'mrr', label: 'MRR', value: fmtMoney(mrr), raw: mrr,
      delta: mrrDelta, deltaLabel: fmtDelta(mrrDelta), note: 'к прошлому месяцу', good: mrrDelta >= 0,
    },
    accounts: {
      id: 'accounts', label: 'Активные аккаунты', value: fmtInt(acctNow), raw: acctNow,
      delta: acctDelta, deltaLabel: fmtDelta(acctDelta), note: compareLabel(state.range), good: acctDelta >= 0,
    },
    nrr: {
      id: 'nrr', label: 'NRR', value: fmtPct(nrr), raw: nrr,
      delta: nrr - nrrPrev, deltaLabel: fmtSigned(nrr - nrrPrev) + ' п.п.', note: 'к прошлому периоду', good: nrr >= nrrPrev,
    },
    conversion: {
      id: 'conversion', label: 'Триал → оплата', value: fmtPct(conv), raw: conv,
      delta: conv - convPrev, deltaLabel: fmtSigned(conv - convPrev) + ' п.п.', note: compareLabel(state.range), good: conv >= convPrev,
    },
    churn: {
      id: 'churn', label: 'Отток', value: fmtPct(churn), raw: churn,
      delta: churn - churnPrev, deltaLabel: fmtSigned(churn - churnPrev) + ' п.п.', note: compareLabel(state.range), good: churn <= churnPrev,
    },
    arpa: {
      id: 'arpa', label: 'ARPA', value: fmtMoney(arpa), raw: arpa,
      delta: acctDelta ? -acctDelta * 0.6 : 0, deltaLabel: fmtDelta(-acctDelta * 0.6), note: 'к прошлому периоду', good: true,
    },
  };
  const kpiList = [kpis.revenue, kpis.mrr, kpis.accounts, kpis.nrr, kpis.conversion, kpis.churn, kpis.arpa];

  const chartMax = Math.max(...points.map(p => Math.max(p.v, p.prev || 0)));
  const chartMin = Math.min(...points.map(p => Math.min(p.v, p.prev || p.v)));
  const peak = points.reduce((a, b) => (b.v > a.v ? b : a), points[0]);

  const channelDefs = [
    { id: 'organic', name: 'Органика', share: 31.8, delta: 2.4 },
    { id: 'partners', name: 'Партнёры', share: 23.6, delta: 1.1 },
    { id: 'outbound', name: 'Outbound', share: 17.9, delta: -0.8 },
    { id: 'paid', name: 'Платный поиск', share: 15.2, delta: 3.6 },
    { id: 'referral', name: 'Рефералы', share: 11.5, delta: -0.4 },
  ];
  const channels = channelDefs.map(c => ({
    ...c,
    value: revTotal * c.share / 100,
    prevShare: c.share - c.delta,
  }));

  const regionDefs = [
    { name: 'СНГ', share: 43.6, delta: 1.8 },
    { name: 'Европа', share: 26.8, delta: 2.6 },
    { name: 'Северная Америка', share: 18.4, delta: -0.9 },
    { name: 'Азия', share: 11.2, delta: 4.2 },
  ];
  const regions = regionDefs.map(r => ({ ...r, value: revTotal * r.share / 100 }));

  const fScale = (range.days / 30) * segment.funnel;
  const funnel = [
    { id: 'visits', label: 'Визиты', value: Math.round(184_200 * fScale), rate: 100 },
    { id: 'trials', label: 'Триалы', value: Math.round(26_700 * fScale), rate: 14.5 },
    { id: 'activation', label: 'Активация', value: Math.round(12_450 * fScale), rate: 6.8 },
    { id: 'paid', label: 'Оплата', value: Math.round(1_284 * fScale), rate: 4.8 },
    { id: 'expansion', label: 'Расширение', value: Math.round(412 * fScale), rate: 1.5 },
  ];

  const cohortBase = [
    [100, 71, 60, 54, 49, 46],
    [100, 73, 62, 55, 50, 47],
    [100, 74, 63, 57, 52, null],
    [100, 76, 65, 58, null, null],
    [100, 77, 66, null, null, null],
    [100, 79, null, null, null, null],
  ];
  const cohortMonths = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(TODAY.getFullYear(), TODAY.getMonth() - i, 1);
    cohortMonths.push(MONTHS_NOM[d.getMonth()].slice(0, 3));
  }
  const cohorts = { months: cohortMonths, values: cohortBase };

  const health = { healthy: 0, watch: 0, risk: 0 };
  accounts.forEach(a => {
    if (a.health >= 80) health.healthy++;
    else if (a.health >= 65) health.watch++;
    else health.risk++;
  });

  let list = accounts.filter(a => segId === 'all' || a.segment === segId);
  const q = (state.search || '').trim().toLowerCase();
  if (q) list = list.filter(a => (a.name + ' ' + a.owner + ' ' + a.region + ' ' + a.plan).toLowerCase().includes(q));
  const sortKey = state.sort?.key || 'mrr';
  const dir = state.sort?.dir === 'asc' ? 1 : -1;
  list = [...list].sort((a, b) => {
    if (sortKey === 'name') return a.name.localeCompare(b.name, 'ru') * dir;
    return ((a[sortKey] ?? 0) - (b[sortKey] ?? 0)) * dir;
  });

  const topMovers = [...accounts].sort((a, b) => b.growth - a.growth).slice(0, 4);
  const riskAccounts = [...accounts].sort((a, b) => a.health - b.health).slice(0, 3);

  const hours = Array.from({ length: 24 }, (_, i) => {
    const wave = Math.exp(-Math.pow(i - 11, 2) / 26) + 0.75 * Math.exp(-Math.pow(i - 16, 2) / 18) + 0.12;
    return Math.round(120 + wave * 620 + (metaRng() - 0.5) * 40);
  });

  const spark = points.slice(-24).map(p => p.v);
  const accountSpark = points.slice(-20).map(p => p.v);

  return {
    range, segment, segId,
    rangeLabel: rangeLabel(range.days, range.id),
    compareLabel: compareLabel(range.id),
    today: TODAY,
    updated: new Date(),
    kpis, kpiList,
    revenue: {
      total: revTotal, prevTotal: prevRevTotal, delta: revDelta,
      points, max: chartMax, min: chartMin, avg: revTotal / points.length,
      peak, spark, accountSpark,
    },
    mrr,
    accounts: list,
    allAccounts: accounts,
    accountCount: list.length,
    channels, regions, funnel, cohorts, health,
    topMovers, riskAccounts,
    goals: {
      revenue: Math.min(0.96, 0.72 + (range.days / 365) * 0.2),
      accounts: 0.64,
      nrr: 0.92,
    },
    liveUsers: 1240 + Math.round(metaRng() * 260),
    hours,
    activity: {
      sessions: Math.round(revTotal / 920),
      trialStarts: Math.round(revTotal / 24_000),
    },
    getAccount(id) { return accounts.find(a => a.id === id) || null; },
  };
}

export function toCSV(rows) {
  const head = ['Аккаунт', 'Сегмент', 'Регион', 'MRR', 'Рост %', 'Здоровье', 'Владелец', 'План'];
  const body = rows.map(a => [a.name, a.segment, a.region, a.mrr, a.growth, a.health, a.owner, a.plan]);
  return [head, ...body].map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
}
