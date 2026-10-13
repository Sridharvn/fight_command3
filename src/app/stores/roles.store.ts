import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, of } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { RoleService } from '../services/role.service';
import {
  CreateRolePayload,
  PermissionCategoryGroup,
  RoleItem,
  UpdateRolePayload,
} from '../models/role.models';

export interface RolesState {
  roles: RoleItem[];
  availablePermissions: string[];
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
}

const initialState: RolesState = {
  roles: [],
  availablePermissions: [],
  status: 'idle',
  error: null,
};

function formatPermissionLabel(perm: string): string {
  const parts = perm.split('.');
  if (parts.length === 2) {
    const action = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
    const resource = parts[0].replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return `${action} ${resource}`;
  }
  return perm.replace(/_/g, ' ').replace(/\./g, ' - ');
}

function groupPermissions(permissions: string[]): PermissionCategoryGroup[] {
  const categoryMap = new Map<string, { key: string; label: string }[]>();

  for (const perm of permissions) {
    let category = 'Other';
    if (perm.startsWith('user.')) category = 'Users';
    else if (perm.startsWith('role.')) category = 'Roles';
    else if (perm.startsWith('event.')) category = 'Events';
    else if (perm.startsWith('template.')) category = 'Templates';
    else if (perm.startsWith('master_data.')) category = 'Master Data';
    else if (perm.startsWith('audit_log.')) category = 'Audit Log';

    if (!categoryMap.has(category)) {
      categoryMap.set(category, []);
    }
    categoryMap.get(category)!.push({
      key: perm,
      label: formatPermissionLabel(perm),
    });
  }

  const result: PermissionCategoryGroup[] = [];
  categoryMap.forEach((perms, category) => {
    result.push({ category, permissions: perms });
  });
  return result;
}

export const RolesStore = signalStore(
  { providedIn: 'root' },
  withState<RolesState>(initialState),
  withComputed(({ availablePermissions }) => ({
    permissionGroups: computed(() => groupPermissions(availablePermissions())),
  })),
  withMethods((store, roleService = inject(RoleService)) => ({
    loadRoles: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { status: 'loading', error: null })),
        switchMap(() =>
          roleService.getRoles().pipe(
            tap((roles) => {
              patchState(store, { roles, status: 'success', error: null });
            }),
            catchError((err: { message?: string }) => {
              patchState(store, {
                status: 'error',
                error: err?.message || 'Failed to load roles',
              });
              return of([]);
            }),
          ),
        ),
      ),
    ),

    loadPermissions: rxMethod<void>(
      pipe(
        switchMap(() =>
          roleService.getAvailablePermissions().pipe(
            tap((availablePermissions) => {
              patchState(store, { availablePermissions });
            }),
            catchError(() => of([])),
          ),
        ),
      ),
    ),

    createRole(payload: CreateRolePayload) {
      return roleService.createRole(payload).pipe(
        tap((newRole) => {
          patchState(store, (state) => ({
            roles: [...state.roles, newRole],
          }));
        }),
      );
    },

    updateRole(id: number, payload: UpdateRolePayload) {
      return roleService.updateRole(id, payload).pipe(
        tap((updatedRole) => {
          patchState(store, (state) => ({
            roles: state.roles.map((r) => (r.id === id ? updatedRole : r)),
          }));
        }),
      );
    },

    deleteRole(id: number) {
      return roleService.deleteRole(id).pipe(
        tap(() => {
          patchState(store, (state) => ({
            roles: state.roles.filter((r) => r.id !== id),
          }));
        }),
      );
    },
  })),
);
