import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthStore } from '../stores/auth.store';
import { signal } from '@angular/core';

describe('authGuard', () => {
  let routerMock: {
    createUrlTree: ReturnType<typeof vi.fn>;
  };
  let isAuthenticatedSignal = signal(false);

  beforeEach(() => {
    isAuthenticatedSignal.set(false);
    routerMock = {
      createUrlTree: vi.fn((commands: unknown[], extras: unknown) => ({ commands, extras })),
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

  it('should allow navigation when authenticated', () => {
    isAuthenticatedSignal.set(true);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/events' } as RouterStateSnapshot),
    );

    expect(result).toBe(true);
  });

  it('should redirect to /login with returnUrl when unauthenticated', () => {
    isAuthenticatedSignal.set(false);

    TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/events' } as RouterStateSnapshot),
    );

    expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/events' },
    });
  });
});
