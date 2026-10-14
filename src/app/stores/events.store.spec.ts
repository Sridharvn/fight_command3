import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { EventsStore } from './events.store';
import { EventService } from '../services/event.service';
import { EventListItem, EventStatus, SportType, TournamentType } from '../models/event.models';

describe('EventsStore', () => {
  let store: InstanceType<typeof EventsStore>;
  let eventServiceMock: {
    getAllEvents: ReturnType<typeof vi.fn>;
    createEvent: ReturnType<typeof vi.fn>;
    updateEvent: ReturnType<typeof vi.fn>;
    deleteEvent: ReturnType<typeof vi.fn>;
  };

  const mockEvents: EventListItem[] = [
    {
      eventId: 1,
      eventName: 'National Sambo Championship',
      sportType: SportType.SAMBO,
      tournamentType: TournamentType.NATIONAL,
      status: EventStatus.DRAFT,
      createdAt: '2026-01-01',
    },
    {
      eventId: 2,
      eventName: 'State MMA Open',
      sportType: SportType.MMA,
      tournamentType: TournamentType.STATE,
      status: EventStatus.REGISTRATION_OPEN,
      createdAt: '2026-01-02',
    },
    {
      eventId: 3,
      eventName: 'District Boxing Clash',
      sportType: SportType.BOXING,
      tournamentType: TournamentType.DISTRICT,
      status: EventStatus.COMPLETED,
      createdAt: '2026-01-03',
    },
  ];

  beforeEach(() => {
    eventServiceMock = {
      getAllEvents: vi
        .fn()
        .mockReturnValue(of({ data: mockEvents, meta: { total: 3, page: 1, limit: 10 } })),
      createEvent: vi.fn().mockReturnValue(of({ message: 'Created', eventId: 4 })),
      updateEvent: vi.fn().mockReturnValue(of({ message: 'Updated' })),
      deleteEvent: vi.fn().mockReturnValue(of({ message: 'Deleted' })),
    };

    TestBed.configureTestingModule({
      providers: [EventsStore, { provide: EventService, useValue: eventServiceMock }],
    });

    store = TestBed.inject(EventsStore);
  });

  it('should initialize with default state and compute metric counts', () => {
    store.loadEvents();
    expect(store.events().length).toBe(3);
    expect(store.totalEventsCount()).toBe(3);
    expect(store.draftEventsCount()).toBe(1);
    expect(store.activeEventsCount()).toBe(1);
    expect(store.archivedEventsCount()).toBe(1);
  });

  it('should filter events by statusTab', () => {
    store.loadEvents();

    store.setStatusTab('draft');
    expect(store.filteredEvents().length).toBe(1);
    expect(store.filteredEvents()[0].eventId).toBe(1);

    store.setStatusTab('active');
    expect(store.filteredEvents().length).toBe(1);
    expect(store.filteredEvents()[0].eventId).toBe(2);

    store.setStatusTab('archived');
    expect(store.filteredEvents().length).toBe(1);
    expect(store.filteredEvents()[0].eventId).toBe(3);

    store.setStatusTab('all');
    expect(store.filteredEvents().length).toBe(3);
  });

  it('should filter events by search query', () => {
    store.loadEvents();
    store.setSearchQuery('Sambo');
    expect(store.filteredEvents().length).toBe(1);
    expect(store.filteredEvents()[0].eventName).toContain('Sambo');
  });

  it('should publish draft event and update its status', () => {
    store.loadEvents();
    const onSuccess = vi.fn();
    store.publishEvent(1, onSuccess);

    expect(eventServiceMock.updateEvent).toHaveBeenCalledWith(1, {
      status: EventStatus.REGISTRATION_OPEN,
    });
    expect(onSuccess).toHaveBeenCalled();
  });

  it('should unarchive event and restore its status to REGISTRATION_OPEN', () => {
    store.loadEvents();
    const onSuccess = vi.fn();
    (store as any).unarchiveEvent(3, onSuccess);

    expect(eventServiceMock.updateEvent).toHaveBeenCalledWith(3, {
      status: EventStatus.REGISTRATION_OPEN,
    });
    expect(onSuccess).toHaveBeenCalled();
    const event = store.events().find((e) => e.eventId === 3);
    expect(event?.status).toBe(EventStatus.REGISTRATION_OPEN);
  });

  it('should delete event and remove it from store events list', () => {
    store.loadEvents();
    expect(store.events().length).toBe(3);
    const onSuccess = vi.fn();
    store.deleteEvent(1, onSuccess);

    expect(eventServiceMock.deleteEvent).toHaveBeenCalledWith(1);
    expect(onSuccess).toHaveBeenCalled();
    expect(store.events().length).toBe(2);
    expect(store.events().find((e) => e.eventId === 1)).toBeUndefined();
  });
});
