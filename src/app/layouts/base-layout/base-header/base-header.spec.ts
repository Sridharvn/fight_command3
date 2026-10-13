import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BaseHeader } from './base-header';
import { provideRouter } from '@angular/router';
import { AuthStore } from '../../../stores/auth.store';
import { LayoutStore } from '../../../stores/layout.store';
import { signal } from '@angular/core';

describe('BaseHeader', () => {
  let component: BaseHeader;
  let fixture: ComponentFixture<BaseHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BaseHeader],
      providers: [
        provideRouter([]),
        {
          provide: AuthStore,
          useValue: {
            isAuthenticated: signal(true),
            user: signal({ firstName: 'Test', lastName: 'User' }),
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

    fixture = TestBed.createComponent(BaseHeader);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
