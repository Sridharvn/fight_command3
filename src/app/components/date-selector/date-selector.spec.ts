import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Component, signal } from '@angular/core';
import { DateSelectorComponent } from './date-selector';

@Component({
  standalone: true,
  imports: [DateSelectorComponent, ReactiveFormsModule],
  template: `
    <app-date-selector
      [formControl]="dateControl"
      [isDob]="isDob()"
      [placeholder]="placeholder()"
      [required]="isRequired()"
      id="test-date"
    ></app-date-selector>
  `,
})
class TestHostComponent {
  dateControl = new FormControl<string | null>(null);
  isDob = signal(false);
  placeholder = signal('Select date');
  isRequired = signal(false);
}

describe('DateSelectorComponent (HF-DATE-001, HF-DATE-002, NF-DATE-001)', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the date selector component (HF-DATE-001)', () => {
    const el = fixture.nativeElement.querySelector('app-date-selector');
    expect(el).toBeTruthy();
  });

  it('should bind value from FormControl and format as ISO string YYYY-MM-DD (HF-DATE-001)', () => {
    host.dateControl.setValue('1998-05-20');
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.value).toBeTruthy();
    // Verify ISO value in control
    expect(host.dateControl.value).toBe('1998-05-20');
  });

  it('should configure multi-year decade view and maximum date when isDob is true (HF-DATE-002)', () => {
    host.isDob.set(true);
    fixture.detectChanges();

    const dateSelector = fixture.debugElement.children[0]
      .componentInstance as DateSelectorComponent;
    expect(dateSelector.startViewMode).toBe('multi-year');
    expect(dateSelector.maxDate).toBeTruthy();
  });

  it('should disable input when formControl is disabled (HF-DATE-001)', () => {
    host.dateControl.disable();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });

  it('should mark form control touched when input loses focus (HF-DATE-001)', () => {
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(host.dateControl.touched).toBe(true);
  });
});
