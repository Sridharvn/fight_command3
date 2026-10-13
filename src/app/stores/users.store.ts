import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, of } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { UserService } from '../services/user.service';
import { CreateUserPayload, UpdateUserPayload, UserResponseModel } from '../models/user.models';

export interface UsersState {
  users: UserResponseModel[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  search: string;
  activeStatus: 'active' | 'deleted' | 'all';
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
}

const initialState: UsersState = {
  users: [],
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  search: '',
  activeStatus: 'active',
  status: 'idle',
  error: null,
};

export const UsersStore = signalStore(
  { providedIn: 'root' },
  withState<UsersState>(initialState),
  withMethods((store, userService = inject(UserService)) => {
    const fetchUsers = () => {
      patchState(store, { status: 'loading', error: null });
      return userService
        .getUsers({
          page: store.page(),
          limit: store.limit(),
          search: store.search(),
          status: store.activeStatus(),
        })
        .pipe(
          tap((response) => {
            patchState(store, {
              users: response.data,
              total: response.meta.total,
              page: response.meta.page,
              limit: response.meta.limit,
              totalPages: response.meta.totalPages,
              status: 'success',
              error: null,
            });
          }),
          catchError((err: { message?: string }) => {
            patchState(store, {
              status: 'error',
              error: err?.message || 'Failed to load users',
            });
            return of(null);
          }),
        );
    };

    return {
      loadUsers: rxMethod<void>(pipe(switchMap(() => fetchUsers()))),

      setPage(page: number): void {
        patchState(store, { page });
        fetchUsers().subscribe();
      },

      setSearch(search: string): void {
        patchState(store, { search, page: 1 });
        fetchUsers().subscribe();
      },

      setStatus(activeStatus: 'active' | 'deleted' | 'all'): void {
        patchState(store, { activeStatus, page: 1 });
        fetchUsers().subscribe();
      },

      createUser(payload: CreateUserPayload) {
        return userService.createUser(payload).pipe(
          tap(() => {
            fetchUsers().subscribe();
          }),
        );
      },

      updateUser(id: number, payload: UpdateUserPayload) {
        return userService.updateUser(id, payload).pipe(
          tap(() => {
            fetchUsers().subscribe();
          }),
        );
      },

      deleteUser(id: number) {
        return userService.deleteUser(id).pipe(
          tap(() => {
            fetchUsers().subscribe();
          }),
        );
      },

      reactivateUser(id: number) {
        return userService.reactivateUser(id).pipe(
          tap(() => {
            fetchUsers().subscribe();
          }),
        );
      },
    };
  }),
);
