import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { RoleService } from './role.service';
import { ApiService } from './api.service';
import { API_BASE_URL } from '../constants/app-constants';
import { CreateRolePayload, RoleItem, UpdateRolePayload } from '../models/role.models';

describe('RoleService', () => {
  let service: RoleService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RoleService,
        ApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://localhost:3000' },
      ],
    });

    service = TestBed.inject(RoleService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should get all roles', () => {
    const mockRoles: RoleItem[] = [
      {
        id: 1,
        name: 'SUPERADMIN',
        scopeType: 'GLOBAL',
        isSystem: true,
        canCreateRoles: true,
        permissions: ['user.create', 'user.view'],
      },
    ];

    service.getRoles().subscribe((res) => {
      expect(res).toEqual(mockRoles);
    });

    const req = httpTesting.expectOne('http://localhost:3000/roles');
    expect(req.request.method).toBe('GET');
    req.flush(mockRoles);
  });

  it('should get available permissions', () => {
    const mockPerms = ['user.create', 'user.view', 'role.view'];

    service.getAvailablePermissions().subscribe((res) => {
      expect(res).toEqual(mockPerms);
    });

    const req = httpTesting.expectOne('http://localhost:3000/roles/permissions/available');
    expect(req.request.method).toBe('GET');
    req.flush(mockPerms);
  });

  it('should create role', () => {
    const payload: CreateRolePayload = {
      name: 'Custom Admin',
      scopeType: 'STATE',
      permissions: ['user.view'],
    };

    service.createRole(payload).subscribe((res) => {
      expect(res.name).toBe('Custom Admin');
    });

    const req = httpTesting.expectOne('http://localhost:3000/roles');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ id: 2, ...payload });
  });

  it('should update role', () => {
    const payload: UpdateRolePayload = {
      name: 'Updated Name',
      permissions: ['user.view', 'role.view'],
    };

    service.updateRole(2, payload).subscribe((res) => {
      expect(res.name).toBe('Updated Name');
    });

    const req = httpTesting.expectOne('http://localhost:3000/roles/2');
    expect(req.request.method).toBe('PUT');
    req.flush({ id: 2, ...payload });
  });

  it('should delete role', () => {
    service.deleteRole(2).subscribe((res) => {
      expect(res.message).toBe('Role deleted successfully');
    });

    const req = httpTesting.expectOne('http://localhost:3000/roles/2');
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Role deleted successfully' });
  });
});
