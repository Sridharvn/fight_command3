import { computed } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';

export interface HistoryEntry {
  id: string;
  action: string;
  timestamp: string;
  valueBefore: number;
  valueAfter: number;
}

export interface CounterState {
  count: number;
  step: number;
  history: HistoryEntry[];
  past: number[];
  future: number[];
}

const initialState: CounterState = {
  count: 0,
  step: 1,
  history: [],
  past: [],
  future: []
};

function createHistoryEntry(action: string, before: number, after: number): HistoryEntry {
  // Use a predictable date simulation or simple time formatting
  const time = new Date().toLocaleTimeString();
  return {
    id: Math.random().toString(36).substring(2, 9),
    action,
    timestamp: time,
    valueBefore: before,
    valueAfter: after
  };
}

export const CounterStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ count, past, future }) => ({
    oddOrEven: computed(() => (count() % 2 === 0 ? 'even' : 'odd')),
    canUndo: computed(() => past().length > 0),
    canRedo: computed(() => future().length > 0)
  })),
  withMethods((store) => ({
    increment(): void {
      const current = store.count();
      const currentStep = store.step();
      const nextVal = current + currentStep;

      patchState(store, (state) => ({
        count: nextVal,
        past: [...state.past, current],
        future: [],
        history: [
          createHistoryEntry(`Increment (+${currentStep})`, current, nextVal),
          ...state.history
        ].slice(0, 50)
      }));
    },

    decrement(): void {
      const current = store.count();
      const currentStep = store.step();
      const nextVal = current - currentStep;

      patchState(store, (state) => ({
        count: nextVal,
        past: [...state.past, current],
        future: [],
        history: [
          createHistoryEntry(`Decrement (-${currentStep})`, current, nextVal),
          ...state.history
        ].slice(0, 50)
      }));
    },

    reset(): void {
      const current = store.count();
      if (current === 0) return;

      patchState(store, (state) => ({
        count: 0,
        past: [...state.past, current],
        future: [],
        history: [
          createHistoryEntry('Reset', current, 0),
          ...state.history
        ].slice(0, 50)
      }));
    },

    updateStep(newStep: number): void {
      if (newStep <= 0 || isNaN(newStep)) return;

      patchState(store, { step: newStep });
    },

    undo(): void {
      const pastList = store.past();
      if (pastList.length === 0) return;

      const previous = pastList[pastList.length - 1];
      const newPast = pastList.slice(0, -1);
      const current = store.count();

      patchState(store, (state) => ({
        count: previous,
        past: newPast,
        future: [...state.future, current],
        history: [
          createHistoryEntry('Undo', current, previous),
          ...state.history
        ].slice(0, 50)
      }));
    },

    redo(): void {
      const futureList = store.future();
      if (futureList.length === 0) return;

      const next = futureList[futureList.length - 1];
      const newFuture = futureList.slice(0, -1);
      const current = store.count();

      patchState(store, (state) => ({
        count: next,
        past: [...state.past, current],
        future: newFuture,
        history: [
          createHistoryEntry('Redo', current, next),
          ...state.history
        ].slice(0, 50)
      }));
    },

    clearHistory(): void {
      patchState(store, {
        history: [],
        past: [],
        future: []
      });
    }
  }))
);
