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

  let logoutMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    isCollapsedSignal.set(false);
    logoutMock = vi.fn();

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
            userEmail: signal('admin@arena.com'),
            userRoleName: signal('SUPERADMIN'),
            userInitials: signal('SA'),
            logout: logoutMock,
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

  it('should render Fight Command brand text when expanded (HF-007, HF-PWA-001)', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const brandText = compiled.querySelector('.brand-text');
    expect(brandText?.textContent?.trim()).toBe('Fight Command');
  });

  it('should render Form Definitions but not standalone Form Builder in sidebar navigation (HF-NAV-008)', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const links = Array.from(compiled.querySelectorAll('.nav-link'));
    const linkHrefs = links.map((el) => el.getAttribute('routerlink') || el.getAttribute('href'));
    const linkTexts = links.map((el) => el.textContent?.trim());

    expect(linkHrefs).toContain('/form-definitions');
    expect(linkTexts.some((text) => text?.includes('Form Definitions'))).toBe(true);
    expect(linkHrefs).not.toContain('/form-builder');
    expect(linkTexts.some((text) => text?.includes('Form Builder'))).toBe(false);
  });

  it('should render distinct navigation links for Form Templates and Form Definitions (HF-NAV-011)', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const links = Array.from(compiled.querySelectorAll('.nav-link'));
    const linkHrefs = links.map((el) => el.getAttribute('routerlink') || el.getAttribute('href'));
    const linkTexts = links.map((el) => el.textContent?.trim());

    expect(linkHrefs).toContain('/form-templates');
    expect(linkTexts.some((text) => text?.includes('Form Templates'))).toBe(true);
    expect(linkHrefs).toContain('/form-definitions');
    expect(linkTexts.some((text) => text?.includes('Form Definitions'))).toBe(true);
  });

  it('should not render collapse arrow button in sidebar header (HF-007)', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const arrowBtn = compiled.querySelector('.btn-collapse');
    expect(arrowBtn).toBeNull();
  });

  it('should apply collapsed class when isSidebarCollapsed is true', () => {
    isCollapsedSignal.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const sidebar = compiled.querySelector('.sidebar');
    expect(sidebar?.classList.contains('collapsed')).toBe(true);
  });

  it('should render user full name, email, role badge, and avatar initials in the footer when expanded', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const footer = compiled.querySelector('.sidebar-footer');
    expect(footer).toBeTruthy();
    expect(footer?.textContent).toContain('Super Admin');
    expect(footer?.textContent).toContain('admin@arena.com');
    expect(footer?.textContent).toContain('SUPERADMIN');
    expect(footer?.textContent).toContain('SA');
  });

  it('should render logout button and trigger logout on click', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const logoutBtn = compiled.querySelector('.btn-logout') as HTMLButtonElement;
    expect(logoutBtn).toBeTruthy();
    expect(logoutBtn.textContent).toContain('Logout');

    logoutBtn.click();
    expect(logoutMock).toHaveBeenCalledTimes(1);
  });

  it('should render compact logout button and avatar when collapsed', () => {
    isCollapsedSignal.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const avatar = compiled.querySelector('.avatar');
    expect(avatar).toBeTruthy();
    expect(avatar?.textContent?.trim()).toBe('SA');

    const logoutBtn = compiled.querySelector('.btn-logout') as HTMLButtonElement;
    expect(logoutBtn).toBeTruthy();
  });
});
