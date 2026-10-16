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

  it('should render user avatar, full name, email, and role badge when authenticated (HF-020)', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Test User');
    expect(compiled.textContent).toContain('test@arena.com');
    expect(compiled.textContent).toContain('SUPERADMIN');
    expect(compiled.textContent).toContain('TU');
  });

  it('should not render logout button in header (HF-020)', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const logoutBtn = compiled.querySelector('.btn-logout');
    expect(logoutBtn).toBeNull();
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

  it('should not render redundant navigation links in header when authenticated (HF-NAV-012)', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.nav-links')).toBeNull();
    expect(compiled.querySelectorAll('.nav-link').length).toBe(0);
  });

  it('should not render redundant navigation links in header when unauthenticated (HF-NAV-012)', () => {
    isAuthSignal.set(false);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.nav-links')).toBeNull();
    expect(compiled.querySelectorAll('.nav-link').length).toBe(0);
  });
});
