import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DesktopOnlyNoticeComponent } from './desktop-only-notice';

describe('DesktopOnlyNoticeComponent (HF-MOB-001, HF-MOB-004)', () => {
  let component: DesktopOnlyNoticeComponent;
  let fixture: ComponentFixture<DesktopOnlyNoticeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DesktopOnlyNoticeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DesktopOnlyNoticeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the desktop only notice component', () => {
    expect(component).toBeTruthy();
  });

  it('should render Fight Command branding, desktop message, and advisory badge (HF-MOB-001)', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Fight Command');
    expect(compiled.textContent?.toLowerCase()).toContain('open in desktop');
    expect(compiled.textContent?.toLowerCase()).toContain('desktop');
    expect(compiled.querySelector('.notice-card')).toBeTruthy();
    expect(compiled.querySelector('.btn-continue-preview')).toBeTruthy();
  });

  it('should emit continueAnyway event when Continue Anyway button is clicked (HF-MOB-004)', () => {
    let emitted = false;
    component.continueAnyway.subscribe(() => {
      emitted = true;
    });

    const button = fixture.nativeElement.querySelector(
      '.btn-continue-preview',
    ) as HTMLButtonElement;
    expect(button).toBeTruthy();
    button.click();

    expect(emitted).toBe(true);
  });
});
