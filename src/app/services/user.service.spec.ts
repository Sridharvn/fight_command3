import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from './user.service';
import { ApiService } from './api.service';
import { API_BASE_URL } from '../constants/app-constants';
import {
  CreateUserPayload,
  UpdateUserPayload,
  UsersPaginatedResponse,
} from '../models/user.models';

describe('UserService', () => {
  let service: UserService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UserService,
        ApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://localhost:3000' },
      ],
    });

    service = TestBed.inject(UserService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should fetch paginated users with params', () => {
    const mockRes: UsersPaginatedResponse = {
      data: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
    };

    service.getUsers({ page: 2, limit: 15, search: 'john', status: 'active' }).subscribe((res) => {
      expect(res).toEqual(mockRes);
    });

    const req = httpTesting.expectOne(
      'http://localhost:3000/users?page=2&limit=15&search=john&status=active',
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockRes);
  });

  it('should create user', () => {
    const payload: CreateUserPayload = {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      password: 'secretPassword123',
      roleId: 2,
    };

    service.createUser(payload).subscribe((res) => {
      expect(res.message).toBe('User created successfully');
    });

    const req = httpTesting.expectOne('http://localhost:3000/users');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ message: 'User created successfully' });
  });

  it('should update user', () => {
    const payload: UpdateUserPayload = { designation: 'President' };

    service.updateUser(5, payload).subscribe((res) => {
      expect(res.message).toBe('User updated successfully');
    });

    const req = httpTesting.expectOne('http://localhost:3000/users/5');
    expect(req.request.method).toBe('PUT');
    req.flush({ message: 'User updated successfully' });
  });

  it('should delete user', () => {
    service.deleteUser(5).subscribe((res) => {
      expect(res.message).toBe('User deleted successfully');
    });

    const req = httpTesting.expectOne('http://localhost:3000/users/5');
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'User deleted successfully' });
  });

  it('should reactivate user', () => {
    service.reactivateUser(5).subscribe((res) => {
      expect(res.message).toBe('User reactivated successfully');
    });

    const req = httpTesting.expectOne('http://localhost:3000/users/5/reactivate');
    expect(req.request.method).toBe('PATCH');
    req.flush({ message: 'User reactivated successfully' });
  });
});
