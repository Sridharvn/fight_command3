import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, of } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { RuleService } from '../services/rule.service';
import {
  GlobalCompoundRule,
  CreateGlobalCompoundRuleDto,
  UpdateGlobalCompoundRuleDto,
} from '../models/rule-engine.models';

export interface RuleState {
  rules: GlobalCompoundRule[];
  selectedRule: GlobalCompoundRule | null;
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
  searchQuery: string;
}

const initialState: RuleState = {
  rules: [],
  selectedRule: null,
  status: 'idle',
  error: null,
  searchQuery: '',
};

export const RuleStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ rules, searchQuery }) => ({
    activeRules: computed(() => rules().filter((r) => r.isActive && !r.isDeleted)),
    totalRules: computed(() => rules().length),
    filteredRules: computed(() => {
      const q = searchQuery().toLowerCase().trim();
      if (!q) return rules();
      return rules().filter(
        (r) =>
          r.ruleName.toLowerCase().includes(q) ||
          (r.description && r.description.toLowerCase().includes(q)) ||
          r.errorMessage.toLowerCase().includes(q),
      );
    }),
  })),
  withMethods((store, ruleService = inject(RuleService)) => ({
    setSearchQuery(searchQuery: string): void {
      patchState(store, { searchQuery });
    },
    selectRule(selectedRule: GlobalCompoundRule | null): void {
      patchState(store, { selectedRule });
    },
    loadRules: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { status: 'loading', error: null })),
        switchMap(() =>
          ruleService.getRules().pipe(
            tap((rules) => {
              patchState(store, { rules, status: 'success' });
            }),
            catchError((err) => {
              const error = err?.error?.message || 'Failed to load compound rules';
              patchState(store, { status: 'error', error });
              return of([]);
            }),
          ),
        ),
      ),
    ),
    createRule: rxMethod<CreateGlobalCompoundRuleDto>(
      pipe(
        tap(() => patchState(store, { status: 'loading', error: null })),
        switchMap((dto) =>
          ruleService.createRule(dto).pipe(
            tap((createdRule) => {
              patchState(store, (state) => ({
                rules: [createdRule, ...state.rules],
                status: 'success' as const,
              }));
            }),
            catchError((err) => {
              const error = err?.error?.message || 'Failed to create compound rule';
              patchState(store, { status: 'error', error });
              return of(null);
            }),
          ),
        ),
      ),
    ),
    updateRule: rxMethod<{ id: number; dto: UpdateGlobalCompoundRuleDto }>(
      pipe(
        tap(() => patchState(store, { status: 'loading', error: null })),
        switchMap(({ id, dto }) =>
          ruleService.updateRule(id, dto).pipe(
            tap((updated) => {
              patchState(store, (state) => ({
                rules: state.rules.map((r) => (r.ruleId === id ? updated : r)),
                status: 'success' as const,
              }));
            }),
            catchError((err) => {
              const error = err?.error?.message || 'Failed to update compound rule';
              patchState(store, { status: 'error', error });
              return of(null);
            }),
          ),
        ),
      ),
    ),
    deleteRule: rxMethod<number>(
      pipe(
        tap(() => patchState(store, { status: 'loading', error: null })),
        switchMap((id) =>
          ruleService.deleteRule(id).pipe(
            tap(() => {
              patchState(store, (state) => ({
                rules: state.rules.filter((r) => r.ruleId !== id),
                status: 'success' as const,
              }));
            }),
            catchError((err) => {
              const error = err?.error?.message || 'Failed to delete compound rule';
              patchState(store, { status: 'error', error });
              return of(null);
            }),
          ),
        ),
      ),
    ),
  })),
);
