import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { AuthStore } from './stores/auth.store';
import { LayoutStore } from './stores/layout.store';
import { UsersStore } from './stores/users.store';
import { RolesStore } from './stores/roles.store';
import { MasterDataService } from './services/master-data.service';
import { of } from 'rxjs';
import { signal } from '@angular/core';

describe('App Routes', () => {
  let router: Router;
  const isAuthenticatedSignal = signal(false);

  beforeEach(() => {
    isAuthenticatedSignal.set(false);
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        {
          provide: AuthStore,
          useValue: {
            isAuthenticated: isAuthenticatedSignal,
            user: signal(null),
            userFullName: signal(''),
            userRoleName: signal(''),
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
        {
          provide: UsersStore,
          useValue: {
            users: signal([]),
            page: signal(1),
            totalPages: signal(1),
            total: signal(0),
            search: signal(''),
            activeStatus: signal('active'),
            status: signal('idle'),
            error: signal(null),
            loadUsers: vi.fn(),
          },
        },
        {
          provide: RolesStore,
          useValue: {
            roles: signal([]),
            permissionGroups: signal([]),
            status: signal('idle'),
            error: signal(null),
            loadRoles: vi.fn(),
            loadPermissions: vi.fn(),
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
      ],
    });

    router = TestBed.inject(Router);
  });

  it('should recognize route config for root path with pathMatch full', () => {
    const rootRoute = routes.find((r) => r.path === '');
    expect(rootRoute).toBeTruthy();
    expect(rootRoute?.pathMatch).toBe('full');
  });

  it('should navigate to /login without NG04002 noMatchError', async () => {
    const canNavigate = await router.navigateByUrl('/login');
    expect(canNavigate).toBe(true);
    expect(router.url).toBe('/login');
  });

  it('should redirect unknown routes to root path via wildcard', async () => {
    await router.navigateByUrl('/non-existent-route-xyz');
    expect(router.url).toBe('/');
  });

  it('should redirect direct navigation to /form-builder to /form-definitions (NF-NAV-003)', async () => {
    isAuthenticatedSignal.set(true);
    await router.navigateByUrl('/form-builder');
    expect(router.url).toBe('/form-definitions');
  });
});
