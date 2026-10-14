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
  PublicEventForm,
  SPORT_TYPE_LABELS,
  TOURNAMENT_TYPE_LABELS,
} from '../../models/event.models';
import { SubmitRegistrationDto } from '../../models/registration.models';
import { FormDefinition } from '../../models/dynamic-form.models';

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

  readonly isRegistrationOpen = computed(() => {
    const form = this.publicForm();
    if (!form) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (form.registrationOpenDate) {
      const open = new Date(form.registrationOpenDate);
      open.setHours(0, 0, 0, 0);
      if (today < open) return false;
    }

    if (form.registrationCloseDate) {
      const close = new Date(form.registrationCloseDate);
      close.setHours(23, 59, 59, 999);
      if (today > close) return false;
    }

    return true;
  });

  readonly dynamicFormDefinition = computed<FormDefinition | null>(() => {
    const form = this.publicForm();
    if (!form) return null;

    if (form.formSchema && form.formSchema.fields && form.formSchema.fields.length > 0 && form.formSchema.fields[0]?.key) {
      return form.formSchema;
    }

    // Build fields from templateFields
    const customFields = (form.templateFields || []).map((tf) => ({
      id: String(tf.templateFieldId),
      key: tf.fieldName,
      label: tf.fieldLabel,
      type: (tf.fieldType || 'text') as any,
      required: tf.isRequired,
      options: tf.fieldOptions?.options
        ? tf.fieldOptions.options.map((opt: string) => ({ label: opt, value: opt }))
        : undefined,
      helpText: tf.helpText || undefined,
      defaultValue: tf.defaultValue || undefined,
    }));

    return {
      templateName: form.formTitle || form.eventName,
      sportType: form.sportType,
      tournamentType: form.tournamentType,
      fields: [
        {
          id: 'fullName',
          key: 'fullName',
          label: 'Athlete Full Name',
          type: 'text',
          required: true,
          columnSpan: 1,
        },
        {
          id: 'email',
          key: 'email',
          label: 'Email Address',
          type: 'email',
          required: false,
          columnSpan: 1,
        },
        {
          id: 'phone',
          key: 'phone',
          label: 'Phone Number',
          type: 'text',
          required: false,
          columnSpan: 1,
        },
        {
          id: 'dob',
          key: 'dob',
          label: 'Date of Birth',
          type: 'date',
          required: false,
          columnSpan: 1,
        },
        ...customFields,
      ],
      validations: [],
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
        if (formData[tf.fieldName] !== undefined) {
          responses.push({
            templateFieldId: tf.templateFieldId,
            value: String(formData[tf.fieldName] ?? ''),
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
    return form ? TOURNAMENT_TYPE_LABELS[form.tournamentType] || `Level #${form.tournamentType}` : '';
  }
}
