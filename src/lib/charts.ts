/* ============================================================
   MERIDIAN · chart + interaction helpers
   ============================================================ */

import type { ChartPoint } from './data';

export function clamp(v: number, a: number, b: number) { return Math.max(a, Math.min(b, v)); }

export function niceMax(v: number) {
  if (v <= 0) return 1;
  const exp = Math.floor(Math.log10(v));
  const f = v / Math.pow(10, exp);
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nice * Math.pow(10, exp);
}

export function ticks(max: number, count = 4, min = 0) {
  const step = (max - min) / count;
  return Array.from({ length: count + 1 }, (_, i) => min + step * i);
}

/* Catmull-Rom → cubic bezier */
export function linePath(pts: { v: number }[], x: (i: number) => number, y: (v: number) => number, tension = 0.16) {
  if (!pts.length) return '';
  if (pts.length === 1) return `M${x(0)},${y(pts[0].v)}`;
  let d = `M${x(0)},${y(pts[0].v)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = x(i) + (x(i + 1) - x(i - 1)) * tension;
    const c1y = y(p1.v) + (y(p2.v) - y(p0.v)) * tension;
    const c2x = x(i + 1) - (x(i + 2) - x(i)) * tension;
    const c2y = y(p2.v) - (y(p3.v) - y(p1.v)) * tension;
    d += ` C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${x(i + 1).toFixed(2)},${y(p2.v).toFixed(2)}`;
  }
  return d;
}

export function areaPath(pts: { v: number }[], x: (i: number) => number, y: (v: number) => number, baseline: number, tension = 0.16) {
  if (!pts.length) return '';
  return `${linePath(pts, x, y, tension)} L${x(pts.length - 1)},${baseline} L${x(0)},${baseline} Z`;
}

export function sparkPath(values: number[], w: number, h: number, pad = 2, tension = 0.18) {
  if (!values.length) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v) => ({ v }));
  const x = (i: number) => pad + (i / Math.max(1, values.length - 1)) * (w - pad * 2);
  const y = (v: number) => h - pad - ((v - min) / span) * (h - pad * 2);
  return linePath(pts, x, y, tension);
}

export function polar(cx: number, cy: number, r: number, deg: number) {
  const a = (deg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

export function arcPath(cx: number, cy: number, rOuter: number, rInner: number, start: number, end: number) {
  const large = end - start > 180 ? 1 : 0;
  const p1 = polar(cx, cy, rOuter, start);
  const p2 = polar(cx, cy, rOuter, end);
  const p3 = polar(cx, cy, rInner, end);
  const p4 = polar(cx, cy, rInner, start);
  return `M${p1.x.toFixed(2)},${p1.y.toFixed(2)} A${rOuter},${rOuter} 0 ${large} 1 ${p2.x.toFixed(2)},${p2.y.toFixed(2)} L${p3.x.toFixed(2)},${p3.y.toFixed(2)} A${rInner},${rInner} 0 ${large} 0 ${p4.x.toFixed(2)},${p4.y.toFixed(2)} Z`;
}

export function donutArcs(values: number[], cx: number, cy: number, r: number, thickness: number, gap = 2.5, startAngle = 0) {
  const total = values.reduce((a, b) => a + b, 0) || 1;
  let angle = startAngle;
  return values.map(v => {
    const sweep = (v / total) * 360;
    const a0 = angle + gap / 2;
    const a1 = angle + sweep - gap / 2;
    angle += sweep;
    return {
      d: arcPath(cx, cy, r, r - thickness, a0, Math.max(a0 + 0.4, a1)),
      share: v / total,
      mid: (a0 + a1) / 2,
    };
  });
}

export function roundedBar(x: number, y: number, w: number, h: number, r = 3) {
  const rr = Math.min(r, w / 2, h);
  if (h <= 0.5) return '';
  return `M${x},${y + h} L${x},${y + rr} Q${x},${y} ${x + rr},${y} L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h} Z`;
}

export function roundRect(x: number, y: number, w: number, h: number, r: number) {
  return `M${x + r},${y} h${w - 2 * r} a${r},${r} 0 0 1 ${r},${r} v${h - 2 * r} a${r},${r} 0 0 1 ${-r},${r} h${-(w - 2 * r)} a${r},${r} 0 0 1 ${-r},${-r} v${-(h - 2 * r)} a${r},${r} 0 0 1 ${r},${-r} Z`;
}

/* ---------------- tooltip ---------------- */
let tipEl: HTMLElement | null = null;
function tip() {
  if (!tipEl) tipEl = document.getElementById('tooltip');
  return tipEl;
}

export function showTip(html: string, clientX: number, clientY: number) {
  const el = tip();
  if (!el) return;
  el.innerHTML = html;
  el.classList.add('is-visible');
  const pad = 14;
  const rect = el.getBoundingClientRect();
  let x = clientX + 16;
  let y = clientY - rect.height - 14;
  if (x + rect.width + pad > window.innerWidth) x = clientX - rect.width - 16;
  if (y < pad) y = clientY + 18;
  if (y + rect.height + pad > window.innerHeight) y = window.innerHeight - rect.height - pad;
  el.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
}

export function hideTip() {
  const el = tip();
  if (el) el.classList.remove('is-visible');
}

export interface LineGeom { x0: number; x1: number; y0: number; y1: number; w: number; h: number; yMax?: number; yMin?: number }

export function attachLineHover(el: HTMLElement | null, points: ChartPoint[], geom: LineGeom, render: (p: ChartPoint, i: number) => string) {
  if (!el) return () => {};
  const svg = el.querySelector('svg');
  void svg;
  const cursor = el.querySelector('.hover-cursor') as SVGElement | null;
  const dot = el.querySelector('.hover-dot') as SVGElement | null;
  const prevDot = el.querySelector('.hover-dot-prev') as SVGElement | null;
  const { x0, x1, y0, y1, w } = geom;
  const step = (x1 - x0) / Math.max(1, points.length - 1);
  const yMax = geom.yMax || 1;
  const yMin = geom.yMin || 0;

  const move = (e: PointerEvent) => {
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width * w;
    const i = clamp(Math.round((px - x0) / step), 0, points.length - 1);
    const p = points[i];
    const x = x0 + i * step;
    const y = y1 - (p.v - yMin) / (yMax - yMin) * (y1 - y0);
    if (cursor) {
      cursor.setAttribute('x1', String(x)); cursor.setAttribute('x2', String(x));
      cursor.style.opacity = '1';
    }
    if (dot) {
      dot.setAttribute('cx', String(x)); dot.setAttribute('cy', String(y));
      dot.style.opacity = '1';
    }
    if (prevDot && p.prev != null) {
      const py = y1 - (p.prev - yMin) / (yMax - yMin) * (y1 - y0);
      prevDot.setAttribute('cx', String(x)); prevDot.setAttribute('cy', String(py));
      prevDot.style.opacity = '1';
    }
    showTip(render(p, i), e.clientX, e.clientY);
  };
  const leave = () => {
    if (cursor) cursor.style.opacity = '0';
    if (dot) dot.style.opacity = '0';
    if (prevDot) prevDot.style.opacity = '0';
    hideTip();
  };
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerleave', leave);
  return () => {
    el.removeEventListener('pointermove', move);
    el.removeEventListener('pointerleave', leave);
    leave();
  };
}

export function attachBarHover(root: ParentNode, selector: string, render: (i: string, el: HTMLElement) => string) {
  const els = Array.from(root.querySelectorAll(selector)) as HTMLElement[];
  const offs: (() => void)[] = [];
  for (const el of els) {
    const move = (e: PointerEvent) => showTip(render(el.dataset.i as string, el), e.clientX, e.clientY);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', hideTip);
    offs.push(() => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', hideTip); hideTip(); });
  }
  return () => offs.forEach(f => f());
}

export function attachTilt(root: ParentNode, selector: string, strength = 6) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};
  const els = Array.from(root.querySelectorAll(selector)) as HTMLElement[];
  const offs: (() => void)[] = [];
  for (const el of els) {
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty('--rx', (-py * strength).toFixed(2) + 'deg');
      el.style.setProperty('--ry', (px * strength).toFixed(2) + 'deg');
    };
    const leave = () => {
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    offs.push(() => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); });
  }
  return () => offs.forEach(f => f());
}
