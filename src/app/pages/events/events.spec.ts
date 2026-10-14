import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventsPage } from './events';
import { EventsStore } from '../../stores/events.store';
import { FormDefinitionService } from '../../services/form-definition.service';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import {
  EventListItem,
  EventStatus,
  SportType,
  TournamentType,
} from '../../models/event.models';

describe('EventsPage', () => {
  let component: EventsPage;
  let fixture: ComponentFixture<EventsPage>;
  let eventsStoreMock: any;
  let formDefinitionServiceMock: any;

  const mockEvents: EventListItem[] = [
    {
      eventId: 101,
      eventName: 'Grand National Sambo Cup',
      sportType: SportType.SAMBO,
      tournamentType: TournamentType.NATIONAL,
      status: EventStatus.DRAFT,
      eventStartDate: '2026-11-01',
      eventEndDate: '2026-11-03',
      location: 'New Delhi Arena',
      createdAt: '2026-10-01',
    },
    {
      eventId: 102,
      eventName: 'Open MMA Championship',
      sportType: SportType.MMA,
      tournamentType: TournamentType.STATE,
      status: EventStatus.REGISTRATION_OPEN,
      eventStartDate: '2026-12-01',
      eventEndDate: '2026-12-02',
      location: 'Mumbai Complex',
      createdAt: '2026-10-02',
    },
  ];

  beforeEach(async () => {
    eventsStoreMock = {
      events: vi.fn().mockReturnValue(mockEvents),
      filteredEvents: vi.fn().mockReturnValue(mockEvents),
      statusTab: vi.fn().mockReturnValue('all'),
      selectedSport: vi.fn().mockReturnValue('all'),
      selectedLevel: vi.fn().mockReturnValue('all'),
      searchQuery: vi.fn().mockReturnValue(''),
      status: vi.fn().mockReturnValue('success'),
      totalEventsCount: vi.fn().mockReturnValue(2),
      draftEventsCount: vi.fn().mockReturnValue(1),
      activeEventsCount: vi.fn().mockReturnValue(1),
      archivedEventsCount: vi.fn().mockReturnValue(0),
      actionLoading: vi.fn().mockReturnValue(false),
      loadEvents: vi.fn(),
      setStatusTab: vi.fn(),
      setSelectedSport: vi.fn(),
      setSelectedLevel: vi.fn(),
      setSearchQuery: vi.fn(),
      createEvent: vi.fn(),
      publishEvent: vi.fn(),
      archiveEvent: vi.fn(),
      deleteEvent: vi.fn(),
    };

    formDefinitionServiceMock = {
      getTemplates: vi.fn().mockReturnValue(of([])),
    };

    await TestBed.configureTestingModule({
      imports: [EventsPage],
      providers: [
        provideRouter([]),
        { provide: EventsStore, useValue: eventsStoreMock },
        { provide: FormDefinitionService, useValue: formDefinitionServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EventsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and render events list inside BaseLayout', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.page-title')?.textContent).toContain('Tournaments');
    expect(compiled.querySelectorAll('.event-card').length).toBe(2);
  });

  it('should filter events when clicking status tabs', () => {
    component.onSelectTab('draft');
    expect(eventsStoreMock.setStatusTab).toHaveBeenCalledWith('draft');
  });

  it('should open and close create event modal', () => {
    expect(component.isCreateModalOpen()).toBe(false);
    component.openCreateModal();
    expect(component.isCreateModalOpen()).toBe(true);
    component.closeCreateModal();
    expect(component.isCreateModalOpen()).toBe(false);
  });

  it('should copy public registration link to clipboard', async () => {
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText: writeTextSpy } });

    component.copyShareLink(101);
    await Promise.resolve();
    expect(writeTextSpy).toHaveBeenCalledWith(expect.stringContaining('/events/101/register'));
    expect(component.toastMessage()).toContain('copied');
  });
});

