import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';
import { RegistrationStore } from './registration.store';
import { RegistrationService } from '../services/registration.service';
import { EventService } from '../services/event.service';
import {
  DuplicateAction,
  DuplicateGroup,
  RegistrationDetail,
  RegistrationStatus,
  ResolveDuplicateDto,
} from '../models/registration.models';
import { PublicEventForm, SportType, TournamentType } from '../models/event.models';

describe('RegistrationStore', () => {
  let store: InstanceType<typeof RegistrationStore>;
  let registrationServiceMock: {
    getRegistrations: ReturnType<typeof vi.fn>;
    updateStatus: ReturnType<typeof vi.fn>;
    batchUpdateStatus: ReturnType<typeof vi.fn>;
    submitRegistration: ReturnType<typeof vi.fn>;
    exportRegistrations: ReturnType<typeof vi.fn>;
  };
  let eventServiceMock: {
    getPublicEventForm: ReturnType<typeof vi.fn>;
    getDuplicates: ReturnType<typeof vi.fn>;
    scanDuplicates: ReturnType<typeof vi.fn>;
    resolveDuplicates: ReturnType<typeof vi.fn>;
  };

  const mockRegistrations: RegistrationDetail[] = [
    {
      registrationId: 1,
      participantId: 11,
      fullName: 'Athlete Alpha',
      email: 'alpha@test.com',
      status: RegistrationStatus.PENDING,
      registrationDate: '2026-02-01',
      responses: [],
    },
    {
      registrationId: 2,
      participantId: 22,
      fullName: 'Athlete Beta',
      email: 'beta@test.com',
      status: RegistrationStatus.APPROVED,
      registrationDate: '2026-02-02',
      responses: [],
    },
    {
      registrationId: 3,
      participantId: 33,
      fullName: 'Athlete Gamma',
      email: 'gamma@test.com',
      status: RegistrationStatus.REJECTED,
      registrationDate: '2026-02-03',
      responses: [],
    },
  ];

  const mockDuplicates: DuplicateGroup[] = [
    {
      isCrossState: false,
      isCrossDistrict: true,
      participants: [
        { participantId: 11, fullName: 'Athlete Alpha' },
        { participantId: 99, fullName: 'Athlete Alpha Clone' },
      ],
    },
  ];

  const mockPublicForm: PublicEventForm = {
    eventId: 1,
    eventName: 'National Sambo Championship',
    sportType: SportType.SAMBO,
    tournamentType: TournamentType.NATIONAL,
    templateFields: [],
  };

  beforeEach(() => {
    registrationServiceMock = {
      getRegistrations: vi
        .fn()
        .mockReturnValue(of({ data: mockRegistrations, meta: { total: 3 } })),
      updateStatus: vi.fn().mockReturnValue(of({ message: 'Status updated' })),
      batchUpdateStatus: vi.fn().mockReturnValue(of({ message: 'Batch updated', updatedCount: 2 })),
      submitRegistration: vi
        .fn()
        .mockReturnValue(of({ message: 'Submitted', registrationId: 105 })),
      exportRegistrations: vi.fn().mockReturnValue(of(new Blob())),
    };

    eventServiceMock = {
      getPublicEventForm: vi.fn().mockReturnValue(of(mockPublicForm)),
      getDuplicates: vi.fn().mockReturnValue(of(mockDuplicates)),
      scanDuplicates: vi.fn().mockReturnValue(of({ message: 'Scanned' })),
      resolveDuplicates: vi.fn().mockReturnValue(of({ message: 'Resolved' })),
    };

    TestBed.configureTestingModule({
      providers: [
        RegistrationStore,
        { provide: RegistrationService, useValue: registrationServiceMock },
        { provide: EventService, useValue: eventServiceMock },
      ],
    });

    store = TestBed.inject(RegistrationStore);
  });

  it('should initialize and compute tab counts correctly', () => {
    store.loadRegistrations(1);
    store.loadDuplicates(1);

    expect(store.registrations().length).toBe(3);
    expect(store.pendingCount()).toBe(1);
    expect(store.approvedCount()).toBe(1);
    expect(store.rejectedCount()).toBe(1);
    expect(store.duplicatesCount()).toBe(1);
  });

  it('should filter registrations by activeTab', () => {
    store.loadRegistrations(1);

    store.setActiveTab('pending');
    expect(store.filteredRegistrations().length).toBe(1);
    expect(store.filteredRegistrations()[0].registrationId).toBe(1);

    store.setActiveTab('approved');
    expect(store.filteredRegistrations().length).toBe(1);
    expect(store.filteredRegistrations()[0].registrationId).toBe(2);

    store.setActiveTab('rejected');
    expect(store.filteredRegistrations().length).toBe(1);
    expect(store.filteredRegistrations()[0].registrationId).toBe(3);

    store.setActiveTab('all');
    expect(store.filteredRegistrations().length).toBe(3);
  });

  it('should handle selection toggle and bulk batch approve', () => {
    store.loadRegistrations(1);
    store.toggleSelect(1);
    store.toggleSelect(2);
    expect(store.selectedIds()).toEqual([1, 2]);

    const onSuccess = vi.fn();
    store.batchUpdateStatus(RegistrationStatus.APPROVED, onSuccess);

    expect(registrationServiceMock.batchUpdateStatus).toHaveBeenCalledWith(
      1,
      [1, 2],
      RegistrationStatus.APPROVED,
    );
    expect(onSuccess).toHaveBeenCalled();
    expect(store.selectedIds()).toEqual([]);
  });

  it('should resolve duplicates and reload duplicate groups', () => {
    store.setEventId(1);
    const dto: ResolveDuplicateDto = {
      participantIds: [11, 99],
      action: DuplicateAction.MERGE,
      keepParticipantId: 11,
    };
    const onSuccess = vi.fn();
    store.resolveDuplicateGroup(dto, onSuccess);

    expect(eventServiceMock.resolveDuplicates).toHaveBeenCalledWith(1, dto);
    expect(onSuccess).toHaveBeenCalled();
  });
});
