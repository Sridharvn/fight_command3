import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  CreateUserPayload,
  UpdateUserPayload,
  UserResponseModel,
  UsersPaginatedResponse,
  UsersPaginationParams,
} from '../models/user.models';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly api = inject(ApiService);

  getUsers(params: UsersPaginationParams = {}): Observable<UsersPaginatedResponse> {
    const queryParts: string[] = [];
    if (params.page !== undefined) queryParts.push(`page=${params.page}`);
    if (params.limit !== undefined) queryParts.push(`limit=${params.limit}`);
    if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
    if (params.status) queryParts.push(`status=${params.status}`);

    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    return this.api.get<UsersPaginatedResponse>(`/users${queryString}`);
  }

  getUserById(id: number, isActive?: boolean): Observable<UserResponseModel> {
    const query = isActive !== undefined ? `?isActive=${isActive}` : '';
    return this.api.get<UserResponseModel>(`/users/${id}${query}`);
  }

  createUser(payload: CreateUserPayload): Observable<{ message: string }> {
    return this.api.post<{ message: string }>('/users', payload);
  }

  updateUser(id: number, payload: UpdateUserPayload): Observable<{ message: string }> {
    return this.api.put<{ message: string }>(`/users/${id}`, payload);
  }

  deleteUser(id: number): Observable<{ message: string; userId?: number }> {
    return this.api.delete<{ message: string; userId?: number }>(`/users/${id}`);
  }

  reactivateUser(id: number): Observable<{ message: string }> {
    return this.api.patch<{ message: string }>(`/users/${id}/reactivate`);
  }

  updateUserPermissions(id: number, permissions: string[]): Observable<{ message: string }> {
    return this.api.put<{ message: string }>(`/users/${id}/permissions`, { permissions });
  }
}
