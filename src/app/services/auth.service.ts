import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AuthResponse, LoginCredentials, UserProfile } from '../models/auth.models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly api = inject(ApiService);

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/login', credentials);
  }

  refreshToken(refreshToken: string): Observable<AuthResponse> {
    return this.api.post<AuthResponse>(
      '/auth/refresh',
      {},
      {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      },
    );
  }

  signOut(userId?: number): Observable<void> {
    return this.api.post<void>('/auth/signOut', { userId });
  }

  getCurrentUser(): Observable<UserProfile> {
    return this.api.get<UserProfile>('/users/current');
  }
}
