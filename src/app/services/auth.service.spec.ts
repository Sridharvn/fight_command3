import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { API_BASE_URL } from '../constants/app-constants';
import { AuthResponse, LoginCredentials, UserProfile } from '../models/auth.models';

describe('AuthService', () => {
  let authService: AuthService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        ApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://localhost:3000' },
      ],
    });

    authService = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should call /auth/login with credentials and return AuthResponse', () => {
    const credentials: LoginCredentials = {
      email: 'user@example.com',
      password: 'password123',
    };
    const mockResponse: AuthResponse = {
      id: 1,
      accessToken: 'access.token.jwt',
      refreshToken: 'refresh.token.jwt',
    };

    authService.login(credentials).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpTesting.expectOne('http://localhost:3000/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(credentials);
    req.flush(mockResponse);
  });

  it('should call /auth/refresh with refresh token in Bearer header', () => {
    const mockResponse: AuthResponse = {
      id: 1,
      accessToken: 'new.access.token',
      refreshToken: 'new.refresh.token',
    };

    authService.refreshToken('my.refresh.token').subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpTesting.expectOne('http://localhost:3000/auth/refresh');
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Authorization')).toBe('Bearer my.refresh.token');
    req.flush(mockResponse);
  });

  it('should call /auth/signOut', () => {
    authService.signOut(1).subscribe();

    const req = httpTesting.expectOne('http://localhost:3000/auth/signOut');
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('should fetch current user profile via /users/current', () => {
    const mockProfile: UserProfile = {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      isActive: true,
      role: { id: 1, name: 'SUPERADMIN' },
    };

    authService.getCurrentUser().subscribe((res) => {
      expect(res).toEqual(mockProfile);
    });

    const req = httpTesting.expectOne('http://localhost:3000/users/current');
    expect(req.request.method).toBe('GET');
    req.flush(mockProfile);
  });
});
