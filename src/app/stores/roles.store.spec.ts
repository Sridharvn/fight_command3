import { TestBed } from '@angular/core/testing';
import { RolesStore } from './roles.store';
import { RoleService } from '../services/role.service';
import { RoleItem } from '../models/role.models';
import { of, throwError } from 'rxjs';

describe('RolesStore', () => {
  let store: InstanceType<typeof RolesStore>;
  let roleServiceMock: {
    getRoles: ReturnType<typeof vi.fn>;
    getAvailablePermissions: ReturnType<typeof vi.fn>;
    createRole: ReturnType<typeof vi.fn>;
    updateRole: ReturnType<typeof vi.fn>;
    deleteRole: ReturnType<typeof vi.fn>;
  };

  const mockRoles: RoleItem[] = [
    {
      id: 1,
      name: 'SUPERADMIN',
      scopeType: 'GLOBAL',
      isSystem: true,
      canCreateRoles: true,
      permissions: ['user.create', 'role.create'],
    },
  ];

  const mockPermissions = ['user.create', 'user.edit', 'role.view', 'event.create'];

  beforeEach(() => {
    roleServiceMock = {
      getRoles: vi.fn(() => of(mockRoles)),
      getAvailablePermissions: vi.fn(() => of(mockPermissions)),
      createRole: vi.fn((dto) => of({ id: 2, ...dto })),
      updateRole: vi.fn((id, dto) => of({ id, ...dto })),
      deleteRole: vi.fn(() => of({ message: 'Role deleted' })),
    };

    TestBed.configureTestingModule({
      providers: [RolesStore, { provide: RoleService, useValue: roleServiceMock }],
    });

    store = TestBed.inject(RolesStore);
  });

  it('should load roles and permissions into state', async () => {
    store.loadRoles();
    store.loadPermissions();
    await new Promise((r) => setTimeout(r, 50));

    expect(store.roles().length).toBe(1);
    expect(store.availablePermissions().length).toBe(4);
    expect(store.status()).toBe('success');
  });

  it('should categorize available permissions into groups', async () => {
    store.loadPermissions();
    await new Promise((r) => setTimeout(r, 50));

    const groups = store.permissionGroups();
    expect(groups.length).toBeGreaterThan(0);
    const userGroup = groups.find((g) => g.category.toLowerCase().includes('user'));
    expect(userGroup).toBeDefined();
  });
});
