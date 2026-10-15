import { TestBed } from '@angular/core/testing';
import { RuleEngineService } from './rule-engine.service';
import { AtomicRule, CrossFieldValidation, RuleGroup } from '../models/dynamic-form.models';

describe('RuleEngineService', () => {
  let service: RuleEngineService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RuleEngineService],
    });
    service = TestBed.inject(RuleEngineService);
  });

  it('should evaluate atomic comparison operators', () => {
    const data = { age: 16, belt: 'Blue', weight: 65, waiver: true };

    const eqRule: AtomicRule = { fieldId: 'belt', operator: 'equals', value: 'Blue' };
    expect(service.evaluate(eqRule, data)).toBe(true);

    const notEqRule: AtomicRule = { fieldId: 'belt', operator: 'notEquals', value: 'White' };
    expect(service.evaluate(notEqRule, data)).toBe(true);

    const ltRule: AtomicRule = { fieldId: 'age', operator: 'lessThan', value: 18 };
    expect(service.evaluate(ltRule, data)).toBe(true);

    const gtRule: AtomicRule = { fieldId: 'weight', operator: 'greaterThan', value: 70 };
    expect(service.evaluate(gtRule, data)).toBe(false);

    const inRule: AtomicRule = {
      fieldId: 'belt',
      operator: 'in',
      value: ['White', 'Blue', 'Purple'],
    };
    expect(service.evaluate(inRule, data)).toBe(true);

    const notInRule: AtomicRule = { fieldId: 'belt', operator: 'notIn', value: ['Brown', 'Black'] };
    expect(service.evaluate(notInRule, data)).toBe(true);
  });

  it('should support field-to-field comparison via $field', () => {
    const data = { minWeight: 60, maxWeight: 80, athleteWeight: 75 };

    const fieldCompRule: AtomicRule = {
      fieldId: 'athleteWeight',
      operator: 'lessThan',
      value: { $field: 'maxWeight' },
    };
    expect(service.evaluate(fieldCompRule, data)).toBe(true);

    const failRule: AtomicRule = {
      fieldId: 'athleteWeight',
      operator: 'lessThan',
      value: { $field: 'minWeight' },
    };
    expect(service.evaluate(failRule, data)).toBe(false);
  });

  it('should evaluate nested AND / OR conjunction rule groups', () => {
    const data = { age: 15, division: 'Cadet', hasConsent: true };

    const andGroup: RuleGroup = {
      conjunction: 'AND',
      conditions: [
        { fieldId: 'age', operator: 'lessThan', value: 18 },
        { fieldId: 'division', operator: 'equals', value: 'Cadet' },
      ],
    };
    expect(service.evaluate(andGroup, data)).toBe(true);

    const orGroup: RuleGroup = {
      conjunction: 'OR',
      conditions: [
        { fieldId: 'age', operator: 'greaterThan', value: 30 },
        { fieldId: 'hasConsent', operator: 'equals', value: true },
      ],
    };
    expect(service.evaluate(orGroup, data)).toBe(true);
  });

  it('should validate form and generate compliance error messages', () => {
    const validationRule: CrossFieldValidation = {
      id: 'rule-minor-consent',
      name: 'Minor Consent Requirement',
      errorMessage: 'Participants under 18 must have parental consent.',
      when: {
        conjunction: 'AND',
        conditions: [{ fieldId: 'age', operator: 'lessThan', value: 18 }],
      },
      then: {
        conjunction: 'AND',
        conditions: [{ fieldId: 'consent', operator: 'equals', value: true }],
      },
    };

    // Non-compliant: age 15, consent false
    const nonCompliantData = { age: 15, consent: false };
    const errors1 = service.validateForm([validationRule], nonCompliantData);
    expect(errors1).toEqual(['Participants under 18 must have parental consent.']);

    // Compliant: age 15, consent true
    const compliantData = { age: 15, consent: true };
    const errors2 = service.validateForm([validationRule], compliantData);
    expect(errors2).toEqual([]);

    // Not triggered: age 25, consent false
    const adultData = { age: 25, consent: false };
    const errors3 = service.validateForm([validationRule], adultData);
    expect(errors3).toEqual([]);
  });

  describe('Field Selection Limits (VR-RULE-001)', () => {
    const fields = [
      {
        id: 'disciplines',
        key: 'disciplines',
        label: 'Competition Disciplines',
        type: 'checkbox' as const,
        validationRules: {
          maxSelections: 3,
          minSelections: 1,
        },
      },
      {
        id: 'singleCheck',
        key: 'singleCheck',
        label: 'Single Agree',
        type: 'checkbox' as const,
        required: true,
      },
    ];

    it('should validate maxSelections when selected count exceeds allowed limit', () => {
      const invalidData = { disciplines: ['combat', 'sport', 'beach', 'cadet'], singleCheck: true };
      const errors = service.validateFields(fields, invalidData);
      expect(errors.length).toBe(1);
      expect(errors[0]).toBe('Field "Competition Disciplines" allows maximum 3 selections');
    });

    it('should pass validation when selected count is within maxSelections limit', () => {
      const validData = { disciplines: ['combat', 'sport', 'beach'], singleCheck: true };
      const errors = service.validateFields(fields, validData);
      expect(errors.length).toBe(0);
    });

    it('should validate minSelections when selection array is empty or below minimum', () => {
      const invalidData = { disciplines: [], singleCheck: true };
      const errors = service.validateFields(fields, invalidData);
      expect(errors.length).toBe(1);
      expect(errors[0]).toBe('Field "Competition Disciplines" requires at least 1 selection');
    });

    it('should evaluate countMax, countMin, and contains operators in atomic rules', () => {
      const data = { disciplines: ['combat', 'sport'] };

      const containsRule: AtomicRule = {
        fieldId: 'disciplines',
        operator: 'contains' as any,
        value: 'combat',
      };
      expect(service.evaluate(containsRule, data)).toBe(true);

      const countMaxRule: AtomicRule = {
        fieldId: 'disciplines',
        operator: 'countMax' as any,
        value: 3,
      };
      expect(service.evaluate(countMaxRule, data)).toBe(true);

      const countMaxFailRule: AtomicRule = {
        fieldId: 'disciplines',
        operator: 'countMax' as any,
        value: 1,
      };
      expect(service.evaluate(countMaxFailRule, data)).toBe(false);

      const countMinRule: AtomicRule = {
        fieldId: 'disciplines',
        operator: 'countMin' as any,
        value: 1,
      };
      expect(service.evaluate(countMinRule, data)).toBe(true);
    });
  });

  describe('Graceful Evaluation & Schema Compatibility (EC-RULE-003)', () => {
    it('should safely handle undefined or null node in evaluate without throwing TypeError', () => {
      expect(service.evaluate(undefined as any, { belt_rank: 'white' })).toBe(false);
      expect(service.evaluate(null as any, { belt_rank: 'white' })).toBe(false);
      expect(service.evaluate({} as any, { belt_rank: 'white' })).toBe(false);
    });

    it('should evaluate compound rules formatted with conditions and actions', () => {
      const compoundRule: any = {
        ruleId: 1792074395538,
        ruleName: 'Max 2 Belt Ranks',
        isActive: true,
        errorMessage: 'You can select at most 2 belt ranks.',
        conditions: {
          conjunction: 'AND',
          conditions: [{ fieldId: 'belt_rank', operator: 'countGreaterThan', value: 2 }],
        },
        actions: {
          conjunction: 'AND',
          conditions: [{ fieldId: 'belt_rank', operator: 'countMax', value: 2 }],
        },
      };

      // 1. Initial state (undefined belt_rank): does not throw, does not trigger
      const initialErrors = service.validateForm([compoundRule], {});
      expect(initialErrors).toEqual([]);

      // 2. 2 selections: within limit, trigger is false
      const validErrors = service.validateForm([compoundRule], {
        belt_rank: ['white', 'blue'],
      });
      expect(validErrors).toEqual([]);

      // 3. 3 selections: exceeds limit (countGreaterThan 2 is true, countMax 2 is false)
      const invalidErrors = service.validateForm([compoundRule], {
        belt_rank: ['white', 'blue', 'purple'],
      });
      expect(invalidErrors).toEqual(['You can select at most 2 belt ranks.']);
    });

    it('should safely ignore null/undefined items in validateForm array', () => {
      const errors = service.validateForm([null as any, undefined as any, {} as any], {
        belt_rank: 'white',
      });
      expect(errors).toEqual([]);
    });
  });
});
