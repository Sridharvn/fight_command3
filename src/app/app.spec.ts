import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { Component } from '@angular/core';

@Component({
  template: '<div id="dummy-page">Dummy Page</div>',
})
class DummyComponent {}

describe('App Root (HF-MOB-001, HF-MOB-002, HF-MOB-003, HF-MOB-004)', () => {
  let fixture: ComponentFixture<App>;
  let app: App;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([
          { path: '', component: DummyComponent },
          { path: 'login', component: DummyComponent },
          { path: 'users', component: DummyComponent },
          { path: 'events/:eventId/register', component: DummyComponent },
        ]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    app = fixture.componentInstance;
    router = TestBed.inject(Router);
  });

  it('should create the app', () => {
    expect(app).toBeTruthy();
  });

  it('should NOT display desktop advisory on public registration routes even on mobile (HF-MOB-002)', async () => {
    app.isMobileViewport.set(true);
    app.isAdvisoryDismissed.set(false);
    await router.navigateByUrl('/events/4/register');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-desktop-only-notice')).toBeNull();
  });

  it('should display desktop advisory on non-public routes when on mobile (HF-MOB-001)', async () => {
    app.isMobileViewport.set(true);
    app.isAdvisoryDismissed.set(false);
    await router.navigateByUrl('/users');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-desktop-only-notice')).toBeTruthy();
  });

  it('should NOT display desktop advisory on desktop viewports (HF-MOB-003)', async () => {
    app.isMobileViewport.set(false);
    app.isAdvisoryDismissed.set(false);
    await router.navigateByUrl('/users');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-desktop-only-notice')).toBeNull();
  });

  it('should dismiss desktop advisory when user chooses continue anyway (HF-MOB-004)', async () => {
    app.isMobileViewport.set(true);
    app.isAdvisoryDismissed.set(false);
    await router.navigateByUrl('/users');
    fixture.detectChanges();

    expect(app.isAdvisoryVisible()).toBe(true);

    app.dismissAdvisory();
    fixture.detectChanges();

    expect(app.isAdvisoryVisible()).toBe(false);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-desktop-only-notice')).toBeNull();
  });
});
