export type FormFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'date'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'file'
  | 'boolean';

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
  value: any; // Literal or { $field: string }
}

export interface RuleGroup {
  conjunction: 'AND' | 'OR';
  conditions: (AtomicRule | RuleGroup)[];
}

export interface CrossFieldValidation {
  id: string;
  name: string;
  errorMessage: string;
  when: RuleGroup;
  then: RuleGroup;
}

export interface FormFieldValidationRules {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
}

export interface FormFieldOption {
  label: string;
  value: any;
}

export interface FormField {
  id: string;
  key: string;
  label: string;
  description?: string;
  helpText?: string;
  placeholder?: string;
  type: FormFieldType;
  options?: FormFieldOption[];
  required?: boolean;
  defaultValue?: any;
  validationRules?: FormFieldValidationRules;
  columnSpan?: 1 | 2; // Support responsive 2-column paired layout
  isSystemField?: boolean; // Locked for Full Name & Email
  isInherited?: boolean; // Inherited from base preset, locked on canvas
  fieldDefinitionId?: number; // Origin custom field definition ID
}

export interface FormDefinition {
  id?: string | number;
  templateName: string;
  description?: string;
  sportType: number;
  tournamentType: number;
  version?: string;
  fields: FormField[];
  validations: CrossFieldValidation[];
}
