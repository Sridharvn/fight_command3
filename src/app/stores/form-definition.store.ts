import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, of } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { FormDefinitionService } from '../services/form-definition.service';
import {
  FieldDefinition,
  CreateFieldDefinitionDto,
  FormTemplate,
  CreateTemplateDto,
  UpdateTemplateDto,
} from '../models/form-definition.models';

export interface FormDefinitionState {
  fieldDefinitions: FieldDefinition[];
  templates: FormTemplate[];
  presets: FormTemplate[];
  totalTemplates: number;
  activeTab: 'templates' | 'fields';
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
  searchQuery: string;
}

const initialState: FormDefinitionState = {
  fieldDefinitions: [],
  templates: [],
  presets: [],
  totalTemplates: 0,
  activeTab: 'templates',
  status: 'idle',
  error: null,
  searchQuery: '',
};

export const FormDefinitionStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ fieldDefinitions, templates, searchQuery }) => ({
    filteredFieldDefinitions: computed(() => {
      const q = searchQuery().toLowerCase().trim();
      if (!q) return fieldDefinitions();
      return fieldDefinitions().filter(
        (f) =>
          f.fieldName.toLowerCase().includes(q) ||
          f.fieldLabel.toLowerCase().includes(q) ||
          f.fieldType.toLowerCase().includes(q),
      );
    }),
    filteredTemplates: computed(() => {
      const q = searchQuery().toLowerCase().trim();
      if (!q) return templates();
      return templates().filter(
        (t) =>
          t.templateName.toLowerCase().includes(q) ||
          t.templateType.toLowerCase().includes(q),
      );
    }),
  })),
  withMethods((store, formService = inject(FormDefinitionService)) => ({
    setActiveTab(activeTab: 'templates' | 'fields'): void {
      patchState(store, { activeTab, searchQuery: '' });
    },
    setSearchQuery(searchQuery: string): void {
      patchState(store, { searchQuery });
    },
    loadAll(): void {
      (this as any).loadFieldDefinitions();
      (this as any).loadTemplates();
      (this as any).loadPresets();
    },
    loadFieldDefinitions: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { status: 'loading', error: null })),
        switchMap(() =>
          formService.getFieldDefinitions().pipe(
            tap((fieldDefinitions) => {
              patchState(store, { fieldDefinitions, status: 'success' });
            }),
            catchError((err) => {
              const error = err?.error?.message || 'Failed to load field definitions';
              patchState(store, { status: 'error', error });
              return of([]);
            }),
          ),
        ),
      ),
    ),
    loadTemplates: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { status: 'loading', error: null })),
        switchMap(() =>
          formService.getTemplates().pipe(
            tap((res) => {
              const templates = Array.isArray(res) ? res : res.data;
              const total = Array.isArray(res) ? res.length : res.total;
              patchState(store, { templates, totalTemplates: total, status: 'success' });
            }),
            catchError((err) => {
              const error = err?.error?.message || 'Failed to load form templates';
              patchState(store, { status: 'error', error });
              return of([]);
            }),
          ),
        ),
      ),
    ),
    loadPresets: rxMethod<void>(
      pipe(
        switchMap(() =>
          formService.getPresets().pipe(
            tap((presets) => {
              patchState(store, { presets });
            }),
            catchError(() => of([])),
          ),
        ),
      ),
    ),
    createFieldDefinition: rxMethod<CreateFieldDefinitionDto>(
      pipe(
        tap(() => patchState(store, { status: 'loading', error: null })),
        switchMap((dto) =>
          formService.createFieldDefinition(dto).pipe(
            tap((created) => {
              patchState(store, (state) => ({
                fieldDefinitions: [created, ...state.fieldDefinitions],
                status: 'success' as const,
              }));
            }),
            catchError((err) => {
              const error = err?.error?.message || 'Failed to create field definition';
              patchState(store, { status: 'error', error });
              return of(null);
            }),
          ),
        ),
      ),
    ),
    deleteFieldDefinition: rxMethod<number>(
      pipe(
        tap(() => patchState(store, { status: 'loading', error: null })),
        switchMap((id) =>
          formService.deleteFieldDefinition(id).pipe(
            tap(() => {
              patchState(store, (state) => ({
                fieldDefinitions: state.fieldDefinitions.filter((f) => f.fieldDefinitionId !== id),
                status: 'success' as const,
              }));
            }),
            catchError((err) => {
              const error = err?.error?.message || 'Failed to delete field definition';
              patchState(store, { status: 'error', error });
              return of(null);
            }),
          ),
        ),
      ),
    ),
    createTemplate: rxMethod<CreateTemplateDto>(
      pipe(
        tap(() => patchState(store, { status: 'loading', error: null })),
        switchMap((dto) =>
          formService.createTemplate(dto).pipe(
            tap((created) => {
              patchState(store, (state) => ({
                templates: [created, ...state.templates],
                totalTemplates: state.totalTemplates + 1,
                status: 'success' as const,
              }));
            }),
            catchError((err) => {
              const error = err?.error?.message || 'Failed to create template';
              patchState(store, { status: 'error', error });
              return of(null);
            }),
          ),
        ),
      ),
    ),
    toggleTemplateStatus: rxMethod<{ id: number; isActive: boolean }>(
      pipe(
        tap(() => patchState(store, { status: 'loading', error: null })),
        switchMap(({ id, isActive }) =>
          formService.toggleTemplateStatus(id, isActive).pipe(
            tap((updated) => {
              patchState(store, (state) => ({
                templates: state.templates.map((t) => (t.templateId === id ? updated : t)),
                status: 'success' as const,
              }));
            }),
            catchError((err) => {
              const error = err?.error?.message || 'Failed to toggle template status';
              patchState(store, { status: 'error', error });
              return of(null);
            }),
          ),
        ),
      ),
    ),
    deleteTemplate: rxMethod<number>(
      pipe(
        tap(() => patchState(store, { status: 'loading', error: null })),
        switchMap((id) =>
          formService.deleteTemplate(id).pipe(
            tap(() => {
              patchState(store, (state) => ({
                templates: state.templates.filter((t) => t.templateId !== id),
                totalTemplates: Math.max(0, state.totalTemplates - 1),
                status: 'success' as const,
              }));
            }),
            catchError((err) => {
              const error = err?.error?.message || 'Failed to delete template';
              patchState(store, { status: 'error', error });
              return of(null);
            }),
          ),
        ),
      ),
    ),
  })),
);
