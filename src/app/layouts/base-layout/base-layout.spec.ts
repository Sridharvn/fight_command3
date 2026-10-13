import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BaseLayout } from './base-layout';
import { provideRouter } from '@angular/router';
import { AuthStore } from '../../stores/auth.store';
import { LayoutStore } from '../../stores/layout.store';
import { signal } from '@angular/core';

describe('BaseLayout', () => {
  let component: BaseLayout;
  let fixture: ComponentFixture<BaseLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BaseLayout],
      providers: [
        provideRouter([]),
        {
          provide: AuthStore,
          useValue: {
            isAuthenticated: signal(true),
            user: signal({ firstName: 'Test', lastName: 'User', role: { name: 'SUPERADMIN' } }),
            userFullName: signal('Test User'),
            userRoleName: signal('SUPERADMIN'),
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

    fixture = TestBed.createComponent(BaseLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render header and footer components', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-base-header')).toBeTruthy();
    expect(compiled.querySelector('app-base-footer')).toBeTruthy();
  });
});
