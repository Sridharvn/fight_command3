import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RolesPage } from './roles';
import { RolesStore } from '../../stores/roles.store';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { AuthStore } from '../../stores/auth.store';
import { LayoutStore } from '../../stores/layout.store';

describe('RolesPage', () => {
  let component: RolesPage;
  let fixture: ComponentFixture<RolesPage>;

  const rolesSignal = signal<any[]>([
    {
      id: 1,
      name: 'SUPERADMIN',
      scopeType: 'GLOBAL',
      isSystem: true,
      canCreateRoles: true,
      permissions: ['user.create', 'role.view'],
    },
  ]);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RolesPage],
      providers: [
        provideRouter([]),
        {
          provide: RolesStore,
          useValue: {
            roles: rolesSignal,
            availablePermissions: signal(['user.create', 'role.view']),
            permissionGroups: signal([
              {
                category: 'Users',
                permissions: [{ key: 'user.create', label: 'Create User' }],
              },
            ]),
            status: signal('success'),
            error: signal(null),
            loadRoles: vi.fn(),
            loadPermissions: vi.fn(),
            createRole: vi.fn(),
            updateRole: vi.fn(),
            deleteRole: vi.fn(),
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

    fixture = TestBed.createComponent(RolesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and render role cards', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('SUPERADMIN');
  });

  it('should toggle role creation modal', () => {
    expect(component.isModalOpen()).toBe(false);
    component.openCreateModal();
    expect(component.isModalOpen()).toBe(true);
    component.closeModal();
    expect(component.isModalOpen()).toBe(false);
  });
});
