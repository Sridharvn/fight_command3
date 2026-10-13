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
});
