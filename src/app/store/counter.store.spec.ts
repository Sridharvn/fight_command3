import { TestBed } from '@angular/core/testing';
import { CounterStore } from './counter.store';

describe('CounterStore', () => {
  let store: InstanceType<typeof CounterStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CounterStore]
    });
    store = TestBed.inject(CounterStore);
  });

  it('should initialize with count 0 and step 1', () => {
    expect(store.count()).toBe(0);
    expect(store.step()).toBe(1);
    expect(store.past()).toEqual([]);
    expect(store.future()).toEqual([]);
    expect(store.history()).toEqual([]);
    expect(store.oddOrEven()).toBe('even');
    expect(store.canUndo()).toBe(false);
    expect(store.canRedo()).toBe(false);
  });

  it('should increment by step size', () => {
    store.increment();
    expect(store.count()).toBe(1);
    expect(store.oddOrEven()).toBe('odd');
    expect(store.history().length).toBe(1);
    expect(store.history()[0].action).toContain('Increment');
    expect(store.past()).toEqual([0]);
  });

  it('should decrement by step size', () => {
    store.decrement();
    expect(store.count()).toBe(-1);
    expect(store.oddOrEven()).toBe('odd');
    expect(store.past()).toEqual([0]);
  });

  it('should update step size', () => {
    store.updateStep(5);
    expect(store.step()).toBe(5);

    store.increment();
    expect(store.count()).toBe(5);
  });

  it('should ignore invalid step sizes', () => {
    store.updateStep(-2);
    expect(store.step()).toBe(1);

    store.updateStep(0);
    expect(store.step()).toBe(1);
  });

  it('should undo and redo operations', () => {
    store.increment(); // count: 1, past: [0]
    store.increment(); // count: 2, past: [0, 1]
    store.decrement(); // count: 1, past: [0, 1, 2]
    expect(store.count()).toBe(1);
    expect(store.canUndo()).toBe(true);

    store.undo(); // count: 2, past: [0, 1], future: [1]
    expect(store.count()).toBe(2);
    expect(store.canRedo()).toBe(true);

    store.undo(); // count: 1, past: [0], future: [1, 2]
    expect(store.count()).toBe(1);

    store.redo(); // count: 2, past: [0, 1], future: [1]
    expect(store.count()).toBe(2);

    store.redo(); // count: 1, past: [0, 1, 2], future: []
    expect(store.count()).toBe(1);
  });

  it('should reset state correctly', () => {
    store.increment();
    store.increment();
    store.reset();

    expect(store.count()).toBe(0);
    expect(store.past()).toContain(2);
  });
});
