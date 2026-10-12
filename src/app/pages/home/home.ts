import { Component, inject, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { BaseLayout } from '../../layouts/base-layout/base-layout';
import { CounterStore } from '../../store/counter.store';

@Component({
  selector: 'app-home',
  imports: [BaseLayout],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:keydown)': 'handleKeyDown($event)'
  }
})
export class Home {
  protected readonly store = inject(CounterStore);
  protected readonly isPulsing = signal(false);

  constructor() {
    // Expose store globally on window for easy browser debugging
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>)['store'] = this.store;
    }

    // Re-trigger pulse animation when count changes
    effect(() => {
      // Access the count signal to register dependency
      this.store.count();

      // Trigger animation flag
      this.isPulsing.set(true);
      const timer = setTimeout(() => {
        this.isPulsing.set(false);
      }, 200);

      // Clean up timer if dependency changes quickly
      return () => clearTimeout(timer);
    });
  }

  protected handleKeyDown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    // Don't intercept shortcuts if typing in input fields
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return;
    }

    const key = event.key;

    if (key === '+' || key === '=' || key === 'ArrowUp') {
      event.preventDefault();
      this.store.increment();
    } else if (key === '-' || key === 'ArrowDown') {
      event.preventDefault();
      this.store.decrement();
    } else if (key.toLowerCase() === 'r') {
      event.preventDefault();
      this.store.reset();
    } else if (key.toLowerCase() === 'u') {
      event.preventDefault();
      this.store.undo();
    } else if (key.toLowerCase() === 'y' || key.toLowerCase() === 'd') {
      event.preventDefault();
      this.store.redo();
    }
  }

  protected onStepChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.valueAsNumber;
    if (!isNaN(value) && value > 0) {
      this.store.updateStep(value);
    }
  }

  protected adjustStep(amount: number): void {
    const currentStep = this.store.step();
    const nextStep = Math.max(1, currentStep + amount);
    this.store.updateStep(nextStep);
  }
}
