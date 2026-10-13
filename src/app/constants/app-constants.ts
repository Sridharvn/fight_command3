import { InjectionToken } from '@angular/core';
import { environment } from '../../environments/environment';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => environment.apiBaseUrl,
});

export const AUTH_STORAGE_KEYS = {
  accessToken: 'ma_access_token',
  refreshToken: 'ma_refresh_token',
  user: 'ma_user_profile',
} as const;
