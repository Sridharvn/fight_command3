import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, of } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { RegistrationService } from '../services/registration.service';
import { EventService } from '../services/event.service';
import {
  DuplicateGroup,
  RegistrationDetail,
  RegistrationStatus,
  ResolveDuplicateDto,
  SubmitRegistrationDto,
} from '../models/registration.models';
import { PublicEventForm } from '../models/event.models';

export type RosterTab = 'all' | 'pending' | 'approved' | 'rejected' | 'duplicates';

export interface RegistrationState {
  eventId: number | null;
  registrations: RegistrationDetail[];
  selectedRegistration: RegistrationDetail | null;
  publicEventForm: PublicEventForm | null;
  duplicates: DuplicateGroup[];
  total: number;
  page: number;
  limit: number;
  activeTab: RosterTab;
  searchQuery: string;
  selectedIds: number[];
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
  actionLoading: boolean;
  successMessage: string | null;
}

const initialState: RegistrationState = {
  eventId: null,
  registrations: [],
  selectedRegistration: null,
  publicEventForm: null,
  duplicates: [],
  total: 0,
  page: 1,
  limit: 50,
  activeTab: 'all',
  searchQuery: '',
  selectedIds: [],
  status: 'idle',
  error: null,
  actionLoading: false,
  successMessage: null,
};

export const RegistrationStore = signalStore(
  { providedIn: 'root' },
  withState<RegistrationState>(initialState),
  withComputed(({ registrations, duplicates, activeTab, searchQuery, selectedIds }) => ({
    totalRegistrationsCount: computed(() => registrations().length),
    pendingCount: computed(
      () => registrations().filter((r) => r.status === RegistrationStatus.PENDING).length,
    ),
    approvedCount: computed(
      () => registrations().filter((r) => r.status === RegistrationStatus.APPROVED).length,
    ),
    rejectedCount: computed(
      () => registrations().filter((r) => r.status === RegistrationStatus.REJECTED).length,
    ),
    duplicatesCount: computed(() => duplicates().length),
    filteredRegistrations: computed(() => {
      let list = [...registrations()];
      const tab = activeTab();
      const query = searchQuery().trim().toLowerCase();

      if (tab === 'pending') {
        list = list.filter((r) => r.status === RegistrationStatus.PENDING);
      } else if (tab === 'approved') {
        list = list.filter((r) => r.status === RegistrationStatus.APPROVED);
      } else if (tab === 'rejected') {
        list = list.filter((r) => r.status === RegistrationStatus.REJECTED);
      }

      if (query) {
        list = list.filter(
          (r) =>
            r.fullName.toLowerCase().includes(query) ||
            (r.email && r.email.toLowerCase().includes(query)) ||
            (r.phone && r.phone.toLowerCase().includes(query)) ||
            String(r.registrationId).includes(query),
        );
      }

      return list;
    }),
    isAllSelected: computed(() => {
      const filtered = registrations().filter((r) => {
        const tab = activeTab();
        if (tab === 'pending') return r.status === RegistrationStatus.PENDING;
        if (tab === 'approved') return r.status === RegistrationStatus.APPROVED;
        if (tab === 'rejected') return r.status === RegistrationStatus.REJECTED;
        return true;
      });
      return filtered.length > 0 && selectedIds().length === filtered.length;
    }),
  })),
  withMethods((store, regService = inject(RegistrationService), eventService = inject(EventService)) => {
    const loadRegistrations = rxMethod<number>(
      pipe(
        tap((eventId) =>
          patchState(store, { eventId, status: 'loading', error: null, selectedIds: [] }),
        ),
        switchMap((eventId) =>
          regService
            .getRegistrations(eventId, { page: store.page(), limit: store.limit() })
            .pipe(
              tap((response) => {
                patchState(store, {
                  registrations: response.data || [],
                  total: response.meta?.total || response.data?.length || 0,
                  status: 'success',
                });
              }),
              catchError((err) => {
                const msg = err.error?.message || 'Failed to load registrations';
                patchState(store, { status: 'error', error: msg });
                return of(null);
              }),
            ),
        ),
      ),
    );

    const loadDuplicates = rxMethod<number>(
      pipe(
        switchMap((eventId) =>
          eventService.getDuplicates(eventId).pipe(
            tap((duplicates) => {
              patchState(store, { duplicates: duplicates || [] });
            }),
            catchError((err) => {
              const msg = err.error?.message || 'Failed to load duplicates';
              patchState(store, { error: msg });
              return of(null);
            }),
          ),
        ),
      ),
    );

    const loadPublicForm = rxMethod<number>(
      pipe(
        tap(() => patchState(store, { status: 'loading', error: null })),
        switchMap((eventId) =>
          eventService.getPublicEventForm(eventId).pipe(
            tap((form) => {
              patchState(store, { publicEventForm: form, status: 'success' });
            }),
            catchError((err) => {
              const msg = err.error?.message || 'Failed to load registration form';
              patchState(store, { status: 'error', error: msg });
              return of(null);
            }),
          ),
        ),
      ),
    );

    return {
      setEventId(eventId: number): void {
        patchState(store, { eventId });
      },

      setActiveTab(activeTab: RosterTab): void {
        patchState(store, { activeTab, selectedIds: [] });
      },

      setSearchQuery(searchQuery: string): void {
        patchState(store, { searchQuery });
      },

      setSelectedRegistration(selectedRegistration: RegistrationDetail | null): void {
        patchState(store, { selectedRegistration });
      },

      toggleSelect(id: number): void {
        const current = store.selectedIds();
        if (current.includes(id)) {
          patchState(store, { selectedIds: current.filter((x) => x !== id) });
        } else {
          patchState(store, { selectedIds: [...current, id] });
        }
      },

      toggleSelectAll(ids: number[]): void {
        const current = store.selectedIds();
        if (current.length === ids.length) {
          patchState(store, { selectedIds: [] });
        } else {
          patchState(store, { selectedIds: [...ids] });
        }
      },

      clearSelection(): void {
        patchState(store, { selectedIds: [] });
      },

      clearMessages(): void {
        patchState(store, { error: null, successMessage: null });
      },

      loadRegistrations,
      loadDuplicates,
      loadPublicForm,

      updateStatus(
        registrationId: number,
        status: RegistrationStatus,
        onSuccess?: () => void,
      ): void {
        const evId = store.eventId();
        if (!evId) return;

        patchState(store, { actionLoading: true, error: null });
        regService
          .updateStatus(evId, registrationId, status)
          .pipe(
            tap(() => {
              patchState(store, {
                actionLoading: false,
                registrations: store
                  .registrations()
                  .map((r) =>
                    r.registrationId === registrationId ? { ...r, status } : r,
                  ),
                successMessage: `Status updated successfully`,
              });
              if (onSuccess) onSuccess();
            }),
            catchError((err) => {
              const msg = err.error?.message || 'Failed to update status';
              patchState(store, { actionLoading: false, error: msg });
              return of(null);
            }),
          )
          .subscribe();
      },

      batchUpdateStatus(status: RegistrationStatus, onSuccess?: () => void): void {
        const evId = store.eventId();
        const selected = store.selectedIds();
        if (!evId || selected.length === 0) return;

        patchState(store, { actionLoading: true, error: null });
        regService
          .batchUpdateStatus(evId, selected, status)
          .pipe(
            tap((res) => {
              patchState(store, {
                actionLoading: false,
                selectedIds: [],
                registrations: store
                  .registrations()
                  .map((r) =>
                    selected.includes(r.registrationId) ? { ...r, status } : r,
                  ),
                successMessage: res.message || 'Batch update completed',
              });
              if (onSuccess) onSuccess();
            }),
            catchError((err) => {
              const msg = err.error?.message || 'Failed to batch update status';
              patchState(store, { actionLoading: false, error: msg });
              return of(null);
            }),
          )
          .subscribe();
      },

      scanDuplicates(onSuccess?: () => void): void {
        const evId = store.eventId();
        if (!evId) return;

        patchState(store, { actionLoading: true, error: null });
        eventService
          .scanDuplicates(evId)
          .pipe(
            tap(() => {
              patchState(store, { actionLoading: false });
              loadDuplicates(evId);
              if (onSuccess) onSuccess();
            }),
            catchError((err) => {
              const msg = err.error?.message || 'Failed to scan duplicates';
              patchState(store, { actionLoading: false, error: msg });
              return of(null);
            }),
          )
          .subscribe();
      },

      resolveDuplicateGroup(dto: ResolveDuplicateDto, onSuccess?: () => void): void {
        const evId = store.eventId();
        if (!evId) return;

        patchState(store, { actionLoading: true, error: null });
        eventService
          .resolveDuplicates(evId, dto)
          .pipe(
            tap(() => {
              patchState(store, { actionLoading: false });
              loadDuplicates(evId);
              loadRegistrations(evId);
              if (onSuccess) onSuccess();
            }),
            catchError((err) => {
              const msg = err.error?.message || 'Failed to resolve duplicate';
              patchState(store, { actionLoading: false, error: msg });
              return of(null);
            }),
          )
          .subscribe();
      },

      submitRegistration(
        dto: SubmitRegistrationDto,
        onSuccess?: (regId: number) => void,
      ): void {
        const evId = store.eventId() || store.publicEventForm()?.eventId;
        if (!evId) return;

        patchState(store, { actionLoading: true, error: null, successMessage: null });
        regService
          .submitRegistration(evId, dto)
          .pipe(
            tap((res) => {
              patchState(store, {
                actionLoading: false,
                successMessage: 'Registration submitted successfully!',
              });
              if (store.eventId()) {
                loadRegistrations(evId);
              }
              if (onSuccess) onSuccess(res.registrationId);
            }),
            catchError((err) => {
              const msg = err.error?.message || 'Failed to submit registration';
              patchState(store, { actionLoading: false, error: msg });
              return of(null);
            }),
          )
          .subscribe();
      },
    };
  }),
);
