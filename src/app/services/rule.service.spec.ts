import { TestBed } from '@angular/core/testing';
import { RuleService } from './rule.service';
import { ApiService } from './api.service';
import { of } from 'rxjs';
import { GlobalCompoundRule, CreateGlobalCompoundRuleDto } from '../models/rule-engine.models';

describe('RuleService', () => {
  let service: RuleService;
  let apiServiceMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  const mockRule: GlobalCompoundRule = {
    ruleId: 1,
    ruleName: 'Age Check',
    description: 'Ensure age >= 18',
    conditions: {
      conjunction: 'AND',
      conditions: [{ fieldId: 'age', operator: 'greaterThan', value: 17 }],
    },
    actions: {
      conjunction: 'AND',
      conditions: [{ fieldId: 'consent', operator: 'equals', value: true }],
    },
    errorMessage: 'Consent required for minors',
    isActive: true,
  };

  beforeEach(() => {
    apiServiceMock = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [RuleService, { provide: ApiService, useValue: apiServiceMock }],
    });

    service = TestBed.inject(RuleService);
  });

  it('should get all rules', () => {
    apiServiceMock.get.mockReturnValue(of([mockRule]));

    service.getRules().subscribe((res) => {
      expect(res).toEqual([mockRule]);
    });

    expect(apiServiceMock.get).toHaveBeenCalledWith('templates/global-compound-rules');
  });

  it('should create a rule', () => {
    const dto: CreateGlobalCompoundRuleDto = {
      ruleName: 'Age Check',
      conditions: mockRule.conditions,
      actions: mockRule.actions,
      errorMessage: 'Error',
    };

    apiServiceMock.post.mockReturnValue(of(mockRule));

    service.createRule(dto).subscribe((res) => {
      expect(res).toEqual(mockRule);
    });

    expect(apiServiceMock.post).toHaveBeenCalledWith('templates/global-compound-rules', dto);
  });

  it('should update a rule', () => {
    apiServiceMock.put.mockReturnValue(of(mockRule));

    service.updateRule(1, { ruleName: 'Updated' }).subscribe((res) => {
      expect(res).toEqual(mockRule);
    });

    expect(apiServiceMock.put).toHaveBeenCalledWith('templates/global-compound-rules/1', {
      ruleName: 'Updated',
    });
  });

  it('should delete a rule', () => {
    apiServiceMock.delete.mockReturnValue(of({ message: 'Deleted' }));

    service.deleteRule(1).subscribe((res) => {
      expect(res).toEqual({ message: 'Deleted' });
    });

    expect(apiServiceMock.delete).toHaveBeenCalledWith('templates/global-compound-rules/1');
  });
});
