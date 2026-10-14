import { GlobalCompoundRule } from './rule-engine.models';

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'file'
  | 'boolean';

export interface FieldDefinition {
  fieldDefinitionId: number;
  fieldName: string;
  fieldLabel: string;
  fieldType: FieldType;
  isFilterable: boolean;
  isSortable: boolean;
  isSearchable: boolean;
  isGlobal: boolean;
  filterType?: string;
  validationRules?: Record<string, unknown> | null;
  defaultOptions?: { options: string[] } | Record<string, unknown> | null;
  isActive?: boolean;
  createdAt?: string;
}

export interface CreateFieldDefinitionDto {
  fieldName: string;
  fieldLabel: string;
  fieldType: FieldType;
  isFilterable?: boolean;
  isSortable?: boolean;
  isSearchable?: boolean;
  isGlobal?: boolean;
  filterType?: string;
  validationRules?: Record<string, unknown>;
  defaultOptions?: { options: string[] };
}

export interface FormTemplateField {
  templateFieldId?: number;
  fieldDefinitionId: number;
  fieldDefinition?: FieldDefinition;
  displayOrder: number;
  isRequired: boolean;
  isInherited?: boolean;
  fieldLabelOverride?: string | null;
  fieldOptions?: { options: string[] } | null;
}

export interface FormTemplate {
  templateId: number;
  templateName: string;
  templateType: 'PRESET' | 'CUSTOM';
  sportType: number;
  tournamentType: number;
  isActive: boolean;
  parentTemplateId?: number | null;
  fields?: FormTemplateField[];
  formSchema?: any;
  createdAt?: string;
}

export interface CreateTemplateDto {
  templateName: string;
  sportType: number;
  tournamentType: number;
  parentTemplateId?: number;
  formSchema?: any;
  fields?: {
    fieldDefinitionId: number;
    displayOrder: number;
    isRequired: boolean;
    fieldLabelOverride?: string;
    fieldOptions?: { options: string[] };
  }[];
}

export interface UpdateTemplateDto {
  templateName?: string;
  sportType?: number;
  tournamentType?: number;
  formSchema?: any;
  fields?: {
    fieldDefinitionId: number;
    displayOrder: number;
    isRequired: boolean;
    fieldLabelOverride?: string;
    fieldOptions?: { options: string[] };
  }[];
}
