import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventService } from './event.service';
import { ApiService } from './api.service';
import { of } from 'rxjs';

import {
  CreateEventDto,
  EventListItem,
  EventStatus,
  PublicEventForm,
  SportType,
  TournamentType,
  UpdateEventDto,
} from '../models/event.models';
import { DuplicateAction, ResolveDuplicateDto } from '../models/registration.models';

describe('EventService', () => {
  let service: EventService;
  let apiServiceMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  const mockEvent: EventListItem = {
    eventId: 1,
    eventName: 'National Sambo Championship 2026',
    sportType: SportType.SAMBO,
    tournamentType: TournamentType.NATIONAL,
    status: EventStatus.DRAFT,
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    apiServiceMock = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [EventService, { provide: ApiService, useValue: apiServiceMock }],
    });

    service = TestBed.inject(EventService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call GET /events with query parameters in getAllEvents', () => {
    apiServiceMock.get.mockReturnValue(of({ data: [mockEvent], meta: { total: 1 } }));

    service.getAllEvents({ page: 1, limit: 10, status: EventStatus.DRAFT }).subscribe((res) => {
      expect(res.data).toEqual([mockEvent]);
    });

    expect(apiServiceMock.get).toHaveBeenCalledWith('/events', {
      params: expect.objectContaining({ page: 1, limit: 10, status: EventStatus.DRAFT }),
    });
  });

  it('should call GET /events/:eventId in getEventById', () => {
    apiServiceMock.get.mockReturnValue(of(mockEvent));

    service.getEventById(1).subscribe((res) => {
      expect(res).toEqual(mockEvent);
    });

    expect(apiServiceMock.get).toHaveBeenCalledWith('/events/1');
  });

  it('should call POST /events in createEvent', () => {
    const dto: CreateEventDto = {
      eventName: 'New Tournament',
      sportType: SportType.SAMBO,
      tournamentType: TournamentType.NATIONAL,
      eventStartDate: '2026-11-01',
      eventEndDate: '2026-11-03',
      registrationOpenDate: '2026-10-01',
      registrationCloseDate: '2026-10-25',
    };
    apiServiceMock.post.mockReturnValue(of({ message: 'Event created', eventId: 10 }));

    service.createEvent(dto).subscribe((res) => {
      expect(res.eventId).toBe(10);
    });

    expect(apiServiceMock.post).toHaveBeenCalledWith('/events', dto);
  });

  it('should call PUT /events/:eventId in updateEvent', () => {
    const dto: UpdateEventDto = { status: EventStatus.REGISTRATION_OPEN };
    apiServiceMock.put.mockReturnValue(of({ message: 'Event updated' }));

    service.updateEvent(1, dto).subscribe((res) => {
      expect(res.message).toBe('Event updated');
    });

    expect(apiServiceMock.put).toHaveBeenCalledWith('/events/1', dto);
  });

  it('should call DELETE /events/:eventId in deleteEvent', () => {
    apiServiceMock.delete.mockReturnValue(of({ message: 'Event deleted' }));

    service.deleteEvent(1).subscribe((res) => {
      expect(res.message).toBe('Event deleted');
    });

    expect(apiServiceMock.delete).toHaveBeenCalledWith('/events/1');
  });

  it('should call GET /events/:eventId/public-form in getPublicEventForm', () => {
    const mockPublicForm: PublicEventForm = {
      eventId: 1,
      eventName: 'National Sambo Championship 2026',
      sportType: SportType.SAMBO,
      tournamentType: TournamentType.NATIONAL,
    };
    apiServiceMock.get.mockReturnValue(of(mockPublicForm));

    service.getPublicEventForm(1).subscribe((res) => {
      expect(res).toEqual(mockPublicForm);
    });

    expect(apiServiceMock.get).toHaveBeenCalledWith('/events/1/public-form');
  });

  it('should call duplicate endpoints correctly', () => {
    apiServiceMock.get.mockReturnValue(of([]));
    apiServiceMock.post.mockReturnValue(of({ message: 'Success' }));

    service.getDuplicates(1).subscribe();
    expect(apiServiceMock.get).toHaveBeenCalledWith('/events/1/duplicates');

    service.scanDuplicates(1).subscribe();
    expect(apiServiceMock.post).toHaveBeenCalledWith('/events/1/duplicates/scan');

    const resolveDto: ResolveDuplicateDto = {
      participantIds: [1, 2],
      action: DuplicateAction.MERGE,
      keepParticipantId: 1,
    };
    service.resolveDuplicates(1, resolveDto).subscribe();
    expect(apiServiceMock.post).toHaveBeenCalledWith('/events/1/duplicates/resolve', resolveDto);
  });
});
