import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormDefinitionStore } from '../../stores/form-definition.store';
import { RuleStore } from '../../stores/rule.store';
import { FormDefinitionService } from '../../services/form-definition.service';
import {
  FieldDefinition as LibFieldDefinition,
  FieldType,
} from '../../models/form-definition.models';
import { RouterLink } from '@angular/router';
import { BaseLayout } from '../../layouts/base-layout/base-layout';

export interface FieldValidationRules {
  required?: boolean;
  minLength?: number | null;
  maxLength?: number | null;
  min?: number | null;
  max?: number | null;
  pattern?: string | null;
  minSelections?: number | null;
  maxSelections?: number | null;
  allowedExtensions?: string[] | string | null;
  maxSizeMb?: number | null;
}

export function toSnakeCase(str: string): string {
  if (!str) return '';
  return str
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

@Component({
  selector: 'app-form-definitions',
  imports: [BaseLayout, ReactiveFormsModule],
  templateUrl: './form-definitions.html',
  styleUrl: './form-definitions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormDefinitionsPage implements OnInit {
  protected readonly formStore = inject(FormDefinitionStore);
  protected readonly ruleStore = inject(RuleStore);
  protected readonly formDefinitionService = inject(FormDefinitionService);

  readonly isFieldModalOpen = signal(false);
  readonly editingFieldId = signal<number | null>(null);
  readonly optionsList = signal<string[]>([]);
  readonly newOptionInput = new FormControl('');
  readonly isSubmitting = signal(false);

  readonly searchControl = new FormControl('');

  // Field form with base type, options, and dynamic validation rules
  readonly isKeyManuallyEdited = signal(false);

  readonly fieldForm = new FormGroup({
    fieldName: new FormControl('', [Validators.required, Validators.pattern(/^[a-z0-9_]+$/)]),
    fieldLabel: new FormControl('', [Validators.required]),
    fieldType: new FormControl<FieldType>('text', [Validators.required]),
    isFilterable: new FormControl(true),
    isSortable: new FormControl(true),
    isSearchable: new FormControl(true),
    // Validation rules
    required: new FormControl(false),
    minLength: new FormControl<number | null>(null),
    maxLength: new FormControl<number | null>(null),
    min: new FormControl<number | null>(null),
    max: new FormControl<number | null>(null),
    pattern: new FormControl(''),
    minSelections: new FormControl<number | null>(null),
    maxSelections: new FormControl<number | null>(null),
    allowedExtensions: new FormControl(''),
    maxSizeMb: new FormControl<number | null>(null),
  });

  ngOnInit(): void {
    this.formStore.loadFieldDefinitions();
    this.ruleStore.loadRules();

    this.searchControl.valueChanges.subscribe((val) => {
      this.formStore.setSearchQuery(val || '');
    });

    this.fieldForm.get('fieldLabel')?.valueChanges.subscribe((label) => {
      if (this.editingFieldId() === null && !this.isKeyManuallyEdited()) {
        const generatedKey = toSnakeCase(label || '');
        this.fieldForm.get('fieldName')?.setValue(generatedKey, { emitEvent: false });
      }
    });

    this.fieldForm.get('fieldType')?.valueChanges.subscribe((type) => {
      if (type !== 'checkbox') {
        this.fieldForm.patchValue({ minSelections: null, maxSelections: null });
      }
    });
  }

  onKeyManualInput(): void {
    this.isKeyManuallyEdited.set(true);
  }

  syncKeyFromLabel(): void {
    this.isKeyManuallyEdited.set(false);
    const currentLabel = this.fieldForm.get('fieldLabel')?.value || '';
    const generatedKey = toSnakeCase(currentLabel);
    this.fieldForm.get('fieldName')?.setValue(generatedKey);
    this.fieldForm.get('fieldName')?.markAsDirty();
  }

  switchTab(tab: 'templates' | 'fields'): void {
    this.formStore.setActiveTab(tab);
    this.searchControl.setValue('');
  }

  // ── Field Modal ────────────────────────────────────────────────────────────
  openCreateFieldModal(): void {
    this.editingFieldId.set(null);
    this.isKeyManuallyEdited.set(false);
    this.fieldForm.reset({
      fieldName: '',
      fieldLabel: '',
      fieldType: 'text',
      isFilterable: true,
      isSortable: true,
      isSearchable: true,
      required: false,
      minLength: null,
      maxLength: null,
      min: null,
      max: null,
      pattern: '',
      minSelections: null,
      maxSelections: null,
      allowedExtensions: '',
      maxSizeMb: null,
    });
    this.fieldForm.get('fieldName')?.enable();
    this.optionsList.set([]);
    this.newOptionInput.reset();
    this.isFieldModalOpen.set(true);
  }

  openFieldModal(): void {
    this.openCreateFieldModal();
  }

  openEditFieldModal(field: LibFieldDefinition): void {
    this.editingFieldId.set(field.fieldDefinitionId);
    this.isKeyManuallyEdited.set(false);

    // Parse options
    let opts: string[] = [];
    const rawOpts = (field.defaultOptions as any)?.options;
    if (Array.isArray(rawOpts)) {
      opts = rawOpts.map((o) => (typeof o === 'string' ? o : o.label || o.value || String(o)));
    }
    this.optionsList.set(opts);
    this.newOptionInput.reset();

    // Parse validation rules
    const rules: FieldValidationRules = (field.validationRules as FieldValidationRules) || {};

    this.fieldForm.reset({
      fieldName: field.fieldName,
      fieldLabel: field.fieldLabel,
      fieldType: field.fieldType,
      isFilterable: !!field.isFilterable,
      isSortable: !!field.isSortable,
      isSearchable: !!field.isSearchable,
      required: !!rules.required,
      minLength: rules.minLength ?? null,
      maxLength: rules.maxLength ?? null,
      min: rules.min ?? null,
      max: rules.max ?? null,
      pattern: rules.pattern ?? '',
      minSelections: rules.minSelections ?? null,
      maxSelections: rules.maxSelections ?? null,
      allowedExtensions: Array.isArray(rules.allowedExtensions)
        ? rules.allowedExtensions.join(', ')
        : (rules.allowedExtensions ?? ''),
      maxSizeMb: rules.maxSizeMb ?? null,
    });
    this.fieldForm.get('fieldName')?.disable();
    this.isFieldModalOpen.set(true);
  }

  closeFieldModal(): void {
    this.isFieldModalOpen.set(false);
    this.editingFieldId.set(null);
    this.optionsList.set([]);
    this.newOptionInput.reset();
  }

  addOption(opt?: string): void {
    const value = (opt !== undefined ? opt : this.newOptionInput.value || '').trim();
    if (!value) return;

    const current = this.optionsList();
    if (current.some((existing) => existing.toLowerCase() === value.toLowerCase())) {
      return;
    }

    this.optionsList.update((list) => [...list, value]);
    this.newOptionInput.reset();
  }

  removeOption(index: number): void {
    this.optionsList.update((list) => list.filter((_, i) => i !== index));
  }

  onSubmitField(): void {
    if (this.fieldForm.invalid) {
      this.fieldForm.markAllAsTouched();
      return;
    }

    const val = this.fieldForm.getRawValue();
    this.isSubmitting.set(true);

    let defaultOptions: { options: string[] } | undefined;
    if (['select', 'radio', 'checkbox'].includes(val.fieldType!) && this.optionsList().length > 0) {
      defaultOptions = { options: [...this.optionsList()] };
    }

    const rules: FieldValidationRules = {};
    if (val.required) rules.required = true;

    if (['text', 'textarea'].includes(val.fieldType!)) {
      if (val.minLength != null && (val.minLength as any) !== '')
        rules.minLength = Number(val.minLength);
      if (val.maxLength != null && (val.maxLength as any) !== '')
        rules.maxLength = Number(val.maxLength);
      if (val.pattern?.trim()) rules.pattern = val.pattern.trim();
    } else if (val.fieldType === 'number') {
      if (val.min != null && (val.min as any) !== '') rules.min = Number(val.min);
      if (val.max != null && (val.max as any) !== '') rules.max = Number(val.max);
    } else if (val.fieldType === 'checkbox') {
      if (val.minSelections != null && (val.minSelections as any) !== '')
        rules.minSelections = Number(val.minSelections);
      if (val.maxSelections != null && (val.maxSelections as any) !== '')
        rules.maxSelections = Number(val.maxSelections);
    } else if (val.fieldType === 'file') {
      if (val.allowedExtensions?.trim()) {
        rules.allowedExtensions = val.allowedExtensions
          .split(',')
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean);
      }
      if (val.maxSizeMb != null && (val.maxSizeMb as any) !== '')
        rules.maxSizeMb = Number(val.maxSizeMb);
    }

    const validationRules =
      Object.keys(rules).length > 0 ? (rules as Record<string, unknown>) : undefined;

    const editId = this.editingFieldId();
    if (editId) {
      this.formStore.updateFieldDefinition({
        id: editId,
        dto: {
          fieldName: val.fieldName!,
          fieldLabel: val.fieldLabel!,
          fieldType: val.fieldType!,
          defaultOptions,
          validationRules,
          isFilterable: !!val.isFilterable,
          isSortable: !!val.isSortable,
          isSearchable: !!val.isSearchable,
        },
      });
    } else {
      this.formStore.createFieldDefinition({
        fieldName: val.fieldName!,
        fieldLabel: val.fieldLabel!,
        fieldType: val.fieldType!,
        defaultOptions,
        validationRules,
        isFilterable: !!val.isFilterable,
        isSortable: !!val.isSortable,
        isSearchable: !!val.isSearchable,
        isGlobal: true,
      });
    }

    setTimeout(() => {
      this.isSubmitting.set(false);
      this.closeFieldModal();
    }, 200);
  }

  formatRulesSummary(field: LibFieldDefinition): string[] {
    const rules: FieldValidationRules = (field.validationRules as FieldValidationRules) || {};
    const badges: string[] = [];
    if (rules.required) badges.push('Required');
    if (field.fieldType === 'checkbox') {
      if (rules.minSelections != null) badges.push(`Min Pick: ${rules.minSelections}`);
      if (rules.maxSelections != null) badges.push(`Max Pick: ${rules.maxSelections}`);
    }
    if (rules.minLength != null) badges.push(`Min Len: ${rules.minLength}`);
    if (rules.maxLength != null) badges.push(`Max Len: ${rules.maxLength}`);
    if (rules.min != null) badges.push(`Min: ${rules.min}`);
    if (rules.max != null) badges.push(`Max: ${rules.max}`);
    if (rules.allowedExtensions && Array.isArray(rules.allowedExtensions)) {
      badges.push(`Ext: ${rules.allowedExtensions.join('/')}`);
    }
    if (rules.maxSizeMb != null) badges.push(`Max: ${rules.maxSizeMb}MB`);
    return badges;
  }

  getOptionsList(field: LibFieldDefinition): string[] {
    const raw = (field.defaultOptions as any)?.options;
    if (Array.isArray(raw)) {
      return raw.map((o) => (typeof o === 'string' ? o : o.label || o.value || String(o)));
    }
    return [];
  }

  onDeleteField(id: number): void {
    if (confirm('Are you sure you want to delete this field definition?')) {
      this.formStore.deleteFieldDefinition(id);
    }
  }
}
