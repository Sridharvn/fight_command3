import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, of } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { AUTH_STORAGE_KEYS } from '../constants/app-constants';
import { AuthState, LoginCredentials, UserProfile } from '../models/auth.models';

function getInitialState(): AuthState {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return {
      user: null,
      accessToken: null,
      refreshToken: null,
      status: 'unauthenticated',
      error: null,
    };
  }

  const accessToken = localStorage.getItem(AUTH_STORAGE_KEYS.accessToken);
  const refreshToken = localStorage.getItem(AUTH_STORAGE_KEYS.refreshToken);
  let user: UserProfile | null = null;
  const rawUser = localStorage.getItem(AUTH_STORAGE_KEYS.user);
  if (rawUser) {
    try {
      user = JSON.parse(rawUser);
    } catch {
      user = null;
    }
  }

  return {
    user,
    accessToken,
    refreshToken,
    status: accessToken && user ? 'authenticated' : 'unauthenticated',
    error: null,
  };
}

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState<AuthState>(() => getInitialState()),
  withComputed(({ user, accessToken }) => ({
    isAuthenticated: computed(() => !!accessToken() && !!user()),
    userFullName: computed(() => {
      const u = user();
      return u ? `${u.firstName} ${u.lastName}`.trim() : '';
    }),
    userRoleName: computed(() => user()?.role?.name ?? ''),
  })),
  withMethods((store, authService = inject(AuthService)) => ({
    updateTokens(accessToken: string, refreshToken: string): void {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(AUTH_STORAGE_KEYS.accessToken, accessToken);
        localStorage.setItem(AUTH_STORAGE_KEYS.refreshToken, refreshToken);
      }
      patchState(store, {
        accessToken,
        refreshToken,
      });
    },

    setUser(user: UserProfile): void {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(user));
      }
      patchState(store, {
        user,
        status: store.accessToken() ? 'authenticated' : 'unauthenticated',
      });
    },

    logout(): void {
      const currentToken = store.accessToken();
      if (currentToken) {
        authService
          .signOut()
          .pipe(catchError(() => of(undefined)))
          .subscribe();
      }

      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(AUTH_STORAGE_KEYS.accessToken);
        localStorage.removeItem(AUTH_STORAGE_KEYS.refreshToken);
        localStorage.removeItem(AUTH_STORAGE_KEYS.user);
      }

      patchState(store, {
        user: null,
        accessToken: null,
        refreshToken: null,
        status: 'unauthenticated',
        error: null,
      });
    },

    login: rxMethod<LoginCredentials>(
      pipe(
        tap(() => patchState(store, { status: 'loading', error: null })),
        switchMap((credentials) =>
          authService.login(credentials).pipe(
            switchMap((authRes) => {
              if (typeof localStorage !== 'undefined') {
                localStorage.setItem(AUTH_STORAGE_KEYS.accessToken, authRes.accessToken);
                localStorage.setItem(AUTH_STORAGE_KEYS.refreshToken, authRes.refreshToken);
              }
              patchState(store, {
                accessToken: authRes.accessToken,
                refreshToken: authRes.refreshToken,
              });

              return authService.getCurrentUser().pipe(
                tap((user) => {
                  if (typeof localStorage !== 'undefined') {
                    localStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(user));
                  }
                  patchState(store, {
                    user,
                    status: 'authenticated',
                    error: null,
                  });
                }),
              );
            }),
            catchError((err: { error?: { message?: string } }) => {
              const errorMessage =
                err?.error?.message || 'Invalid email or password. Please try again.';
              patchState(store, {
                status: 'error',
                error: errorMessage,
              });
              return of(null);
            }),
          ),
        ),
      ),
    ),
  })),
);
