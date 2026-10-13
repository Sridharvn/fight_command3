import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { CreateRolePayload, RoleItem, UpdateRolePayload } from '../models/role.models';

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  private readonly api = inject(ApiService);

  getRoles(): Observable<RoleItem[]> {
    return this.api.get<RoleItem[]>('/roles');
  }

  getAvailablePermissions(): Observable<string[]> {
    return this.api.get<string[]>('/roles/permissions/available');
  }

  createRole(payload: CreateRolePayload): Observable<RoleItem> {
    return this.api.post<RoleItem>('/roles', payload);
  }

  updateRole(id: number, payload: UpdateRolePayload): Observable<RoleItem> {
    return this.api.put<RoleItem>(`/roles/${id}`, payload);
  }

  deleteRole(id: number): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/roles/${id}`);
  }
}
