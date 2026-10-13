import { TestBed } from '@angular/core/testing';
import { AuthStore } from './auth.store';
import { AuthService } from '../services/auth.service';
import { AUTH_STORAGE_KEYS } from '../constants/app-constants';
import { AuthResponse, UserProfile } from '../models/auth.models';
import { of, throwError } from 'rxjs';

describe('AuthStore', () => {
  let store: InstanceType<typeof AuthStore>;
  let authServiceMock: {
    login: ReturnType<typeof vi.fn>;
    getCurrentUser: ReturnType<typeof vi.fn>;
    signOut: ReturnType<typeof vi.fn>;
  };

  const mockUser: UserProfile = {
    id: 1,
    firstName: 'Master',
    lastName: 'Admin',
    email: 'admin@arena.com',
    isActive: true,
    role: { id: 1, name: 'SUPERADMIN' },
  };

  const mockTokens: AuthResponse = {
    id: 1,
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
  };

  beforeEach(() => {
    localStorage.clear();

    authServiceMock = {
      login: vi.fn(),
      getCurrentUser: vi.fn(),
      signOut: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [AuthStore, { provide: AuthService, useValue: authServiceMock }],
    });

    store = TestBed.inject(AuthStore);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize with unauthenticated state when storage is empty', () => {
    expect(store.isAuthenticated()).toBe(false);
    expect(store.accessToken()).toBeNull();
    expect(store.refreshToken()).toBeNull();
    expect(store.user()).toBeNull();
    expect(store.status()).toBe('unauthenticated');
  });

  it('should restore session from localStorage on initialization if present', () => {
    localStorage.setItem(AUTH_STORAGE_KEYS.accessToken, 'cached-access');
    localStorage.setItem(AUTH_STORAGE_KEYS.refreshToken, 'cached-refresh');
    localStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(mockUser));

    // Recreate store
    const newStore = TestBed.runInInjectionContext(() => new (AuthStore as any)());
    expect(newStore.isAuthenticated()).toBe(true);
    expect(newStore.accessToken()).toBe('cached-access');
    expect(newStore.refreshToken()).toBe('cached-refresh');
    expect(newStore.user()).toEqual(mockUser);
  });

  it('should handle successful login', async () => {
    authServiceMock.login.mockReturnValue(of(mockTokens));
    authServiceMock.getCurrentUser.mockReturnValue(of(mockUser));

    store.login({ email: 'admin@arena.com', password: 'password123' });

    // Allow rxMethod observables to complete
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(store.isAuthenticated()).toBe(true);
    expect(store.accessToken()).toBe(mockTokens.accessToken);
    expect(store.refreshToken()).toBe(mockTokens.refreshToken);
    expect(store.user()).toEqual(mockUser);
    expect(store.status()).toBe('authenticated');
    expect(localStorage.getItem(AUTH_STORAGE_KEYS.accessToken)).toBe(mockTokens.accessToken);
  });

  it('should handle login error', async () => {
    authServiceMock.login.mockReturnValue(
      throwError(() => ({ error: { message: 'Invalid credentials' } })),
    );

    store.login({ email: 'admin@arena.com', password: 'wrong' });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(store.isAuthenticated()).toBe(false);
    expect(store.status()).toBe('error');
    expect(store.error()).toBe('Invalid credentials');
  });

  it('should logout and clear state and localStorage', () => {
    localStorage.setItem(AUTH_STORAGE_KEYS.accessToken, 'cached-access');
    authServiceMock.signOut.mockReturnValue(of(undefined));

    store.updateTokens('token', 'refresh');
    store.logout();

    expect(store.isAuthenticated()).toBe(false);
    expect(store.accessToken()).toBeNull();
    expect(store.user()).toBeNull();
    expect(localStorage.getItem(AUTH_STORAGE_KEYS.accessToken)).toBeNull();
  });

  it('should compute userFullName, userEmail, userRoleName, and userInitials', () => {
    localStorage.setItem(AUTH_STORAGE_KEYS.accessToken, 'cached-access');
    localStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(mockUser));

    const newStore = TestBed.runInInjectionContext(() => new (AuthStore as any)());
    expect(newStore.userFullName()).toBe('Master Admin');
    expect(newStore.userEmail()).toBe('admin@arena.com');
    expect(newStore.userRoleName()).toBe('SUPERADMIN');
    expect(newStore.userInitials()).toBe('MA');
  });
});
