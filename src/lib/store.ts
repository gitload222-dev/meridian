/* ============================================================
   MERIDIAN · app store (useSyncExternalStore)
   ============================================================ */
import { useSyncExternalStore } from 'react';
import { THEME_IDS } from '../themes/meta';
import type { AppState } from './data';

const KEY = 'meridian.ui.v1';

const RANGE_IDS = ['7d', '30d', '90d', '12m'];
const SEGMENT_IDS = ['all', 'enterprise', 'mid', 'startup'];

function loadState(): AppState {
  let saved: Partial<AppState> = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { /* noop */ }
  const hash = location.hash.replace('#', '');
  return {
    theme: THEME_IDS.includes(hash) ? hash
      : (saved.theme && THEME_IDS.includes(saved.theme) ? saved.theme : 'azure'),
    range: saved.range && RANGE_IDS.includes(saved.range) ? saved.range : '30d',
    segment: saved.segment && SEGMENT_IDS.includes(saved.segment) ? saved.segment : 'all',
    search: '',
    sort: saved.sort || { key: 'mrr', dir: 'desc' },
    compare: saved.compare !== false,
  };
}

let state: AppState = loadState();
const listeners = new Set<() => void>();

function subscribe(l: () => void) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

function getSnapshot() { return state; }

export function getState(): AppState { return state; }

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      theme: state.theme, range: state.range, segment: state.segment,
      sort: state.sort, compare: state.compare,
    }));
  } catch { /* noop */ }
}

export function setState(patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)) {
  const p = typeof patch === 'function' ? patch(state) : patch;
  state = { ...state, ...p };
  save();
  listeners.forEach(l => l());
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getSnapshot);
}
