import { TestBed } from '@angular/core/testing';
import { LayoutStore } from './layout.store';

describe('LayoutStore', () => {
  let store: InstanceType<typeof LayoutStore>;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [LayoutStore],
    });
    store = TestBed.inject(LayoutStore);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize with expanded sidebar by default', () => {
    expect(store.isSidebarCollapsed()).toBe(false);
  });

  it('should toggle sidebar collapsed state and persist to localStorage', () => {
    store.toggleSidebar();
    expect(store.isSidebarCollapsed()).toBe(true);
    expect(localStorage.getItem('ma_sidebar_collapsed')).toBe('true');

    store.toggleSidebar();
    expect(store.isSidebarCollapsed()).toBe(false);
    expect(localStorage.getItem('ma_sidebar_collapsed')).toBe('false');
  });

  it('should restore collapsed state from localStorage', () => {
    localStorage.setItem('ma_sidebar_collapsed', 'true');
    const newStore = TestBed.runInInjectionContext(() => new (LayoutStore as any)());
    expect(newStore.isSidebarCollapsed()).toBe(true);
  });
});
