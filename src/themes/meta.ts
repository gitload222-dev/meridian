/* ============================================================
   MERIDIAN · theme metadata (eager — light, no posters)
   ============================================================ */
import type { ThemeMeta } from '../lib/themes';

const THEMES: ThemeMeta[] = [
  { id: 'azure',      num: '01', name: 'Глубина',      en: 'Deep Azure',        tagline: 'Светящийся синий, стекло и сонар',            palette: ['#071a45', '#2f6bff', '#57e6ff', '#eef4ff'],   bg: '#050d20', accent: '#4d8dff' },
  { id: 'noel',        num: '02', name: 'Сочельник',     en: 'Noël',             tagline: 'Тёплый свет, снег и бумага',                 palette: ['#0e2a22', '#1f4a38', '#e0a35e', '#f7efe0'],   bg: '#0c241d', accent: '#e0a35e' },
  { id: 'swiss',       num: '03', name: 'Швейцарский',   en: 'Grid & Ink',       tagline: 'Бумага, линейки и один красный',             palette: ['#f4f1ea', '#111111', '#e2231a', '#8c887d'],   bg: '#f4f1ea', accent: '#e2231a' },
  { id: 'terminal',    num: '04', name: 'Терминал',     en: 'Meridian Terminal', tagline: 'Плотный консольный интерфейс',                palette: ['#050908', '#0f1a16', '#45e0c0', '#e8f5ef'],   bg: '#050908', accent: '#45e0c0' },
  { id: 'prism',       num: '05', name: 'Призма',       en: 'Prism',             tagline: 'Иридесцентное стекло и спектр',               palette: ['#08070c', '#a78bfa', '#5eead4', '#ff6ec7'],   bg: '#08070c', accent: '#a78bfa' },
  { id: 'herbarium',   num: '06', name: 'Гербарий',     en: 'Field Herbarium',   tagline: 'Полевой журнал и ботанические пластины',      palette: ['#f5efe1', '#2f3e2e', '#c2674b', '#8b9a80'],   bg: '#f5efe1', accent: '#c2674b' },
  { id: 'brutal',      num: '07', name: 'Бетон',        en: 'Concrete & Acid',   tagline: 'Жёсткая сетка и кислотный акцент',            palette: ['#d7d4cb', '#111111', '#d7ff3f', '#6f6c63'],   bg: '#d7d4cb', accent: '#c9f227' },
  { id: 'blueprint',   num: '08', name: 'Чертёж',       en: 'Blueprint',         tagline: 'Инженерный чертёж системы выручки',           palette: ['#0a2c55', '#dceaf7', '#7fd3ff', '#ffd08a'],   bg: '#0a2c55', accent: '#7fd3ff' },
  { id: 'broadsheet',  num: '09', name: 'Газета',       en: 'Broadsheet',        tagline: 'Финансовая ежедневная газета',                palette: ['#f3efe3', '#16130f', '#a32b22', '#8b8477'],   bg: '#f3efe3', accent: '#a32b22' },
  { id: 'orbital',     num: '10', name: 'Орбита',       en: 'Orbital',           tagline: 'Пульт управления выручкой',                   palette: ['#050a14', '#0d1b2e', '#7fe3ff', '#8ff0e2'],   bg: '#050a14', accent: '#7fe3ff' },
];

export const THEME_IDS = THEMES.map(t => t.id);

const byId: Record<string, ThemeMeta> = {};
for (const t of THEMES) byId[t.id] = t;

export function themeMeta(id: string): ThemeMeta | undefined {
  return byId[id];
}