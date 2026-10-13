import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { guestGuard } from './guest.guard';
import { AuthStore } from '../stores/auth.store';
import { signal } from '@angular/core';

describe('guestGuard', () => {
  let routerMock: {
    createUrlTree: ReturnType<typeof vi.fn>;
  };
  let isAuthenticatedSignal = signal(false);

  beforeEach(() => {
    isAuthenticatedSignal.set(false);
    routerMock = {
      createUrlTree: vi.fn((commands: unknown[]) => ({ commands })),
    };

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthStore,
          useValue: {
            isAuthenticated: isAuthenticatedSignal,
          },
        },
        { provide: Router, useValue: routerMock },
      ],
    });
  });

  it('should allow navigation to login when unauthenticated', () => {
    isAuthenticatedSignal.set(false);

    const result = TestBed.runInInjectionContext(() =>
      guestGuard({} as ActivatedRouteSnapshot, { url: '/login' } as RouterStateSnapshot),
    );

    expect(result).toBe(true);
  });

  it('should redirect authenticated user away from login to root', () => {
    isAuthenticatedSignal.set(true);

    TestBed.runInInjectionContext(() =>
      guestGuard({} as ActivatedRouteSnapshot, { url: '/login' } as RouterStateSnapshot),
    );

    expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/']);
  });
});
