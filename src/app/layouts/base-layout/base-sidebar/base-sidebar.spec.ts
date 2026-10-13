import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BaseSidebar } from './base-sidebar';
import { AuthStore } from '../../../stores/auth.store';
import { LayoutStore } from '../../../stores/layout.store';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';

describe('BaseSidebar', () => {
  let component: BaseSidebar;
  let fixture: ComponentFixture<BaseSidebar>;
  let isCollapsedSignal = signal(false);
  let userSignal = signal<any>({
    firstName: 'Super',
    lastName: 'Admin',
    role: { name: 'SUPERADMIN' },
  });

  beforeEach(async () => {
    isCollapsedSignal.set(false);

    await TestBed.configureTestingModule({
      imports: [BaseSidebar],
      providers: [
        provideRouter([]),
        {
          provide: LayoutStore,
          useValue: {
            isSidebarCollapsed: isCollapsedSignal,
            toggleSidebar: vi.fn(() => isCollapsedSignal.update((v) => !v)),
          },
        },
        {
          provide: AuthStore,
          useValue: {
            user: userSignal,
            userFullName: signal('Super Admin'),
            userRoleName: signal('SUPERADMIN'),
            logout: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BaseSidebar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and render navigation links', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll('.nav-link');
    expect(links.length).toBeGreaterThanOrEqual(3); // Dashboard, Users, Roles
  });

  it('should apply collapsed class when isSidebarCollapsed is true', () => {
    isCollapsedSignal.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const sidebar = compiled.querySelector('.sidebar');
    expect(sidebar?.classList.contains('collapsed')).toBe(true);
  });
});
