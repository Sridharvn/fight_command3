import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { AuthStore } from '../stores/auth.store';
import { API_BASE_URL } from '../constants/app-constants';
import { of, throwError } from 'rxjs';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpTesting: HttpTestingController;
  let authServiceMock: {
    refreshToken: ReturnType<typeof vi.fn>;
  };
  let authStoreMock: {
    accessToken: ReturnType<typeof vi.fn>;
    refreshToken: ReturnType<typeof vi.fn>;
    updateTokens: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };
  let routerMock: {
    navigate: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    authServiceMock = {
      refreshToken: vi.fn(),
    };

    authStoreMock = {
      accessToken: vi.fn(() => 'initial-access-token'),
      refreshToken: vi.fn(() => 'initial-refresh-token'),
      updateTokens: vi.fn(),
      logout: vi.fn(),
    };

    routerMock = {
      navigate: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceMock },
        { provide: AuthStore, useValue: authStoreMock },
        { provide: Router, useValue: routerMock },
        { provide: API_BASE_URL, useValue: 'http://localhost:3000' },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should add Authorization Bearer header to standard requests', () => {
    httpClient.get('http://localhost:3000/users/current').subscribe();

    const req = httpTesting.expectOne('http://localhost:3000/users/current');
    expect(req.request.headers.get('Authorization')).toBe('Bearer initial-access-token');
    req.flush({});
  });

  it('should NOT add Authorization header to login or refresh endpoints', () => {
    httpClient.post('http://localhost:3000/auth/login', {}).subscribe();

    const req = httpTesting.expectOne('http://localhost:3000/auth/login');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should refresh token on 401 error and retry the original request', () => {
    authServiceMock.refreshToken.mockReturnValue(
      of({
        id: 1,
        accessToken: 'new-refreshed-token',
        refreshToken: 'new-refresh-token',
      }),
    );

    httpClient.get('http://localhost:3000/events').subscribe((res) => {
      expect(res).toEqual({ data: 'events-list' });
    });

    // Initial request fails with 401
    const firstReq = httpTesting.expectOne('http://localhost:3000/events');
    firstReq.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    // Expect authService.refreshToken to have been called
    expect(authServiceMock.refreshToken).toHaveBeenCalledWith('initial-refresh-token');
    expect(authStoreMock.updateTokens).toHaveBeenCalledWith(
      'new-refreshed-token',
      'new-refresh-token',
    );

    // The interceptor retries the request with the new access token
    const retriedReq = httpTesting.expectOne('http://localhost:3000/events');
    expect(retriedReq.request.headers.get('Authorization')).toBe('Bearer new-refreshed-token');
    retriedReq.flush({ data: 'events-list' });
  });

  it('should logout and redirect to login if refresh fails', () => {
    authServiceMock.refreshToken.mockReturnValue(throwError(() => new Error('Refresh failed')));

    httpClient.get('http://localhost:3000/events').subscribe({
      error: (err) => {
        expect(err).toBeDefined();
      },
    });

    const req = httpTesting.expectOne('http://localhost:3000/events');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(authStoreMock.logout).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  });
});
