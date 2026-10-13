import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { API_BASE_URL } from '../constants/app-constants';

describe('ApiService', () => {
  let service: ApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://localhost:3000' },
      ],
    });
    service = TestBed.inject(ApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should prepend base URL to GET request', () => {
    service.get<{ message: string }>('/users/current').subscribe((res) => {
      expect(res.message).toBe('ok');
    });

    const req = httpTesting.expectOne('http://localhost:3000/users/current');
    expect(req.request.method).toBe('GET');
    req.flush({ message: 'ok' });
  });

  it('should send POST request with body', () => {
    const payload = { email: 'test@example.com' };
    service.post<{ status: string }>('/auth/login', payload).subscribe((res) => {
      expect(res.status).toBe('success');
    });

    const req = httpTesting.expectOne('http://localhost:3000/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ status: 'success' });
  });

  it('should support full URL without double prepending', () => {
    service.get<{ data: string }>('http://external.api/data').subscribe((res) => {
      expect(res.data).toBe('test');
    });

    const req = httpTesting.expectOne('http://external.api/data');
    expect(req.request.method).toBe('GET');
    req.flush({ data: 'test' });
  });
});
