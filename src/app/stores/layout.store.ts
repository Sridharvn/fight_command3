import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';

export interface LayoutState {
  isSidebarCollapsed: boolean;
}

const STORAGE_KEY = 'ma_sidebar_collapsed';

function getInitialState(): LayoutState {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return { isSidebarCollapsed: false };
  }
  return {
    isSidebarCollapsed: localStorage.getItem(STORAGE_KEY) === 'true',
  };
}

export const LayoutStore = signalStore(
  { providedIn: 'root' },
  withState<LayoutState>(() => getInitialState()),
  withMethods((store) => ({
    toggleSidebar(): void {
      const nextVal = !store.isSidebarCollapsed();
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, String(nextVal));
      }
      patchState(store, { isSidebarCollapsed: nextVal });
    },
    setSidebarCollapsed(collapsed: boolean): void {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, String(collapsed));
      }
      patchState(store, { isSidebarCollapsed: collapsed });
    },
  })),
);
