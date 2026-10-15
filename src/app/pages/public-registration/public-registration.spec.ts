import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PublicRegistrationPage } from './public-registration';
import { EventService } from '../../services/event.service';
import { RegistrationService } from '../../services/registration.service';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { EventStatus, PublicEventForm, SportType, TournamentType } from '../../models/event.models';

describe('PublicRegistrationPage', () => {
  let component: PublicRegistrationPage;
  let fixture: ComponentFixture<PublicRegistrationPage>;
  let eventServiceMock: any;
  let registrationServiceMock: any;

  const mockPublicForm: PublicEventForm = {
    eventId: 99,
    eventName: 'Open Sambo Championship 2026',
    sportType: SportType.SAMBO,
    tournamentType: TournamentType.NATIONAL,
    eventStartDate: '2026-12-01',
    eventEndDate: '2026-12-02',
    location: 'National Stadium, New Delhi',
    formTitle: 'Athlete Registration',
    formDescription: 'Fill out this form to enter the tournament.',
    registrationOpenDate: '2026-01-01',
    registrationCloseDate: '2026-12-31',
    templateFields: [
      {
        templateFieldId: 1,
        fieldName: 'weight_category',
        fieldLabel: 'Weight Category',
        fieldType: 'select',
        isRequired: true,
        fieldOptions: { options: ['-64 kg', '-71 kg', '-79 kg'] },
      },
    ],
  };

  beforeEach(async () => {
    eventServiceMock = {
      getPublicEventForm: vi.fn().mockReturnValue(of(mockPublicForm)),
    };

    registrationServiceMock = {
      submitRegistration: vi
        .fn()
        .mockReturnValue(
          of({ message: 'Registration submitted successfully', registrationId: 501 }),
        ),
    };

    await TestBed.configureTestingModule({
      imports: [PublicRegistrationPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: (key: string) => (key === 'eventId' ? '99' : null) } },
          },
        },
        { provide: EventService, useValue: eventServiceMock },
        { provide: RegistrationService, useValue: registrationServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PublicRegistrationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load tournament public details', () => {
    expect(component).toBeTruthy();
    expect(eventServiceMock.getPublicEventForm).toHaveBeenCalledWith(99);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.tournament-title')?.textContent).toContain(
      'Open Sambo Championship 2026',
    );
  });

  it('should submit registration and display confirmation view', () => {
    const formData = {
      fullName: 'Vikram Singh',
      email: 'vikram@example.com',
      phone: '+919876543210',
      dob: '1998-05-15',
      weight_category: '-71 kg',
    };

    component.onFormSubmit(formData);

    expect(registrationServiceMock.submitRegistration).toHaveBeenCalledWith(
      99,
      expect.objectContaining({
        fullName: 'Vikram Singh',
        email: 'vikram@example.com',
        responses: expect.arrayContaining([{ templateFieldId: 1, value: '-71 kg' }]),
      }),
    );

    expect(component.isSubmitted()).toBe(true);
    expect(component.submittedRegistrationId()).toBe(501);
  });

  it('should handle duplicate registration 409 error cleanly', () => {
    registrationServiceMock.submitRegistration.mockReturnValue(
      throwError(() => ({
        status: 409,
        error: { message: 'This participant has already registered for this event' },
      })),
    );

    component.onFormSubmit({ fullName: 'Vikram Singh' });
    expect(component.isSubmitted()).toBe(false);
    expect(component.errorMessage()).toContain('already registered');
  });

  it('should reset form when clicking register another athlete', () => {
    component.isSubmitted.set(true);
    component.resetForm();
    expect(component.isSubmitted()).toBe(false);
    expect(component.submittedRegistrationId()).toBeNull();
  });

  it('should display "Registration Closed" when tournament is archived or completed', () => {
    component.publicForm.set({
      ...mockPublicForm,
      status: EventStatus.COMPLETED,
    });
    fixture.detectChanges();

    expect(component.isRegistrationOpen()).toBe(false);
    expect(component.isRegistrationClosed()).toBe(true);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.closed-badge')?.textContent).toContain('Registration Closed');
    expect(compiled.querySelector('.closed-card h2')?.textContent).toContain('Registration Closed');
    expect(compiled.querySelector('.registration-form-card')).toBeNull();
  });

  it('should display "Tournament Not Opened" when tournament is in draft or registration has not opened', () => {
    component.publicForm.set({
      ...mockPublicForm,
      status: EventStatus.DRAFT,
      registrationOpenDate: '2099-01-01',
    });
    fixture.detectChanges();

    expect(component.isRegistrationOpen()).toBe(false);
    expect(component.isTournamentNotOpened()).toBe(true);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.not-opened-badge')?.textContent).toContain(
      'Tournament Not Opened',
    );
    expect(compiled.querySelector('.not-opened-card h2')?.textContent).toContain(
      'Tournament Not Opened',
    );
    expect(compiled.querySelector('.registration-form-card')).toBeNull();
  });

  it('should normalize formSchema to guarantee all core demographic fields (fullName, email, phone, dob) are present and required (VR-REG-002)', () => {
    component.publicForm.set({
      ...mockPublicForm,
      formSchema: {
        templateName: 'Custom Schema',
        sportType: SportType.SAMBO,
        tournamentType: TournamentType.NATIONAL,
        fields: [
          { id: 'fullName', key: 'fullName', label: 'Full Name', type: 'text', required: true },
          { id: 'email', key: 'email', label: 'Email', type: 'email', required: false },
          { id: 'phone', key: 'phone', label: 'Phone', type: 'text', required: false },
          { id: 'belt', key: 'belt', label: 'Belt', type: 'text', required: true },
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
});
