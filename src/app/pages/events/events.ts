import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BaseLayout } from '../../layouts/base-layout/base-layout';
import { EventsStore, EventStatusTab } from '../../stores/events.store';
import { FormDefinitionService } from '../../services/form-definition.service';
import { FormTemplate } from '../../models/form-definition.models';
import {
  EventListItem,
  EventStatus,
  EVENT_STATUS_LABELS,
  SportType,
  SPORT_TYPE_LABELS,
  TournamentType,
  TOURNAMENT_TYPE_LABELS,
} from '../../models/event.models';
import { publicRegistrationRoute } from '../../constants/app-routes';

import { EventService } from '../../services/event.service';

@Component({
  selector: 'app-events',
  imports: [CommonModule, BaseLayout, RouterLink, ReactiveFormsModule, DatePipe],
  templateUrl: './events.html',
  styleUrl: './events.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventsPage implements OnInit {
  readonly store = inject(EventsStore);
  private readonly eventService = inject(EventService);
  private readonly formDefinitionService = inject(FormDefinitionService);
  private readonly fb = inject(FormBuilder);

  readonly isCreateModalOpen = signal(false);
  readonly isEditModalOpen = signal(false);
  readonly editingEventId = signal<number | null>(null);
  readonly isDeleteModalOpen = signal(false);
  readonly deletingEvent = signal<EventListItem | null>(null);
  readonly templates = signal<FormTemplate[]>([]);
  readonly toastMessage = signal<string | null>(null);

  readonly sports = Object.entries(SPORT_TYPE_LABELS).map(([k, v]) => ({
    id: Number(k),
    label: v,
  }));
  readonly levels = Object.entries(TOURNAMENT_TYPE_LABELS).map(([k, v]) => ({
    id: Number(k),
    label: v,
  }));
  readonly statusOptions = Object.entries(EVENT_STATUS_LABELS).map(([k, v]) => ({
    id: Number(k),
    label: v,
  }));

  readonly createForm: FormGroup = this.fb.group({
    eventName: ['', [Validators.required, Validators.minLength(3)]],
    sportType: [SportType.SAMBO, Validators.required],
    tournamentType: [TournamentType.NATIONAL, Validators.required],
    eventStartDate: [''],
    eventEndDate: [''],
    location: [''],
    posterImageUrl: [''],
    templateId: [''],
    registrationOpenDate: [''],
    registrationCloseDate: [''],
    formTitle: [''],
    formDescription: [''],
  });

  readonly editForm: FormGroup = this.fb.group({
    eventName: ['', [Validators.required, Validators.minLength(3)]],
    sportType: [SportType.SAMBO, Validators.required],
    tournamentType: [TournamentType.NATIONAL, Validators.required],
    status: [EventStatus.DRAFT, Validators.required],
    eventStartDate: [''],
    eventEndDate: [''],
    location: [''],
    posterImageUrl: [''],
    templateId: [''],
    registrationOpenDate: [''],
    registrationCloseDate: [''],
    formTitle: [''],
    formDescription: [''],
  });

  ngOnInit(): void {
    this.store.loadEvents();
    this.formDefinitionService.getTemplates().subscribe((res: any) => {
      const list = Array.isArray(res) ? res : res?.data || [];
      this.templates.set(list);
    });
  }

  onSelectTab(tab: EventStatusTab): void {
    this.store.setStatusTab(tab);
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.store.setSearchQuery(input.value);
  }

  onSportChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const val = select.value === 'all' ? 'all' : Number(select.value);
    this.store.setSelectedSport(val);
  }

  onLevelChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const val = select.value === 'all' ? 'all' : Number(select.value);
    this.store.setSelectedLevel(val);
  }

  openCreateModal(): void {
    this.createForm.reset({
      sportType: SportType.SAMBO,
      tournamentType: TournamentType.NATIONAL,
    });
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  submitCreateEvent(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const val = this.createForm.value;
    const payload = {
      eventName: val.eventName,
      sportType: Number(val.sportType),
      tournamentType: Number(val.tournamentType),
      eventStartDate: val.eventStartDate || undefined,
      eventEndDate: val.eventEndDate || undefined,
      location: val.location || undefined,
      posterImageUrl: val.posterImageUrl || undefined,
      templateId: val.templateId ? Number(val.templateId) : undefined,
      registrationOpenDate: val.registrationOpenDate || undefined,
      registrationCloseDate: val.registrationCloseDate || undefined,
      formTitle: val.formTitle || undefined,
      formDescription: val.formDescription || undefined,
    };

    this.store.createEvent(payload, () => {
      this.closeCreateModal();
      this.showToast('Tournament created successfully!');
    });
  }

  publishEvent(eventId: number): void {
    this.store.publishEvent(eventId, () => {
      this.showToast('Tournament published and registrations opened!');
    });
  }

  archiveEvent(eventId: number): void {
    this.store.archiveEvent(eventId, () => {
      this.showToast('Tournament marked as completed.');
    });
  }

  unarchiveEvent(eventId: number): void {
    this.store.unarchiveEvent(eventId, () => {
      this.showToast('Tournament unarchived and registrations reopened!');
    });
  }

  openEditModal(event: EventListItem): void {
    this.editingEventId.set(event.eventId);
    const regForm = event.registrationForm;
    this.editForm.reset({
      eventName: event.eventName,
      sportType: event.sportType,
      tournamentType: event.tournamentType,
      status: event.status,
      eventStartDate: event.eventStartDate ? String(event.eventStartDate).slice(0, 10) : '',
      eventEndDate: event.eventEndDate ? String(event.eventEndDate).slice(0, 10) : '',
      location: event.location || '',
      posterImageUrl: event.posterImageUrl || '',
      templateId: regForm?.templateId ? String(regForm.templateId) : '',
      registrationOpenDate: regForm?.registrationOpenDate
        ? String(regForm.registrationOpenDate).slice(0, 10)
        : '',
      registrationCloseDate: regForm?.registrationCloseDate
        ? String(regForm.registrationCloseDate).slice(0, 10)
        : '',
      formTitle: regForm?.formTitle || '',
      formDescription: regForm?.formDescription || '',
    });
    this.isEditModalOpen.set(true);
  }

  closeEditModal(): void {
    this.isEditModalOpen.set(false);
    this.editingEventId.set(null);
  }

  submitEditEvent(): void {
    const eventId = this.editingEventId();
    if (!eventId || this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const val = this.editForm.value;
    const eventPayload: any = {
      eventName: val.eventName,
      sportType: Number(val.sportType),
      tournamentType: Number(val.tournamentType),
      status: Number(val.status),
      eventStartDate: val.eventStartDate || undefined,
      eventEndDate: val.eventEndDate || undefined,
      location: val.location || undefined,
      posterImageUrl: val.posterImageUrl || undefined,
    };

    const regFormPayload: any = {
      templateId: val.templateId ? Number(val.templateId) : null,
      registrationOpenDate: val.registrationOpenDate || undefined,
      registrationCloseDate: val.registrationCloseDate || undefined,
      formTitle: val.formTitle || undefined,
      formDescription: val.formDescription || undefined,
    };

    this.store.updateEvent(eventId, eventPayload, () => {
      this.eventService.updateRegistrationForm(eventId, regFormPayload).subscribe({
        next: () => {
          this.closeEditModal();
          this.store.loadEvents();
          this.showToast('Tournament updated successfully!');
        },
        error: () => {
          this.closeEditModal();
          this.store.loadEvents();
          this.showToast('Tournament updated successfully!');
        },
      });
    });
  }

  confirmDeleteEvent(event: EventListItem): void {
    this.deletingEvent.set(event);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.deletingEvent.set(null);
  }

  submitDeleteEvent(): void {
    const event = this.deletingEvent();
    if (!event) return;

    this.store.deleteEvent(event.eventId, () => {
      this.closeDeleteModal();
      this.showToast('Tournament deleted successfully');
    });
  }

  isArchived(status: EventStatus): boolean {
    return status === EventStatus.COMPLETED || status === EventStatus.CANCELLED;
  }

  copyShareLink(eventId: number): void {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}${publicRegistrationRoute(eventId)}`;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        this.showToast('Public registration link copied to clipboard!');
      });
    } else {
      this.showToast(`Link: ${shareUrl}`);
    }
  }

  exportDirectoryCsv(): void {
    const events = this.store.filteredEvents();
    if (events.length === 0) return;

    const headers = [
      'Event ID',
      'Name',
      'Sport',
      'Level',
      'Status',
      'Location',
      'Start Date',
      'End Date',
    ];
    const rows = events.map((e) => [
      e.eventId,
      `"${e.eventName.replace(/"/g, '""')}"`,
      SPORT_TYPE_LABELS[e.sportType] || e.sportType,
      TOURNAMENT_TYPE_LABELS[e.tournamentType] || e.tournamentType,
      EVENT_STATUS_LABELS[e.status] || e.status,
      `"${(e.location || '').replace(/"/g, '""')}"`,
      e.eventStartDate || '',
      e.eventEndDate || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tournaments_directory_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  getSportLabel(sportType: SportType): string {
    return SPORT_TYPE_LABELS[sportType] || `Sport #${sportType}`;
  }

  getLevelLabel(tournamentType: TournamentType): string {
    return TOURNAMENT_TYPE_LABELS[tournamentType] || `Level #${tournamentType}`;
  }

  getStatusLabel(status: EventStatus): string {
    return EVENT_STATUS_LABELS[status] || `Status #${status}`;
  }

  getStatusClass(status: EventStatus): string {
    switch (status) {
      case EventStatus.DRAFT:
        return 'status-draft';
      case EventStatus.PUBLISHED:
      case EventStatus.REGISTRATION_OPEN:
        return 'status-open';
      case EventStatus.REGISTRATION_CLOSED:
        return 'status-closed';
      case EventStatus.COMPLETED:
        return 'status-completed';
      case EventStatus.CANCELLED:
        return 'status-cancelled';
      default:
        return '';
    }
  }

  isDraft(status: EventStatus): boolean {
    return status === EventStatus.DRAFT;
  }

  isOpen(status: EventStatus): boolean {
    return status === EventStatus.REGISTRATION_OPEN || status === EventStatus.PUBLISHED;
  }

  private showToast(message: string): void {
    this.toastMessage.set(message);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 3500);
  }
}
