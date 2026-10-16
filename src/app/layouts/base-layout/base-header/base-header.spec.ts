import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BaseHeader } from './base-header';
import { provideRouter } from '@angular/router';
import { AuthStore } from '../../../stores/auth.store';
import { LayoutStore } from '../../../stores/layout.store';
import { signal } from '@angular/core';

describe('BaseHeader', () => {
  let component: BaseHeader;
  let fixture: ComponentFixture<BaseHeader>;

  let logoutMock: ReturnType<typeof vi.fn>;
  let isAuthSignal = signal(true);

  beforeEach(async () => {
    logoutMock = vi.fn();
    isAuthSignal.set(true);

    await TestBed.configureTestingModule({
      imports: [BaseHeader],
      providers: [
        provideRouter([]),
        {
          provide: AuthStore,
          useValue: {
            isAuthenticated: isAuthSignal,
            user: signal({ firstName: 'Test', lastName: 'User', email: 'test@arena.com' }),
            userFullName: signal('Test User'),
            userEmail: signal('test@arena.com'),
            userRoleName: signal('SUPERADMIN'),
            userInitials: signal('TU'),
            logout: logoutMock,
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

    fixture = TestBed.createComponent(BaseHeader);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render user avatar, full name, email, role badge, and logout button when authenticated', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Test User');
    expect(compiled.textContent).toContain('test@arena.com');
    expect(compiled.textContent).toContain('SUPERADMIN');
    expect(compiled.textContent).toContain('TU');

    const logoutBtn = compiled.querySelector('.btn-logout') as HTMLButtonElement;
    expect(logoutBtn).toBeTruthy();
    expect(logoutBtn.textContent).toContain('Logout');

    logoutBtn.click();
    expect(logoutMock).toHaveBeenCalledTimes(1);
  });

  it('should render Sign In link and no user details when not authenticated', () => {
    isAuthSignal.set(false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.user-profile-header')).toBeNull();
    const signInBtn = compiled.querySelector('.btn-primary');
    expect(signInBtn).toBeTruthy();
    expect(signInBtn?.textContent).toContain('Sign In');
  });

  it('should render hamburger menu toggle button in header to collapse and expand sidebar (HF-007)', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const menuToggleBtn = compiled.querySelector('.btn-menu-toggle') as HTMLButtonElement;
    expect(menuToggleBtn).toBeTruthy();
    expect(menuToggleBtn.getAttribute('aria-label')).toBe('Collapse sidebar');

    menuToggleBtn.click();
    expect(TestBed.inject(LayoutStore).toggleSidebar).toHaveBeenCalledTimes(1);
  });
});
