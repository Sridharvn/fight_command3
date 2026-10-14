import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  CreateEventDto,
  EventListItem,
  PublicEventForm,
  UpdateEventDto,
} from '../models/event.models';
import { DuplicateGroup, ResolveDuplicateDto } from '../models/registration.models';

export interface EventQueryParams {
  page?: number;
  limit?: number;
  sportType?: number;
  status?: number;
  tournamentType?: number;
  isActive?: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages?: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class EventService {
  private readonly api = inject(ApiService);

  getAllEvents(params?: EventQueryParams): Observable<PaginatedResult<EventListItem>> {
    const cleanParams: Record<string, string | number | boolean> = {};
    if (params) {
      if (params.page !== undefined) cleanParams['page'] = params.page;
      if (params.limit !== undefined) cleanParams['limit'] = params.limit;
      if (params.sportType !== undefined) cleanParams['sportType'] = params.sportType;
      if (params.status !== undefined) cleanParams['status'] = params.status;
      if (params.tournamentType !== undefined) cleanParams['tournamentType'] = params.tournamentType;
      if (params.isActive !== undefined) cleanParams['isActive'] = params.isActive;
    }
    return this.api.get<PaginatedResult<EventListItem>>('/events', { params: cleanParams });
  }

  getEventById(eventId: number): Observable<EventListItem> {
    return this.api.get<EventListItem>(`/events/${eventId}`);
  }

  createEvent(dto: CreateEventDto): Observable<{ message: string; eventId: number }> {
    return this.api.post<{ message: string; eventId: number }>('/events', dto);
  }

  updateEvent(eventId: number, dto: UpdateEventDto): Observable<{ message: string }> {
    return this.api.put<{ message: string }>(`/events/${eventId}`, dto);
  }

  deleteEvent(eventId: number): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/events/${eventId}`);
  }

  getPublicEventForm(eventId: number): Observable<PublicEventForm> {
    return this.api.get<PublicEventForm>(`/events/${eventId}/public-form`);
  }

  getDuplicates(eventId: number): Observable<DuplicateGroup[]> {
    return this.api.get<DuplicateGroup[]>(`/events/${eventId}/duplicates`);
  }

  scanDuplicates(eventId: number): Observable<{ message: string }> {
    return this.api.post<{ message: string }>(`/events/${eventId}/duplicates/scan`);
  }

  resolveDuplicates(
    eventId: number,
    dto: ResolveDuplicateDto,
  ): Observable<{ message: string }> {
    return this.api.post<{ message: string }>(`/events/${eventId}/duplicates/resolve`, dto);
  }
}
