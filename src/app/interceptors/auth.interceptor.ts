import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { AuthStore } from '../stores/auth.store';
import { APP_ROUTES } from '../constants/app-routes';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

function addTokenHeader(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}

function isBypassedEndpoint(url: string): boolean {
  return url.includes('/auth/login') || url.includes('/auth/refresh');
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  const authService = inject(AuthService);
  const router = inject(Router);

  let authReq = req;
  const token = authStore.accessToken();

  if (token && !isBypassedEndpoint(req.url)) {
    authReq = addTokenHeader(req, token);
  }

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !isBypassedEndpoint(req.url)
      ) {
        return handle401Error(req, next, authStore, authService, router);
      }
      return throwError(() => error);
    }),
  );
};

function handle401Error(
  req: HttpRequest<unknown>,
  next: Parameters<HttpInterceptorFn>[1],
  authStore: InstanceType<typeof AuthStore>,
  authService: AuthService,
  router: Router,
): Observable<any> {
  const currentRefreshToken = authStore.refreshToken();

  if (!currentRefreshToken) {
    authStore.logout();
    void router.navigate([APP_ROUTES.login]);
    return throwError(() => new Error('No refresh token available'));
  }

  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken(currentRefreshToken).pipe(
      switchMap((authRes) => {
        isRefreshing = false;
        authStore.updateTokens(authRes.accessToken, authRes.refreshToken);
        refreshTokenSubject.next(authRes.accessToken);
        return next(addTokenHeader(req, authRes.accessToken));
      }),
      catchError((refreshErr) => {
        isRefreshing = false;
        authStore.logout();
        void router.navigate([APP_ROUTES.login]);
        return throwError(() => refreshErr);
      }),
    );
  } else {
    return refreshTokenSubject.pipe(
      filter((token): token is string => token !== null),
      take(1),
      switchMap((jwt) => next(addTokenHeader(req, jwt))),
    );
  }
}
