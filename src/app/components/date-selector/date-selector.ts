import {
  Component,
  ChangeDetectionStrategy,
  forwardRef,
  input,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatDatepickerModule, MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { provideNativeDateAdapter } from '@angular/material/core';

@Component({
  selector: 'app-date-selector',
  standalone: true,
  imports: [CommonModule, MatDatepickerModule, MatInputModule],
  providers: [
    provideNativeDateAdapter(),
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateSelectorComponent),
      multi: true,
    },
  ],
  templateUrl: './date-selector.html',
  styleUrls: ['./date-selector.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateSelectorComponent implements ControlValueAccessor {
  id = input<string>('');
  name = input<string>('');
  placeholder = input<string>('YYYY-MM-DD');
  startView = input<'month' | 'year' | 'multi-year'>('month');
  isDob = input<boolean>(false);
  min = input<string | Date | null>(null);
  max = input<string | Date | null>(null);
  required = input<boolean>(false);
  disabled = input<boolean>(false);

  selectedDate = signal<Date | null>(null);
  private internalDisabled = signal(false);

  isDisabled = computed(() => this.disabled() || this.internalDisabled());

  effectiveStartView = computed(() => (this.isDob() ? 'multi-year' : this.startView()));

  effectiveMaxDate = computed(() => {
    const m = this.max();
    if (m) {
      return typeof m === 'string' ? this.parseIsoDate(m) : m;
    }
    if (this.isDob()) {
      return new Date(); // DOB cannot be in the future
    }
    return null;
  });

  effectiveMinDate = computed(() => {
    const m = this.min();
    if (m) {
      return typeof m === 'string' ? this.parseIsoDate(m) : m;
    }
    if (this.isDob()) {
      const now = new Date();
      return new Date(now.getFullYear() - 120, now.getMonth(), now.getDate());
    }
    return null;
  });

  startAtDate = computed(() => {
    const sel = this.selectedDate();
    if (sel) return sel;
    if (this.isDob()) {
      const currentYear = new Date().getFullYear();
      // Default DOB view around 20 years ago (typical adult athlete baseline)
      return new Date(currentYear - 20, 0, 1);
    }
    return new Date();
  });

  get startViewMode(): 'month' | 'year' | 'multi-year' {
    return this.effectiveStartView();
  }

  get maxDate(): Date | null {
    return this.effectiveMaxDate();
  }

  get minDate(): Date | null {
    return this.effectiveMinDate();
  }

  displayValue = computed(() => {
    const d = this.selectedDate();
    if (!d || isNaN(d.getTime())) return '';
    return this.formatIsoDate(d);
  });

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | Date | null): void {
    if (!value) {
      this.selectedDate.set(null);
      return;
    }
    if (typeof value === 'string') {
      this.selectedDate.set(this.parseIsoDate(value));
    } else if (value instanceof Date) {
      this.selectedDate.set(isNaN(value.getTime()) ? null : value);
    }
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.internalDisabled.set(isDisabled);
  }

  onDateChange(event: MatDatepickerInputEvent<Date>): void {
    const date = event.value;
    if (date && !isNaN(date.getTime())) {
      this.selectedDate.set(date);
      const iso = this.formatIsoDate(date);
      this.onChange(iso);
    } else {
      this.selectedDate.set(null);
      this.onChange(null);
    }
    this.onTouched();
  }

  onTextInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const rawVal = input.value?.trim();
    if (!rawVal) {
      this.selectedDate.set(null);
      this.onChange(null);
      this.onTouched();
      return;
    }

    const parsed = this.parseIsoDate(rawVal);
    if (parsed && !isNaN(parsed.getTime())) {
      this.selectedDate.set(parsed);
      this.onChange(this.formatIsoDate(parsed));
    }
    this.onTouched();
  }

  onBlur(): void {
    this.onTouched();
  }

  clearDate(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.selectedDate.set(null);
    this.onChange(null);
    this.onTouched();
  }

  private parseIsoDate(val: string): Date | null {
    if (!val) return null;
    // Format YYYY-MM-DD
    const match = val.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      return new Date(year, month, day);
    }
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }

  private formatIsoDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
