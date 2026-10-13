import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginPage } from './login';
import { AuthStore } from '../../stores/auth.store';
import { Router, ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let statusSignal = signal<'idle' | 'loading' | 'authenticated' | 'unauthenticated' | 'error'>(
    'unauthenticated',
  );
  let errorSignal = signal<string | null>(null);
  let authStoreMock: {
    status: typeof statusSignal;
    error: typeof errorSignal;
    login: ReturnType<typeof vi.fn>;
  };
  let routerMock: {
    navigate: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    statusSignal.set('unauthenticated');
    errorSignal.set(null);

    authStoreMock = {
      status: statusSignal,
      error: errorSignal,
      login: vi.fn(),
    };

    routerMock = {
      navigate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        { provide: AuthStore, useValue: authStoreMock },
        { provide: Router, useValue: routerMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParams: {} },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and have invalid initial form', () => {
    expect(component).toBeTruthy();
    expect(component.loginForm.valid).toBe(false);
  });

  it('should validate email format and required fields', () => {
    const emailCtrl = component.loginForm.controls.email;
    const passCtrl = component.loginForm.controls.password;

    expect(emailCtrl.valid).toBe(false);
    expect(emailCtrl.errors?.['required']).toBe(true);

    emailCtrl.setValue('invalid-email');
    expect(emailCtrl.errors?.['email']).toBe(true);

    emailCtrl.setValue('valid@arena.com');
    expect(emailCtrl.valid).toBe(true);

    expect(passCtrl.valid).toBe(false);
    passCtrl.setValue('secret123');
    expect(passCtrl.valid).toBe(true);

    expect(component.loginForm.valid).toBe(true);
  });

  it('should toggle password visibility signal', () => {
    expect(component.showPassword()).toBe(false);
    component.togglePasswordVisibility();
    expect(component.showPassword()).toBe(true);
    component.togglePasswordVisibility();
    expect(component.showPassword()).toBe(false);
  });

  it('should call authStore.login when valid form is submitted', () => {
    component.loginForm.setValue({
      email: 'admin@arena.com',
      password: 'secretPassword1!',
    });

    component.onSubmit();

    expect(authStoreMock.login).toHaveBeenCalledWith({
      email: 'admin@arena.com',
      password: 'secretPassword1!',
    });
  });

  it('should not call authStore.login if form is invalid', () => {
    component.onSubmit();
    expect(authStoreMock.login).not.toHaveBeenCalled();
    expect(component.loginForm.touched).toBe(true);
  });

  it('should render error alert when authStore error exists', () => {
    errorSignal.set('Invalid email or password');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const alert = compiled.querySelector('[role="alert"]');
    expect(alert).toBeTruthy();
    expect(alert?.textContent).toContain('Invalid email or password');
  });

  it('should disable submit button when loading', () => {
    statusSignal.set('loading');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });
});
