import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RuleManagementPage } from './rule-management';
import { RuleStore } from '../../stores/rule.store';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { GlobalCompoundRule } from '../../models/rule-engine.models';

describe('RuleManagementPage', () => {
  let component: RuleManagementPage;
  let fixture: ComponentFixture<RuleManagementPage>;

  const mockRule: GlobalCompoundRule = {
    ruleId: 1,
    ruleName: 'Minor Consent Rule',
    description: 'Requires guardian signature if age < 18',
    conditions: {
      conjunction: 'AND',
      conditions: [{ fieldId: 'age', operator: 'lessThan', value: 18 }],
    },
    actions: {
      conjunction: 'AND',
      conditions: [{ fieldId: 'guardian_consent', operator: 'equals', value: true }],
    },
    errorMessage: 'Guardian consent required for participants under 18',
    isActive: true,
  };

  const rulesSignal = signal<GlobalCompoundRule[]>([mockRule]);
  const statusSignal = signal<'idle' | 'loading' | 'success' | 'error'>('success');
  const errorSignal = signal<string | null>(null);

  let ruleStoreMock: any;

  beforeEach(async () => {
    ruleStoreMock = {
      rules: rulesSignal,
      filteredRules: rulesSignal,
      activeRules: rulesSignal,
      totalRules: signal(1),
      status: statusSignal,
      error: errorSignal,
      loadRules: vi.fn(),
      setSearchQuery: vi.fn(),
      createRule: vi.fn(),
      deleteRule: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [RuleManagementPage],
      providers: [provideRouter([]), { provide: RuleStore, useValue: ruleStoreMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(RuleManagementPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and render rules list', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Minor Consent Rule');
    expect(compiled.textContent).toContain('Guardian consent required');
  });

  it('should toggle create rule modal', () => {
    expect(component.isModalOpen()).toBe(false);
    component.openCreateModal();
    fixture.detectChanges();

    expect(component.isModalOpen()).toBe(true);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.modal-backdrop')).toBeTruthy();

    component.closeModal();
    fixture.detectChanges();
    expect(component.isModalOpen()).toBe(false);
  });
});
