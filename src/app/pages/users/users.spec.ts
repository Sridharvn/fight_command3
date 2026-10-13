import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UsersPage } from './users';
import { UsersStore } from '../../stores/users.store';
import { RolesStore } from '../../stores/roles.store';
import { MasterDataService } from '../../services/master-data.service';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { provideRouter } from '@angular/router';
import { AuthStore } from '../../stores/auth.store';
import { LayoutStore } from '../../stores/layout.store';

describe('UsersPage', () => {
  let component: UsersPage;
  let fixture: ComponentFixture<UsersPage>;

  const usersSignal = signal<any[]>([
    {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      role: { id: 1, name: 'SUPERADMIN' },
      isActive: true,
      isDeleted: false,
    },
  ]);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersPage],
      providers: [
        provideRouter([]),
        {
          provide: UsersStore,
          useValue: {
            users: usersSignal,
            page: signal(1),
            limit: signal(10),
            total: signal(1),
            totalPages: signal(1),
            search: signal(''),
            activeStatus: signal('active'),
            status: signal('success'),
            error: signal(null),
            loadUsers: vi.fn(),
            setPage: vi.fn(),
            setSearch: vi.fn(),
            setStatus: vi.fn(),
            createUser: vi.fn(),
            updateUser: vi.fn(),
            deleteUser: vi.fn(),
            reactivateUser: vi.fn(),
          },
        },
        {
          provide: RolesStore,
          useValue: {
            roles: signal([{ id: 1, name: 'SUPERADMIN' }]),
            loadRoles: vi.fn(),
          },
        },
        {
          provide: MasterDataService,
          useValue: {
            getCountries: vi.fn(() => of([])),
            getStates: vi.fn(() => of([])),
            getDistricts: vi.fn(() => of([])),
          },
        },
        {
          provide: AuthStore,
          useValue: {
            isAuthenticated: signal(true),
            user: signal({ firstName: 'Super', lastName: 'Admin' }),
            userFullName: signal('Super Admin'),
            userEmail: signal('admin@test.com'),
            userRoleName: signal('SUPERADMIN'),
            userInitials: signal('SA'),
            logout: vi.fn(),
          },
        },
        {
          provide: LayoutStore,
          useValue: {
            isSidebarCollapsed: signal(false),
            toggleSidebar: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UsersPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and render user table', async () => {
    expect(component).toBeTruthy();
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.user-table')).toBeTruthy();
    expect(compiled.textContent).toContain('John Doe');
  });

  it('should toggle user creation modal', () => {
    expect(component.isModalOpen()).toBe(false);
    component.openCreateModal();
    expect(component.isModalOpen()).toBe(true);
    component.closeModal();
    expect(component.isModalOpen()).toBe(false);
  });
});
