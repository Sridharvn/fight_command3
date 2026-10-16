import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signal } from '@angular/core';
import { EventRosterPage } from './event-roster';
import { RegistrationStore } from '../../stores/registration.store';
import { EventService } from '../../services/event.service';
import { RegistrationService } from '../../services/registration.service';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { RegistrationDetail, RegistrationStatus } from '../../models/registration.models';
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
      clearMessages: vi.fn(),
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

    const firstRowTds = Array.from(
      compiled.querySelectorAll('.athlete-row')[0].querySelectorAll('td'),
    ).map((td) => td.textContent?.trim());
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

    const dateOfBirthField = {
      id: '4',
      key: 'date_of_birth',
      label: 'Date of Birth',
      type: 'date' as const,
    };
    const val2 = component.getFieldValue(regWithDob, dateOfBirthField);
    expect(val2).toBe('2000-05-15');

    const initialData = component.getRegistrationFormData(regWithDob);
    expect(initialData['dob']).toBe('2000-05-15');
    expect(initialData['date_of_birth']).toBe('2000-05-15');
  });

  it('should format all diverse form field types properly in getFieldValue and details initialData', () => {
    const multiItemReg: RegistrationDetail = {
      registrationId: 201,
      participantId: 10,
      fullName: 'Karan Singhania',
      email: 'karan@example.com',
      phone: '+919876543211',
      dob: '1998-07-22T00:00:00.000Z',
      status: RegistrationStatus.PENDING,
      registrationDate: '2026-03-01',
      responses: [
        {
          templateFieldId: 1,
          fieldName: 'belt_rank',
          fieldLabel: 'Belt Rank',
          value: 'black',
          displayValue: 'Black Belt',
        },
        {
          templateFieldId: 2,
          fieldName: 'weight_kg',
          fieldLabel: 'Exact Weight (KG)',
          value: '77.5',
        },
        {
          templateFieldId: 3,
          fieldName: 'competition_stance',
          fieldLabel: 'Competition Stance',
          value: 'orthodox',
        },
        {
          templateFieldId: 4,
          fieldName: 'medical_clearance_date',
          fieldLabel: 'Medical Clearance Date',
          value: '2026-05-15',
        },
        {
          templateFieldId: 5,
          fieldName: 'medical_notes',
          fieldLabel: 'Medical Notes',
          value: 'Cleared for combat.',
        },
        {
          templateFieldId: 6,
          fieldName: 'has_valid_insurance',
          fieldLabel: 'Has Insurance',
          value: 'true',
        },
        {
          templateFieldId: 7,
          fieldName: 'prior_injuries_count',
          fieldLabel: 'Prior Injuries Count',
          value: '0',
        },
        {
          templateFieldId: 8,
          fieldName: 'needs_transport',
          fieldLabel: 'Needs Transport',
          value: 'false',
        },
        {
          templateFieldId: 9,
          fieldName: 'place_of_birth',
          fieldLabel: 'Place of Birth',
          value: 'Bengaluru',
        },
      ],
    };

    // 1. Check getFieldValue for various types
    expect(
      component.getFieldValue(multiItemReg, {
        id: '1',
        key: 'belt_rank',
        label: 'Belt Rank',
        type: 'select',
      }),
    ).toBe('Black Belt');
    expect(
      component.getFieldValue(multiItemReg, {
        id: '2',
        key: 'weight_kg',
        label: 'Exact Weight (KG)',
        type: 'number',
      }),
    ).toBe('77.5');
    // Option label resolution from field options if displayValue is absent
    expect(
      component.getFieldValue(multiItemReg, {
        id: '3',
        key: 'competition_stance',
        label: 'Competition Stance',
        type: 'radio',
        options: [
          { value: 'orthodox', label: 'Orthodox' },
          { value: 'southpaw', label: 'Southpaw' },
        ],
      }),
    ).toBe('Orthodox');
    // Crucial: custom date field should return its own value, NOT athlete dob
    expect(
      component.getFieldValue(multiItemReg, {
        id: '4',
        key: 'medical_clearance_date',
        label: 'Medical Clearance Date',
        type: 'date',
      }),
    ).toBe('2026-05-15');
    // Crucial: custom field containing 'birth' in label (Place of Birth) should return its value, NOT athlete dob
    expect(
      component.getFieldValue(multiItemReg, {
        id: '9',
        key: 'place_of_birth',
        label: 'Place of Birth',
        type: 'text',
      }),
    ).toBe('Bengaluru');
    // Boolean true / false display
    expect(
      component.getFieldValue(multiItemReg, {
        id: '6',
        key: 'has_valid_insurance',
        label: 'Has Insurance',
        type: 'boolean',
      }),
    ).toBe('Yes');
    expect(
      component.getFieldValue(multiItemReg, {
        id: '8',
        key: 'needs_transport',
        label: 'Needs Transport',
        type: 'boolean',
      }),
    ).toBe('No');
    // Falsy value 0 should display as '0', not '—'
    expect(
      component.getFieldValue(multiItemReg, {
        id: '7',
        key: 'prior_injuries_count',
        label: 'Prior Injuries Count',
        type: 'number',
      }),
    ).toBe('0');

    // 2. Check getRegistrationFormData boolean conversion and value precedence
    const initData = component.getRegistrationFormData(multiItemReg);
    expect(initData['has_valid_insurance']).toBe(true);
    expect(initData['needs_transport']).toBe(false);
    expect(initData['weight_kg']).toBe('77.5');
    expect(initData['medical_clearance_date']).toBe('2026-05-15');
    expect(initData['place_of_birth']).toBe('Bengaluru');

    // 3. Check getResponseDisplayValue
    expect(component.getResponseDisplayValue(multiItemReg.responses![0])).toBe('Black Belt');
    expect(component.getResponseDisplayValue(multiItemReg.responses![5])).toBe('Yes');
    expect(component.getResponseDisplayValue(multiItemReg.responses![6])).toBe('0');
    expect(component.getResponseDisplayValue(multiItemReg.responses![7])).toBe('No');
    expect(component.getResponseDisplayValue(multiItemReg.responses![8])).toBe('Bengaluru');
  });

  it('should enforce mandatory validation on all core demographic fields (fullName, email, phone, dob)', () => {
    // When publicEventForm has no templateFields or empty schema
    registrationStoreMock.publicEventForm.set({
      eventName: 'Test Tournament',
      sportType: SportType.SAMBO,
      tournamentType: TournamentType.NATIONAL,
    });

    const schema = component.dynamicFormDefinition();
    expect(schema).toBeTruthy();

    const nameField = schema?.fields.find((f) => f.key === 'fullName');
    const emailField = schema?.fields.find((f) => f.key === 'email');
    const phoneField = schema?.fields.find((f) => f.key === 'phone');
    const dobField = schema?.fields.find((f) => f.key === 'dob');

    expect(nameField?.required).toBe(true);
    expect(emailField?.required).toBe(true);
    expect(phoneField?.required).toBe(true);
    expect(dobField?.required).toBe(true);
  });

  it('should submit registration with all demographic fields from admin Register Fighter modal', () => {
    registrationStoreMock.publicEventForm.set({
      eventId: 42,
      eventName: 'Test Tournament',
      sportType: SportType.SAMBO,
      tournamentType: TournamentType.NATIONAL,
      templateFields: [
        {
          templateFieldId: 10,
          fieldName: 'weight_category',
          fieldLabel: 'Weight Category',
          isRequired: true,
        },
      ],
    });

    component.openRegisterModal();
    expect(component.isRegisterModalOpen()).toBe(true);

    const formData = {
      fullName: 'Vikram Seth',
      email: 'vikram@example.com',
      phone: '+919876543210',
      dob: '1995-10-12',
      weight_category: '71',
    };

    component.onDynamicFormSubmit(formData);

    expect(registrationStoreMock.submitRegistration).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: 'Vikram Seth',
        email: 'vikram@example.com',
        phone: '+919876543210',
        dob: '1995-10-12',
        responses: [
          {
            templateFieldId: 10,
            value: '71',
          },
        ],
      }),
      expect.any(Function),
    );
  });

  it('should normalize formSchema to guarantee fullName, email, phone, and dob exist and are required (VR-REG-002)', () => {
    // When formSchema exists but lacks dob and has non-mandatory email/phone
    registrationStoreMock.publicEventForm.set({
      eventId: 42,
      eventName: 'Test Tournament',
      sportType: SportType.SAMBO,
      tournamentType: TournamentType.NATIONAL,
      formSchema: {
        templateName: 'Custom Form',
        sportType: SportType.SAMBO,
        tournamentType: TournamentType.NATIONAL,
        fields: [
          { id: 'fullName', key: 'fullName', label: 'Full Name', type: 'text', required: true },
          { id: 'email', key: 'email', label: 'Email', type: 'email', required: false },
          { id: 'phone', key: 'phone', label: 'Phone', type: 'text', required: false },
          { id: 'custom_1', key: 'belt', label: 'Belt Color', type: 'text', required: true },
        ],
        validations: [],
      },
    });

    const schema = component.dynamicFormDefinition();
    expect(schema).toBeTruthy();

    const nameField = schema?.fields.find((f) => f.key === 'fullName');
    const emailField = schema?.fields.find((f) => f.key === 'email');
    const phoneField = schema?.fields.find((f) => f.key === 'phone');
    const dobField = schema?.fields.find((f) => f.key === 'dob' || f.key === 'date_of_birth');

    expect(nameField?.required).toBe(true);
    expect(emailField?.required).toBe(true);
    expect(phoneField?.required).toBe(true);
    expect(dobField).toBeDefined();
    expect(dobField?.required).toBe(true);
    expect(dobField?.type).toBe('date');
  });

  it('should clear store messages and open register modal (EC-REG-001)', () => {
    component.openRegisterModal();
    expect(registrationStoreMock.clearMessages).toHaveBeenCalled();
    expect(component.isRegisterModalOpen()).toBe(true);
  });

  it('should display "Duplicates found (X)" and automatically switch to duplicates tab when duplicates are found (HF-DUP-001)', () => {
    registrationStoreMock.scanDuplicates.mockImplementation(
      (callback?: (count: number) => void) => {
        if (callback) callback(2);
      },
    );

    component.onScanDuplicates();

    expect(registrationStoreMock.scanDuplicates).toHaveBeenCalled();
    expect(registrationStoreMock.setActiveTab).toHaveBeenCalledWith('duplicates');
    expect(component.toastMessage()).toBe('Duplicates found (2)');
  });

  it('should display "No duplicates found" and remain on current tab when no duplicates are found (HF-DUP-002)', () => {
    registrationStoreMock.scanDuplicates.mockImplementation(
      (callback?: (count: number) => void) => {
        if (callback) callback(0);
      },
    );

    component.onScanDuplicates();

    expect(registrationStoreMock.scanDuplicates).toHaveBeenCalled();
    expect(registrationStoreMock.setActiveTab).not.toHaveBeenCalledWith('duplicates');
    expect(component.toastMessage()).toBe('No duplicates found');
  });
});
