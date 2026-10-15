import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DynamicFormRendererComponent } from '../../components/dynamic-form-renderer/dynamic-form-renderer';
import { EventService } from '../../services/event.service';
import { RegistrationService } from '../../services/registration.service';
import {
  EventStatus,
  PublicEventForm,
  SPORT_TYPE_LABELS,
  TOURNAMENT_TYPE_LABELS,
} from '../../models/event.models';
import { SubmitRegistrationDto } from '../../models/registration.models';
import { FormDefinition, FormField } from '../../models/dynamic-form.models';

@Component({
  selector: 'app-public-registration',
  imports: [CommonModule, RouterLink, DatePipe, DynamicFormRendererComponent],
  templateUrl: './public-registration.html',
  styleUrl: './public-registration.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicRegistrationPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly eventService = inject(EventService);
  private readonly registrationService = inject(RegistrationService);

  readonly publicForm = signal<PublicEventForm | null>(null);
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly isSubmitted = signal(false);
  readonly submittedRegistrationId = signal<number | null>(null);
  readonly submittedAthleteName = signal<string>('');

  readonly eventId = computed(() => {
    const param = this.route.snapshot.paramMap.get('eventId');
    return param ? Number(param) : 0;
  });

  readonly isRegistrationClosed = computed(() => {
    const form = this.publicForm();
    if (!form) return false;

    // Archived, completed, cancelled, or explicitly closed tournaments
    if (
      form.status === EventStatus.COMPLETED ||
      form.status === EventStatus.CANCELLED ||
      form.status === EventStatus.REGISTRATION_CLOSED
    ) {
      return true;
    }

    // Past registration close date
    if (form.registrationCloseDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const close = new Date(form.registrationCloseDate);
      close.setHours(23, 59, 59, 999);
      if (today > close) return true;
    }

    return false;
  });

  readonly isTournamentNotOpened = computed(() => {
    const form = this.publicForm();
    if (!form) return false;

    // If already closed, closed takes precedence
    if (this.isRegistrationClosed()) return false;

    // Draft tournament is not opened
    if (form.status === EventStatus.DRAFT) {
      return true;
    }

    // Before registration open date
    if (form.registrationOpenDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const open = new Date(form.registrationOpenDate);
      open.setHours(0, 0, 0, 0);
      if (today < open) return true;
    }

    // Unopened if status is neither REGISTRATION_OPEN nor PUBLISHED
    if (
      form.status !== undefined &&
      form.status !== EventStatus.REGISTRATION_OPEN &&
      form.status !== EventStatus.PUBLISHED
    ) {
      return true;
    }

    return false;
  });

  readonly isRegistrationOpen = computed(() => {
    const form = this.publicForm();
    if (!form) return false;

    return !this.isRegistrationClosed() && !this.isTournamentNotOpened();
  });

  readonly dynamicFormDefinition = computed<FormDefinition | null>(() => {
    const form = this.publicForm();
    if (!form) return null;

    let baseDefinition: FormDefinition;

    if (
      form.formSchema &&
      form.formSchema.fields &&
      form.formSchema.fields.length > 0 &&
      form.formSchema.fields[0]?.key
    ) {
      baseDefinition = {
        ...form.formSchema,
        fields: [...form.formSchema.fields],
      };
    } else {
      // Build fields from templateFields
      const customFields = (form.templateFields || [])
        .filter(
          (tf) => !['fullName', 'email', 'phone', 'dob', 'date_of_birth'].includes(tf.fieldName),
        )
        .map((tf) => ({
          id: String(tf.templateFieldId),
          key: tf.fieldName,
          label: tf.fieldLabel,
          type: (tf.fieldType || 'text') as any,
          required: tf.isRequired,
          options: tf.fieldOptions?.options
            ? tf.fieldOptions.options.map((opt: any) =>
                typeof opt === 'string'
                  ? { label: opt, value: opt }
                  : { label: opt.label || opt.value, value: opt.value || opt.label },
              )
            : undefined,
          helpText: tf.helpText || undefined,
          defaultValue: tf.defaultValue || undefined,
        }));

      baseDefinition = {
        templateName: form.formTitle || form.eventName,
        sportType: form.sportType,
        tournamentType: form.tournamentType,
        fields: customFields,
        validations: [],
      };
    }

    // Demographic normalization (VR-REG-002):
    // Ensure fullName, email, phone, and dob exist and are required.
    const fields = [...baseDefinition.fields];

    const ensureDemographic = (
      key: string,
      label: string,
      type: FormField['type'],
      altKeys: string[] = [],
    ) => {
      let idx = fields.findIndex((f) => f.key === key || altKeys.includes(f.key));
      if (idx === -1) {
        idx = fields.findIndex((f) => f.label?.trim().toLowerCase() === label.trim().toLowerCase());
      }

      if (idx >= 0) {
        fields[idx] = {
          ...fields[idx],
          required: true,
          type: type || fields[idx].type,
        };
      } else {
        fields.unshift({
          id: key,
          key: key,
          label: label,
          type: type,
          required: true,
          columnSpan: 1,
        });
      }
    };

    ensureDemographic('dob', 'Date of Birth', 'date', ['date_of_birth', 'dateOfBirth']);
    ensureDemographic('phone', 'Phone Number', 'text', ['contact_number', 'phoneNumber']);
    ensureDemographic('email', 'Email Address', 'email', ['emailAddress']);
    ensureDemographic('fullName', 'Athlete Full Name', 'text', ['athlete_name', 'name']);

    return {
      ...baseDefinition,
      fields,
    };
  });

  ngOnInit(): void {
    const id = this.eventId();
    if (id) {
      this.loadEventData(id);
    } else {
      this.isLoading.set(false);
      this.errorMessage.set('Invalid tournament link.');
    }
  }

  loadEventData(eventId: number): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.eventService.getPublicEventForm(eventId).subscribe({
      next: (data) => {
        this.publicForm.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err.error?.message || 'Unable to load tournament registration details.';
        this.errorMessage.set(msg);
      },
    });
  }

  onFormSubmit(formData: Record<string, any>): void {
    const id = this.eventId();
    if (!id) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const pub = this.publicForm();
    const responses: { templateFieldId: number; value?: string | null }[] = [];

    if (pub && pub.templateFields) {
      for (const tf of pub.templateFields) {
        let val: any = undefined;
        if (formData[tf.fieldName] !== undefined) {
          val = formData[tf.fieldName];
        } else if (tf.customFieldName && formData[tf.customFieldName] !== undefined) {
          val = formData[tf.customFieldName];
        } else if (formData[String(tf.templateFieldId)] !== undefined) {
          val = formData[String(tf.templateFieldId)];
        } else if (pub.formSchema?.fields) {
          const matchingField = pub.formSchema.fields.find(
            (f: any) =>
              f.key === tf.fieldName ||
              f.key === tf.customFieldName ||
              f.label?.toLowerCase() === tf.fieldLabel?.toLowerCase(),
          );
          if (matchingField && formData[matchingField.key || matchingField.id] !== undefined) {
            val = formData[matchingField.key || matchingField.id];
          }
        }

        if (val !== undefined && val !== null) {
          responses.push({
            templateFieldId: tf.templateFieldId,
            value: typeof val === 'boolean' ? (val ? 'true' : 'false') : String(val),
          });
        }
      }
    }

    const dto: SubmitRegistrationDto = {
      fullName: formData['fullName'] || 'Unknown Athlete',
      email: formData['email'] || undefined,
      phone: formData['phone'] || undefined,
      dob: formData['dob'] || formData['date_of_birth'] || undefined,
      responses,
    };

    this.registrationService.submitRegistration(id, dto).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.submittedRegistrationId.set(res.registrationId);
        this.submittedAthleteName.set(dto.fullName);
        this.isSubmitted.set(true);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg =
          err.error?.message ||
          (err.status === 409
            ? 'This participant has already registered for this event.'
            : 'Registration submission failed. Please try again.');
        this.errorMessage.set(msg);
      },
    });
  }

  resetForm(): void {
    this.isSubmitted.set(false);
    this.submittedRegistrationId.set(null);
    this.submittedAthleteName.set('');
    this.errorMessage.set(null);
  }

  getSportLabel(): string {
    const form = this.publicForm();
    return form ? SPORT_TYPE_LABELS[form.sportType] || `Sport #${form.sportType}` : '';
  }

  getLevelLabel(): string {
    const form = this.publicForm();
    return form
      ? TOURNAMENT_TYPE_LABELS[form.tournamentType] || `Level #${form.tournamentType}`
      : '';
  }
}
