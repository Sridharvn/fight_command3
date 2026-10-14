import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, of } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { EventService } from '../services/event.service';
import { CreateEventDto, EventListItem, EventStatus, UpdateEventDto } from '../models/event.models';

export type EventStatusTab = 'all' | 'active' | 'draft' | 'archived';

export interface EventsState {
  events: EventListItem[];
  selectedEvent: EventListItem | null;
  total: number;
  page: number;
  limit: number;
  statusTab: EventStatusTab;
  selectedSport: number | 'all';
  selectedLevel: number | 'all';
  searchQuery: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
  actionLoading: boolean;
}

const initialState: EventsState = {
  events: [],
  selectedEvent: null,
  total: 0,
  page: 1,
  limit: 20,
  statusTab: 'all',
  selectedSport: 'all',
  selectedLevel: 'all',
  searchQuery: '',
  status: 'idle',
  error: null,
  actionLoading: false,
};

export const EventsStore = signalStore(
  { providedIn: 'root' },
  withState<EventsState>(initialState),
  withComputed(({ events, statusTab, selectedSport, selectedLevel, searchQuery }) => ({
    totalEventsCount: computed(() => events().length),
    draftEventsCount: computed(() => events().filter((e) => e.status === EventStatus.DRAFT).length),
    activeEventsCount: computed(
      () =>
        events().filter(
          (e) => e.status === EventStatus.PUBLISHED || e.status === EventStatus.REGISTRATION_OPEN,
        ).length,
    ),
    archivedEventsCount: computed(
      () =>
        events().filter(
          (e) => e.status === EventStatus.COMPLETED || e.status === EventStatus.CANCELLED,
        ).length,
    ),
    filteredEvents: computed(() => {
      let list = [...events()];
      const tab = statusTab();
      const sport = selectedSport();
      const level = selectedLevel();
      const query = searchQuery().trim().toLowerCase();

      // Filter by status tab
      if (tab === 'draft') {
        list = list.filter((e) => e.status === EventStatus.DRAFT);
      } else if (tab === 'active') {
        list = list.filter(
          (e) => e.status === EventStatus.PUBLISHED || e.status === EventStatus.REGISTRATION_OPEN,
        );
      } else if (tab === 'archived') {
        list = list.filter(
          (e) => e.status === EventStatus.COMPLETED || e.status === EventStatus.CANCELLED,
        );
      }

      // Filter by sport
      if (sport !== 'all') {
        list = list.filter((e) => Number(e.sportType) === Number(sport));
      }

      // Filter by tournament level
      if (level !== 'all') {
        list = list.filter((e) => Number(e.tournamentType) === Number(level));
      }

      // Filter by query
      if (query) {
        list = list.filter(
          (e) =>
            e.eventName.toLowerCase().includes(query) ||
            (e.location && e.location.toLowerCase().includes(query)) ||
            String(e.eventId).includes(query),
        );
      }

      return list;
    }),
  })),
  withMethods((store, eventService = inject(EventService)) => {
    const loadEvents = rxMethod<void>(
      pipe(
        tap(() => patchState(store, { status: 'loading', error: null })),
        switchMap(() =>
          eventService
            .getAllEvents({
              page: store.page(),
              limit: store.limit(),
            })
            .pipe(
              tap((response) => {
                patchState(store, {
                  events: response.data || [],
                  total: response.meta?.total || response.data?.length || 0,
                  status: 'success',
                });
              }),
              catchError((err) => {
                const msg = err.error?.message || 'Failed to load events';
                patchState(store, { status: 'error', error: msg });
                return of(null);
              }),
            ),
        ),
      ),
    );

    return {
      setStatusTab(statusTab: EventStatusTab): void {
        patchState(store, { statusTab });
      },

      setSelectedSport(selectedSport: number | 'all'): void {
        patchState(store, { selectedSport });
      },

      setSelectedLevel(selectedLevel: number | 'all'): void {
        patchState(store, { selectedLevel });
      },

      setSearchQuery(searchQuery: string): void {
        patchState(store, { searchQuery });
      },

      setSelectedEvent(selectedEvent: EventListItem | null): void {
        patchState(store, { selectedEvent });
      },

      loadEvents,

      createEvent(dto: CreateEventDto, onSuccess?: (eventId: number) => void): void {
        patchState(store, { actionLoading: true, error: null });
        eventService
          .createEvent(dto)
          .pipe(
            tap((res) => {
              patchState(store, { actionLoading: false });
              loadEvents();
              if (onSuccess) onSuccess(res.eventId);
            }),
            catchError((err) => {
              const msg = err.error?.message || 'Failed to create event';
              patchState(store, { actionLoading: false, error: msg });
              return of(null);
            }),
          )
          .subscribe();
      },

      updateEvent(eventId: number, dto: UpdateEventDto, onSuccess?: () => void): void {
        patchState(store, { actionLoading: true, error: null });
        eventService
          .updateEvent(eventId, dto)
          .pipe(
            tap(() => {
              patchState(store, { actionLoading: false });
              loadEvents();
              if (onSuccess) onSuccess();
            }),
            catchError((err) => {
              const msg = err.error?.message || 'Failed to update event';
              patchState(store, { actionLoading: false, error: msg });
              return of(null);
            }),
          )
          .subscribe();
      },

      publishEvent(eventId: number, onSuccess?: () => void): void {
        patchState(store, { actionLoading: true, error: null });
        eventService
          .updateEvent(eventId, { status: EventStatus.REGISTRATION_OPEN })
          .pipe(
            tap(() => {
              patchState(store, {
                actionLoading: false,
                events: store
                  .events()
                  .map((e) =>
                    e.eventId === eventId ? { ...e, status: EventStatus.REGISTRATION_OPEN } : e,
                  ),
              });
              if (onSuccess) onSuccess();
            }),
            catchError((err) => {
              const msg = err.error?.message || 'Failed to publish event';
              patchState(store, { actionLoading: false, error: msg });
              return of(null);
            }),
          )
          .subscribe();
      },

      archiveEvent(eventId: number, onSuccess?: () => void): void {
        patchState(store, { actionLoading: true, error: null });
        eventService
          .updateEvent(eventId, { status: EventStatus.COMPLETED })
          .pipe(
            tap(() => {
              patchState(store, {
                actionLoading: false,
                events: store
                  .events()
                  .map((e) =>
                    e.eventId === eventId ? { ...e, status: EventStatus.COMPLETED } : e,
                  ),
              });
              if (onSuccess) onSuccess();
            }),
            catchError((err) => {
              const msg = err.error?.message || 'Failed to archive event';
              patchState(store, { actionLoading: false, error: msg });
              return of(null);
            }),
          )
          .subscribe();
      },

      unarchiveEvent(eventId: number, onSuccess?: () => void): void {
        patchState(store, { actionLoading: true, error: null });
        eventService
          .updateEvent(eventId, { status: EventStatus.REGISTRATION_OPEN })
          .pipe(
            tap(() => {
              patchState(store, {
                actionLoading: false,
                events: store
                  .events()
                  .map((e) =>
                    e.eventId === eventId ? { ...e, status: EventStatus.REGISTRATION_OPEN } : e,
                  ),
              });
              if (onSuccess) onSuccess();
            }),
            catchError((err) => {
              const msg = err.error?.message || 'Failed to unarchive event';
              patchState(store, { actionLoading: false, error: msg });
              return of(null);
            }),
          )
          .subscribe();
      },

      deleteEvent(eventId: number, onSuccess?: () => void): void {
        patchState(store, { actionLoading: true, error: null });
        eventService
          .deleteEvent(eventId)
          .pipe(
            tap(() => {
              patchState(store, {
                actionLoading: false,
                events: store.events().filter((e) => e.eventId !== eventId),
              });
              if (onSuccess) onSuccess();
            }),
            catchError((err) => {
              const msg = err.error?.message || 'Failed to delete event';
              patchState(store, { actionLoading: false, error: msg });
              return of(null);
            }),
          )
          .subscribe();
      },
    };
  }),
);
