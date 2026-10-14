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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BaseLayout } from '../../layouts/base-layout/base-layout';
import { DynamicFormRendererComponent } from '../../components/dynamic-form-renderer/dynamic-form-renderer';
import { RegistrationStore, RosterTab } from '../../stores/registration.store';
import { EventService } from '../../services/event.service';
import { RegistrationService } from '../../services/registration.service';
import {
  DuplicateAction,
  DuplicateGroup,
  RegistrationDetail,
  RegistrationStatus,
  REGISTRATION_STATUS_LABELS,
  ResolveDuplicateDto,
  SubmitRegistrationDto,
} from '../../models/registration.models';
import {
  EventListItem,
  EVENT_STATUS_LABELS,
  SPORT_TYPE_LABELS,
  TOURNAMENT_TYPE_LABELS,
} from '../../models/event.models';
import { FormDefinition } from '../../models/dynamic-form.models';
import { publicRegistrationRoute } from '../../constants/app-routes';

@Component({
  selector: 'app-event-roster',
  imports: [
    CommonModule,
    BaseLayout,
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    DatePipe,
    DynamicFormRendererComponent,
  ],
  templateUrl: './event-roster.html',
  styleUrl: './event-roster.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventRosterPage implements OnInit {
  readonly route = inject(ActivatedRoute);
  readonly store = inject(RegistrationStore);
  private readonly eventService = inject(EventService);
  private readonly registrationService = inject(RegistrationService);

  readonly event = signal<EventListItem | null>(null);
  readonly isRegisterModalOpen = signal(false);
  readonly viewingRegistration = signal<RegistrationDetail | null>(null);
  readonly toastMessage = signal<string | null>(null);

  // Keep track of which participant is selected to keep in each duplicate group (keyed by index)
  readonly selectedKeepParticipant = signal<Record<number, number>>({});

  readonly eventId = computed(() => {
    const param = this.route.snapshot.paramMap.get('eventId');
    return param ? Number(param) : 0;
  });

  // Convert publicEventForm template to FormDefinition for DynamicFormRendererComponent
  readonly dynamicFormDefinition = computed<FormDefinition | null>(() => {
    const pub = this.store.publicEventForm();
    if (!pub) return null;

    if (pub.formSchema && pub.formSchema.fields) {
      return pub.formSchema;
    }

    // Build FormDefinition from templateFields
    const fields = (pub.templateFields || []).map((tf) => ({
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
      templateName: pub.formTitle || pub.eventName,
      sportType: pub.sportType,
      tournamentType: pub.tournamentType,
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
        ...fields,
      ],
      validations: [],
    };
  });

  ngOnInit(): void {
    const id = this.eventId();
    if (id) {
      this.store.loadRegistrations(id);
      this.store.loadDuplicates(id);
      this.store.loadPublicForm(id);

      this.eventService.getEventById(id).subscribe((ev) => {
        this.event.set(ev);
      });
    }
  }

  onSelectTab(tab: RosterTab): void {
    this.store.setActiveTab(tab);
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.store.setSearchQuery(input.value);
  }

  onToggleSelect(id: number): void {
    this.store.toggleSelect(id);
  }

  onToggleSelectAll(): void {
    const allIds = this.store.filteredRegistrations().map((r) => r.registrationId);
    this.store.toggleSelectAll(allIds);
  }

  onApprove(registrationId: number): void {
    this.store.updateStatus(registrationId, RegistrationStatus.APPROVED, () => {
      this.showToast('Athlete registration approved!');
    });
  }

  onReject(registrationId: number): void {
    this.store.updateStatus(registrationId, RegistrationStatus.REJECTED, () => {
      this.showToast('Athlete registration rejected.');
    });
  }

  onBatchApprove(): void {
    this.store.batchUpdateStatus(RegistrationStatus.APPROVED, () => {
      this.showToast('Selected athletes approved!');
    });
  }

  onBatchReject(): void {
    this.store.batchUpdateStatus(RegistrationStatus.REJECTED, () => {
      this.showToast('Selected athletes rejected.');
    });
  }

  onScanDuplicates(): void {
    this.store.scanDuplicates(() => {
      this.showToast('Duplicate scan completed!');
    });
  }

  selectKeepParticipant(groupIndex: number, participantId: number): void {
    const current = { ...this.selectedKeepParticipant() };
    current[groupIndex] = participantId;
    this.selectedKeepParticipant.set(current);
  }

  onResolveMerge(group: DuplicateGroup, groupIndex: number): void {
    const keepId = this.selectedKeepParticipant()[groupIndex];
    if (!keepId) {
      this.showToast('Please select which athlete to keep.');
      return;
    }

    const dto: ResolveDuplicateDto = {
      participantIds: group.participants.map((p) => p.participantId),
      action: DuplicateAction.MERGE,
      keepParticipantId: keepId,
    };

    this.store.resolveDuplicateGroup(dto, () => {
      this.showToast('Duplicates resolved! Kept participant approved.');
    });
  }

  onResolveFalsePositive(group: DuplicateGroup): void {
    const dto: ResolveDuplicateDto = {
      participantIds: group.participants.map((p) => p.participantId),
      action: DuplicateAction.FALSE_POSITIVE,
    };

    this.store.resolveDuplicateGroup(dto, () => {
      this.showToast('Marked as false positive.');
    });
  }

  openRegisterModal(): void {
    this.isRegisterModalOpen.set(true);
  }

  closeRegisterModal(): void {
    this.isRegisterModalOpen.set(false);
  }

  openDetailsModal(reg: RegistrationDetail): void {
    this.viewingRegistration.set(reg);
  }

  closeDetailsModal(): void {
    this.viewingRegistration.set(null);
  }

  onDynamicFormSubmit(formData: Record<string, any>): void {
    const id = this.eventId();
    if (!id) return;

    const pub = this.store.publicEventForm();
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
      dob: formData['dob'] || undefined,
      responses,
    };

    this.store.submitRegistration(dto, () => {
      this.closeRegisterModal();
      this.showToast('Athlete registered successfully!');
    });
  }

  exportRoster(): void {
    const id = this.eventId();
    if (!id) return;

    this.registrationService.exportRegistrations(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const name = this.event()?.eventName?.replace(/\s+/g, '_') || 'tournament';
        a.download = `${name}_roster_${Date.now()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.showToast('Roster exported successfully!');
      },
      error: () => {
        this.showToast('Failed to export roster.');
      },
    });
  }

  copyPublicLink(): void {
    const id = this.eventId();
    if (!id) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}${publicRegistrationRoute(id)}`;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        this.showToast('Public registration link copied to clipboard!');
      });
    } else {
      this.showToast(`Link: ${shareUrl}`);
    }
  }

  getPublicRegistrationUrl(): string {
    return publicRegistrationRoute(this.eventId());
  }

  getStatusLabel(status: RegistrationStatus): string {
    return REGISTRATION_STATUS_LABELS[status] || `Status #${status}`;
  }

  getStatusClass(status: RegistrationStatus): string {
    switch (status) {
      case RegistrationStatus.PENDING:
        return 'status-pending';
      case RegistrationStatus.APPROVED:
        return 'status-approved';
      case RegistrationStatus.REJECTED:
        return 'status-rejected';
      default:
        return '';
    }
  }

  getEventSportLabel(): string {
    const ev = this.event();
    return ev ? SPORT_TYPE_LABELS[ev.sportType] || `Sport #${ev.sportType}` : '';
  }

  getEventStatusLabel(): string {
    const ev = this.event();
    return ev ? EVENT_STATUS_LABELS[ev.status] || `Status #${ev.status}` : '';
  }

  getEventLevelLabel(): string {
    const ev = this.event();
    return ev ? TOURNAMENT_TYPE_LABELS[ev.tournamentType] || `Level #${ev.tournamentType}` : '';
  }

  isRowSelected(id: number): boolean {
    return this.store.selectedIds().includes(id);
  }

  private showToast(message: string): void {
    this.toastMessage.set(message);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 3500);
  }
}
