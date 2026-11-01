/* ============================================================
   MERIDIAN · theme registry
   Каждая тема — ленивый чанк: свой JS + свой CSS (code-splitting).
   Метаданные загружаются нетерпеливо (малы), постеры — лениво.
   ============================================================ */
import type { ComponentType } from 'react';
import type { ViewModel, AppState } from './data';

export interface ThemeMeta {
  id: string; num: string; name: string; en: string; tagline: string;
  palette: string[]; bg: string; accent: string; poster?: string;
}

export interface ActionsLike {
  setRange(id: string): void;
  setSegment(id: string): void;
  setSort(key: string): void;
  toggleCompare(): void;
  openAccount(id: string): void;
  exportCSV(): void;
  openStudio(): void;
  openPalette(): void;
  rerender(opts?: { keepScroll?: boolean; focusSearch?: boolean }): void;
}

export interface ThemeProps {
  vm: ViewModel;
  state: AppState;
  actions: ActionsLike;
}

export const THEME_LOADERS: Record<string, () => Promise<{ default: ComponentType<ThemeProps> }>> = {
  azure:      () => import('../themes/azure'),
  noel:       () => import('../themes/noel'),
  swiss:      () => import('../themes/swiss'),
  terminal:   () => import('../themes/terminal'),
  prism:      () => import('../themes/prism'),
  herbarium:  () => import('../themes/herbarium'),
  brutal:     () => import('../themes/brutal'),
  blueprint:  () => import('../themes/blueprint'),
  broadsheet: () => import('../themes/broadsheet'),
  orbital:    () => import('../themes/orbital'),
};

const POSTER_LOADERS: Record<string, () => Promise<{ poster: string }>> = {
  azure:      () => import('../themes/posters/azure'),
  noel:       () => import('../themes/posters/noel'),
  swiss:      () => import('../themes/posters/swiss'),
  terminal:   () => import('../themes/posters/terminal'),
  prism:      () => import('../themes/posters/prism'),
  herbarium:  () => import('../themes/posters/herbarium'),
  brutal:     () => import('../themes/posters/brutal'),
  blueprint:  () => import('../themes/posters/blueprint'),
  broadsheet: () => import('../themes/posters/broadsheet'),
  orbital:    () => import('../themes/posters/orbital'),
};

import { themeMeta, THEME_IDS } from '../themes/meta';
export { themeMeta, THEME_IDS };

/** Постеры — только для студии; подгружаем лениво при открытии. */
export async function loadPosters(): Promise<Record<string, string>> {
  const entries = await Promise.all(
    THEME_IDS.map(async id => [id, (await POSTER_LOADERS[id]()).poster] as const)
  );
  const map: Record<string, string> = {};
  for (const [id, poster] of entries) map[id] = poster;
  return map;
}
