import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  RegistrationDetail,
  RegistrationStatus,
  SubmitRegistrationDto,
  BatchUpdateRegistrationStatusDto,
  UpdateRegistrationStatusDto,
} from '../models/registration.models';
import { PaginatedResult } from './event.service';

export interface RegistrationQueryParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class RegistrationService {
  private readonly api = inject(ApiService);

  getRegistrations(
    eventId: number,
    pagination: RegistrationQueryParams = { page: 1, limit: 10 },
    filters: Record<string, any> = {},
  ): Observable<PaginatedResult<RegistrationDetail>> {
    const params: Record<string, any> = {
      page: pagination.page ?? 1,
      limit: pagination.limit ?? 10,
      ...filters,
    };
    if (pagination.isActive !== undefined) {
      params['isActive'] = pagination.isActive;
    }
    return this.api.get<PaginatedResult<RegistrationDetail>>(`/events/${eventId}/registrations`, {
      params,
    });
  }

  getRegistrationById(eventId: number, registrationId: number): Observable<RegistrationDetail> {
    return this.api.get<RegistrationDetail>(`/events/${eventId}/registrations/${registrationId}`);
  }

  submitRegistration(
    eventId: number,
    dto: SubmitRegistrationDto,
  ): Observable<{ message: string; registrationId: number }> {
    return this.api.post<{ message: string; registrationId: number }>(
      `/events/${eventId}/registrations`,
      dto,
    );
  }

  updateStatus(
    eventId: number,
    registrationId: number,
    status: RegistrationStatus,
  ): Observable<{ message: string }> {
    const dto: UpdateRegistrationStatusDto = { status };
    return this.api.put<{ message: string }>(
      `/events/${eventId}/registrations/${registrationId}/status`,
      dto,
    );
  }

  batchUpdateStatus(
    eventId: number,
    registrationIds: number[],
    status: RegistrationStatus,
  ): Observable<{ message: string; updatedCount: number }> {
    const dto: BatchUpdateRegistrationStatusDto = { registrationIds, status };
    return this.api.put<{ message: string; updatedCount: number }>(
      `/events/${eventId}/registrations/status/batch`,
      dto,
    );
  }

  exportRegistrations(eventId: number): Observable<Blob> {
    return this.api.getBlob(`/events/${eventId}/registrations/export`);
  }
}
