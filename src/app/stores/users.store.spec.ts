import { TestBed } from '@angular/core/testing';
import { UsersStore } from './users.store';
import { UserService } from '../services/user.service';
import { UsersPaginatedResponse } from '../models/user.models';
import { of, throwError } from 'rxjs';

describe('UsersStore', () => {
  let store: InstanceType<typeof UsersStore>;
  let userServiceMock: {
    getUsers: ReturnType<typeof vi.fn>;
    createUser: ReturnType<typeof vi.fn>;
    updateUser: ReturnType<typeof vi.fn>;
    deleteUser: ReturnType<typeof vi.fn>;
    reactivateUser: ReturnType<typeof vi.fn>;
  };

  const mockUsersResponse: UsersPaginatedResponse = {
    data: [
      {
        id: 1,
        firstName: 'Master',
        lastName: 'Admin',
        email: 'admin@arena.com',
        role: { id: 1, name: 'SUPERADMIN' },
        isActive: true,
      },
    ],
    meta: {
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    },
  };

  beforeEach(() => {
    userServiceMock = {
      getUsers: vi.fn(() => of(mockUsersResponse)),
      createUser: vi.fn(() => of({ message: 'User created' })),
      updateUser: vi.fn(() => of({ message: 'User updated' })),
      deleteUser: vi.fn(() => of({ message: 'User deleted' })),
      reactivateUser: vi.fn(() => of({ message: 'User reactivated' })),
    };

    TestBed.configureTestingModule({
      providers: [UsersStore, { provide: UserService, useValue: userServiceMock }],
    });

    store = TestBed.inject(UsersStore);
  });

  it('should load users with pagination and update state', async () => {
    store.loadUsers();
    await new Promise((r) => setTimeout(r, 50));

    expect(store.users().length).toBe(1);
    expect(store.total()).toBe(1);
    expect(store.status()).toBe('success');
  });

  it('should update search query and reload users', async () => {
    store.setSearch('new search');
    expect(store.search()).toBe('new search');
    expect(store.page()).toBe(1);
  });

  it('should update status filter and reload users', async () => {
    store.setStatus('deleted');
    expect(store.activeStatus()).toBe('deleted');
    expect(store.page()).toBe(1);
  });

  it('should handle load error gracefully', async () => {
    userServiceMock.getUsers.mockReturnValue(throwError(() => new Error('Network error')));
    store.loadUsers();
    await new Promise((r) => setTimeout(r, 50));

    expect(store.status()).toBe('error');
    expect(store.error()).toBeDefined();
  });

  it('should support sorting by name (asc/desc), role, and status', async () => {
    userServiceMock.getUsers.mockReturnValue(
      of({
        data: [
          {
            id: 1,
            firstName: 'Zara',
            lastName: 'White',
            email: 'zara@arena.com',
            role: { id: 2, name: 'COUNTRY_ADMIN' },
            isActive: true,
          },
          {
            id: 2,
            firstName: 'Alex',
            lastName: 'Brown',
            email: 'alex@arena.com',
            role: { id: 1, name: 'SUPERADMIN' },
            isActive: false,
          },
        ],
        meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
      }),
    );

    store.loadUsers();
    await new Promise((r) => setTimeout(r, 50));

    expect(store.sort()).toBe('name-asc');
    expect(store.sortedUsers()[0].firstName).toBe('Alex');
    expect(store.sortedUsers()[1].firstName).toBe('Zara');

    store.setSort('name-desc');
    expect(store.sort()).toBe('name-desc');
    expect(store.sortedUsers()[0].firstName).toBe('Zara');
    expect(store.sortedUsers()[1].firstName).toBe('Alex');

    store.setSort('role');
    expect(store.sortedUsers()[0].role.name).toBe('COUNTRY_ADMIN');
    expect(store.sortedUsers()[1].role.name).toBe('SUPERADMIN');
  });
});
