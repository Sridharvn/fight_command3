import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signal } from '@angular/core';
import { EventRosterPage } from './event-roster';
import { RegistrationStore } from '../../stores/registration.store';
import { EventService } from '../../services/event.service';
import { RegistrationService } from '../../services/registration.service';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import {
  RegistrationDetail,
  RegistrationStatus,
} from '../../models/registration.models';
import { EventListItem, EventStatus, SportType, TournamentType } from '../../models/event.models';

describe('EventRosterPage', () => {
  let component: EventRosterPage;
  let fixture: ComponentFixture<EventRosterPage>;
  let registrationStoreMock: any;
  let eventServiceMock: any;
  let registrationServiceMock: any;

  const mockEvent: EventListItem = {
    eventId: 42,
    eventName: 'Championship 2026',
    sportType: SportType.SAMBO,
    tournamentType: TournamentType.NATIONAL,
    status: EventStatus.REGISTRATION_OPEN,
    createdAt: '2026-01-01',
  };

  const mockRegistrations: RegistrationDetail[] = [
    {
      registrationId: 101,
      participantId: 1,
      fullName: 'John Fighter',
      email: 'john@example.com',
      phone: '+919999999999',
      status: RegistrationStatus.PENDING,
      registrationDate: '2026-02-01',
      responses: [
        {
          templateFieldId: 5,
          fieldName: 'weight_category',
          fieldLabel: 'Weight Category',
          value: '71',
          displayValue: '-71 kg',
        },
      ],
    },
    {
      registrationId: 102,
      participantId: 2,
      fullName: 'Sarah Striker',
      email: 'sarah@example.com',
      phone: '+918888888888',
      status: RegistrationStatus.APPROVED,
      registrationDate: '2026-02-02',
      responses: [],
    },
  ];

  beforeEach(async () => {
    registrationStoreMock = {
      eventId: vi.fn().mockReturnValue(42),
      registrations: vi.fn().mockReturnValue(mockRegistrations),
      filteredRegistrations: vi.fn().mockReturnValue(mockRegistrations),
      duplicates: vi.fn().mockReturnValue([]),
      activeTab: vi.fn().mockReturnValue('all'),
      searchQuery: vi.fn().mockReturnValue(''),
      selectedIds: vi.fn().mockReturnValue([]),
      selectedRegistration: vi.fn().mockReturnValue(null),
      publicEventForm: signal<any>(null),
      totalRegistrationsCount: vi.fn().mockReturnValue(2),
      pendingCount: vi.fn().mockReturnValue(1),
      approvedCount: vi.fn().mockReturnValue(1),
      rejectedCount: vi.fn().mockReturnValue(0),
      duplicatesCount: vi.fn().mockReturnValue(0),
      actionLoading: vi.fn().mockReturnValue(false),
      isAllSelected: vi.fn().mockReturnValue(false),
      status: vi.fn().mockReturnValue('success'),
      error: vi.fn().mockReturnValue(null),
      successMessage: vi.fn().mockReturnValue(null),
      loadRegistrations: vi.fn(),
      loadDuplicates: vi.fn(),
      loadPublicForm: vi.fn(),
      setActiveTab: vi.fn(),
      setSearchQuery: vi.fn(),
      setSelectedRegistration: vi.fn(),
      toggleSelect: vi.fn(),
      toggleSelectAll: vi.fn(),
      clearSelection: vi.fn(),
      updateStatus: vi.fn(),
      batchUpdateStatus: vi.fn(),
      scanDuplicates: vi.fn(),
      resolveDuplicateGroup: vi.fn(),
      submitRegistration: vi.fn(),
    };

    eventServiceMock = {
      getEventById: vi.fn().mockReturnValue(of(mockEvent)),
    };

    registrationServiceMock = {
      exportRegistrations: vi.fn().mockReturnValue(of(new Blob())),
    };

    await TestBed.configureTestingModule({
      imports: [EventRosterPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: (key: string) => (key === 'eventId' ? '42' : null) } },
          },
        },
        { provide: RegistrationStore, useValue: registrationStoreMock },
        { provide: EventService, useValue: eventServiceMock },
        { provide: RegistrationService, useValue: registrationServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EventRosterPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and render athlete roster table', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.tournament-title')?.textContent).toContain('Championship 2026');
    expect(compiled.querySelectorAll('.athlete-row').length).toBe(2);
  });

  it('should switch status tabs', () => {
    component.onSelectTab('pending');
    expect(registrationStoreMock.setActiveTab).toHaveBeenCalledWith('pending');
  });

  it('should approve athlete when clicking approve button', () => {
    component.onApprove(101);
    expect(registrationStoreMock.updateStatus).toHaveBeenCalledWith(
      101,
      RegistrationStatus.APPROVED,
      expect.any(Function),
    );
  });

  it('should reject athlete when clicking reject button', () => {
    component.onReject(101);
    expect(registrationStoreMock.updateStatus).toHaveBeenCalledWith(
      101,
      RegistrationStatus.REJECTED,
      expect.any(Function),
    );
  });

  it('should open athlete submission details modal', () => {
    component.openDetailsModal(mockRegistrations[0]);
    expect(component.viewingRegistration()).toEqual(mockRegistrations[0]);
  });

  it('should dynamically render columns from event form definition in the roster table', () => {
    registrationStoreMock.publicEventForm.set({
      eventId: 42,
      eventName: 'Championship 2026',
      formTitle: 'Registration Form',
      templateFields: [
        {
          templateFieldId: 5,
          fieldName: 'weight_category',
          fieldLabel: 'Weight Category',
          fieldType: 'select',
          isRequired: true,
        },
        {
          templateFieldId: 6,
          fieldName: 'academy',
          fieldLabel: 'Club / Academy',
          fieldType: 'text',
          isRequired: false,
        },
      ],
    });

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const ths = Array.from(compiled.querySelectorAll('th')).map((th) => th.textContent?.trim());
    expect(ths).toContain('Weight Category');
    expect(ths).toContain('Club / Academy');

    const firstRowTds = Array.from(compiled.querySelectorAll('.athlete-row')[0].querySelectorAll('td')).map(
      (td) => td.textContent?.trim(),
    );
    expect(firstRowTds).toContain('-71 kg');
  });

  it('should render read-only dynamic form renderer inside details popup', () => {
    registrationStoreMock.publicEventForm.set({
      eventId: 42,
      eventName: 'Championship 2026',
      formTitle: 'Registration Form',
      templateFields: [
        {
          templateFieldId: 5,
          fieldName: 'weight_category',
          fieldLabel: 'Weight Category',
          fieldType: 'select',
          isRequired: true,
        },
      ],
    });

    component.openDetailsModal(mockRegistrations[0]);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const dynamicRenderer = compiled.querySelector('app-dynamic-form-renderer');
    expect(dynamicRenderer).toBeTruthy();

    const initialData = component.getRegistrationFormData(mockRegistrations[0]);
    expect(initialData['fullName']).toBe('John Fighter');
    expect(initialData['email']).toBe('john@example.com');
    expect(initialData['weight_category']).toBe('-71 kg');
  });

  it('should render date of birth in roster table and format initial data for details modal', () => {
    const regWithDob: RegistrationDetail = {
      ...mockRegistrations[0],
      dob: '2000-05-15T00:00:00.000Z',
    };

    const dobField = { id: 'dob', key: 'dob', label: 'Date of Birth', type: 'date' as const };
    const val = component.getFieldValue(regWithDob, dobField);
    expect(val).toBe('2000-05-15');

    const dateOfBirthField = { id: '4', key: 'date_of_birth', label: 'Date of Birth', type: 'date' as const };
    const val2 = component.getFieldValue(regWithDob, dateOfBirthField);
    expect(val2).toBe('2000-05-15');

    const initialData = component.getRegistrationFormData(regWithDob);
    expect(initialData['dob']).toBe('2000-05-15');
    expect(initialData['date_of_birth']).toBe('2000-05-15');
  });
});

