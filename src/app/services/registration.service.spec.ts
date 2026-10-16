import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RegistrationService } from './registration.service';
import { ApiService } from './api.service';
import { of } from 'rxjs';
import {
  RegistrationDetail,
  RegistrationStatus,
  SubmitRegistrationDto,
} from '../models/registration.models';

describe('RegistrationService', () => {
  let service: RegistrationService;
  let apiServiceMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    getBlob: ReturnType<typeof vi.fn>;
  };

  const mockRegistration: RegistrationDetail = {
    registrationId: 101,
    participantId: 55,
    fullName: 'Fighter John',
    email: 'john@example.com',
    phone: '+919876543210',
    status: RegistrationStatus.PENDING,
    registrationDate: new Date().toISOString(),
    responses: [],
  };

  beforeEach(() => {
    apiServiceMock = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      getBlob: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [RegistrationService, { provide: ApiService, useValue: apiServiceMock }],
    });

    service = TestBed.inject(RegistrationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call GET /events/:eventId/registrations with pagination and filters in getRegistrations', () => {
    apiServiceMock.get.mockReturnValue(of({ data: [mockRegistration], meta: { total: 1 } }));

    service
      .getRegistrations(1, { page: 1, limit: 10 }, { status: RegistrationStatus.PENDING })
      .subscribe((res) => {
        expect(res.data).toEqual([mockRegistration]);
      });

    expect(apiServiceMock.get).toHaveBeenCalledWith('/events/1/registrations', {
      params: expect.objectContaining({ page: 1, limit: 10, status: RegistrationStatus.PENDING }),
    });
  });

  it('should call GET /events/:eventId/registrations/:registrationId in getRegistrationById', () => {
    apiServiceMock.get.mockReturnValue(of(mockRegistration));

    service.getRegistrationById(1, 101).subscribe((res) => {
      expect(res).toEqual(mockRegistration);
    });

    expect(apiServiceMock.get).toHaveBeenCalledWith('/events/1/registrations/101');
  });

  it('should call POST /events/:eventId/registrations in submitRegistration', () => {
    const dto: SubmitRegistrationDto = {
      fullName: 'New Athlete',
      email: 'athlete@example.com',
      responses: [{ templateFieldId: 1, value: 'Gold' }],
    };
    apiServiceMock.post.mockReturnValue(of({ message: 'Submitted', registrationId: 102 }));

    service.submitRegistration(1, dto).subscribe((res) => {
      expect(res.registrationId).toBe(102);
    });

    expect(apiServiceMock.post).toHaveBeenCalledWith('/events/1/registrations', dto);
  });

  it('should call PUT /events/:eventId/registrations/:registrationId/status in updateStatus', () => {
    apiServiceMock.put.mockReturnValue(of({ message: 'Status updated' }));

    service.updateStatus(1, 101, RegistrationStatus.APPROVED).subscribe((res) => {
      expect(res.message).toBe('Status updated');
    });

    expect(apiServiceMock.put).toHaveBeenCalledWith('/events/1/registrations/101/status', {
      status: RegistrationStatus.APPROVED,
    });
  });

  it('should call PUT /events/:eventId/registrations/status/batch in batchUpdateStatus', () => {
    apiServiceMock.put.mockReturnValue(of({ message: 'Batch updated', updatedCount: 2 }));

    service.batchUpdateStatus(1, [101, 102], RegistrationStatus.APPROVED).subscribe((res) => {
      expect(res.updatedCount).toBe(2);
    });

    expect(apiServiceMock.put).toHaveBeenCalledWith('/events/1/registrations/status/batch', {
      registrationIds: [101, 102],
      status: RegistrationStatus.APPROVED,
    });
  });

  it('should call getBlob on /events/:eventId/registrations/export in exportRegistrations', () => {
    const mockBlob = new Blob(['sample-data'], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    apiServiceMock.getBlob.mockReturnValue(of(mockBlob));

    service.exportRegistrations(1).subscribe((blob) => {
      expect(blob).toEqual(mockBlob);
    });

    expect(apiServiceMock.getBlob).toHaveBeenCalledWith('/events/1/registrations/export');
  });
});
