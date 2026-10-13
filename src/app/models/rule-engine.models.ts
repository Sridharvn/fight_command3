export type ComparisonOperator =
  | 'equals'
  | 'notEquals'
  | 'greaterThan'
  | 'lessThan'
  | 'in'
  | 'notIn';

export interface AtomicRule {
  fieldId: string;
  operator: ComparisonOperator;
  value: unknown;
}

export interface RuleGroup {
  conjunction: 'AND' | 'OR';
  conditions: (AtomicRule | RuleGroup)[];
}

export interface GlobalCompoundRule {
  ruleId: number;
  ruleName: string;
  description: string | null;
  conditions: RuleGroup;
  actions: RuleGroup;
  errorMessage: string;
  isActive: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  createdBy?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export interface CreateGlobalCompoundRuleDto {
  ruleName: string;
  description?: string;
  conditions: RuleGroup;
  actions: RuleGroup;
  errorMessage: string;
  isActive?: boolean;
}

export interface UpdateGlobalCompoundRuleDto {
  ruleName?: string;
  description?: string;
  conditions?: RuleGroup;
  actions?: RuleGroup;
  errorMessage?: string;
  isActive?: boolean;
}
