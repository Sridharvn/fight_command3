import { TestBed } from '@angular/core/testing';
import { RuleStore } from './rule.store';
import { RuleService } from '../services/rule.service';
import { of } from 'rxjs';
import { GlobalCompoundRule } from '../models/rule-engine.models';

describe('RuleStore', () => {
  let store: InstanceType<typeof RuleStore>;
  let ruleServiceMock: {
    getRules: ReturnType<typeof vi.fn>;
    createRule: ReturnType<typeof vi.fn>;
    updateRule: ReturnType<typeof vi.fn>;
    deleteRule: ReturnType<typeof vi.fn>;
  };

  const mockRule: GlobalCompoundRule = {
    ruleId: 1,
    ruleName: 'Weight Check',
    description: 'Max 70kg for light division',
    conditions: {
      conjunction: 'AND',
      conditions: [{ fieldId: 'division', operator: 'equals', value: 'light' }],
    },
    actions: {
      conjunction: 'AND',
      conditions: [{ fieldId: 'weight', operator: 'lessThan', value: 71 }],
    },
    errorMessage: 'Weight exceeds division limit',
    isActive: true,
  };

  beforeEach(() => {
    ruleServiceMock = {
      getRules: vi.fn().mockReturnValue(of([mockRule])),
      createRule: vi.fn(),
      updateRule: vi.fn(),
      deleteRule: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [RuleStore, { provide: RuleService, useValue: ruleServiceMock }],
    });

    store = TestBed.inject(RuleStore);
  });

  it('should initialize and load rules', async () => {
    store.loadRules();
    await new Promise((r) => setTimeout(r, 20));

    expect(store.rules().length).toBe(1);
    expect(store.rules()[0].ruleName).toBe('Weight Check');
    expect(store.activeRules().length).toBe(1);
  });

  it('should filter rules by search query', async () => {
    store.loadRules();
    await new Promise((r) => setTimeout(r, 20));

    store.setSearchQuery('Weight');
    expect(store.filteredRules().length).toBe(1);

    store.setSearchQuery('NonExistent');
    expect(store.filteredRules().length).toBe(0);
  });

  it('should create a rule and add to state', async () => {
    const newRule: GlobalCompoundRule = { ...mockRule, ruleId: 2, ruleName: 'New Rule' };
    ruleServiceMock.createRule.mockReturnValue(of(newRule));

    store.createRule({
      ruleName: 'New Rule',
      conditions: mockRule.conditions,
      actions: mockRule.actions,
      errorMessage: 'Error',
    });
    await new Promise((r) => setTimeout(r, 20));

    expect(store.rules().some((r) => r.ruleId === 2)).toBe(true);
  });

  it('should delete a rule and remove from state', async () => {
    store.loadRules();
    await new Promise((r) => setTimeout(r, 20));
    expect(store.rules().length).toBe(1);

    ruleServiceMock.deleteRule.mockReturnValue(of({ message: 'Deleted' }));
    store.deleteRule(1);
    await new Promise((r) => setTimeout(r, 20));

    expect(store.rules().length).toBe(0);
  });
});
