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

    const inRule: AtomicRule = { fieldId: 'belt', operator: 'in', value: ['White', 'Blue', 'Purple'] };
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
});
