/* ============================================================
   MERIDIAN · App shell
   ============================================================ */
import { Suspense, lazy, memo, useEffect, useMemo, useRef } from 'react';
import type { ComponentType } from 'react';
import { buildViewModel } from './lib/data';
import type { ViewModel } from './lib/data';
import { THEME_IDS, THEME_LOADERS, themeMeta } from './lib/themes';
import type { ThemeProps, ActionsLike } from './lib/themes';
import { useAppState } from './lib/store';
import {
  initGlobalEvents, setCurrentVm, consumeFocusSearch, openStudio,
  setRange, setSegment, setSort, toggleCompare, openAccount, exportCSV,
  openPalette, rerender,
} from './lib/shell';
import './styles/base.css';
import './styles/studio.css';

// memo: тема перерисовывается только при смене vm/state, а не на каждый
// рендер шелла (иначе innerHTML темы пересобирался бы зря).
const THEME_COMPONENTS = {} as Record<string, ComponentType<ThemeProps>>;
for (const id of THEME_IDS) {
  THEME_COMPONENTS[id] = memo(lazy(THEME_LOADERS[id])) as ComponentType<ThemeProps>;
}

const ACTIONS: ActionsLike = {
  setRange, setSegment, setSort, toggleCompare, openAccount, exportCSV,
  openStudio, openPalette, rerender,
};

/** Стабильная на всю жизнь компонента функция-колбэк. */
function useCallbackRef(fn: () => void) {
  const ref = useRef(fn);
  ref.current = fn;
  const stable = useMemo(() => () => ref.current(), []);
  return stable;
}

/** Boot-экран снимаем только после первого кадра темы, иначе виден пробел. */
function hideBoot() {
  const boot = document.getElementById('boot');
  if (!boot || boot.classList.contains('is-done')) return;
  boot.classList.add('is-done');
  setTimeout(() => boot.remove(), 700);
}

export default function App() {
  const state = useAppState();
  const vm = useMemo<ViewModel>(() => buildViewModel(state), [state]);
  const Theme = THEME_COMPONENTS[state.theme];
  const prevTheme = useRef(state.theme);
  const prevSearch = useRef(state.search);
  const booted = useRef(false);

  // imperative-модули (студия/палитра/CSV) читают актуальную модель отсюда
  setCurrentVm(vm);

  useEffect(() => {
    initGlobalEvents();
    const bootStudio = location.hash === '#studio';
    try { history.replaceState(null, '', '#' + state.theme); } catch { /* noop */ }
    if (bootStudio) setTimeout(() => openStudio(), 60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', themeMeta(state.theme)?.bg || '#0b0d12');
    document.documentElement.dataset.theme = state.theme;

    if (prevTheme.current !== state.theme) {
      prevTheme.current = state.theme;
      window.scrollTo(0, 0);
    }
  }, [state.theme]);

  useEffect(() => {
    if (prevSearch.current === state.search) return;
    prevSearch.current = state.search;
    if (!consumeFocusSearch()) return;
    const input = document.querySelector('[data-search]') as HTMLInputElement | null;
    if (!input) return;
    input.focus();
    const len = input.value.length;
    try { input.setSelectionRange(len, len); } catch { /* noop */ }
  }, [state.search, vm]);

  // стабильная ссылка: смена идентичности onReady вызвала бы лишний
  // ре-рендер темы (и перезапуск счётчиков).
  const handleReady = useCallbackRef(() => {
    if (booted.current) return;
    booted.current = true;
    requestAnimationFrame(hideBoot);
  });

  // Страховка: если чанк темы не ответил, boot не должен висеть вечно.
  useEffect(() => {
    const id = setTimeout(hideBoot, 6000);
    return () => clearTimeout(id);
  }, []);

  return (
    <Suspense fallback={null}>
      {Theme ? <Theme vm={vm} state={state} actions={ACTIONS} onReady={handleReady} /> : null}
    </Suspense>
  );
}
