import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Home } from './home';
import { provideRouter } from '@angular/router';
import { AuthStore } from '../../stores/auth.store';
import { LayoutStore } from '../../stores/layout.store';
import { signal } from '@angular/core';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;
  let isAuthenticatedSignal = signal(false);
  let userFullNameSignal = signal('');

  beforeEach(async () => {
    isAuthenticatedSignal.set(false);
    userFullNameSignal.set('');

    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideRouter([]),
        {
          provide: AuthStore,
          useValue: {
            isAuthenticated: isAuthenticatedSignal,
            user: signal(null),
            userFullName: userFullNameSignal,
            userEmail: signal(''),
            userRoleName: signal(''),
            userInitials: signal(''),
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

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render header logo text from BaseLayout', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.logo-text')?.textContent).toContain('Fight Command');
  });

  it('should render dashboard modules for user and role management', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('User Management');
    expect(compiled.textContent).toContain('Role Management');
    expect(compiled.textContent).toContain('Tournaments & Brackets');
  });

  it('should render personalized welcome title when authenticated', async () => {
    isAuthenticatedSignal.set(true);
    userFullNameSignal.set('Master Sensei');
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Welcome back, Master Sensei');
  });
});
