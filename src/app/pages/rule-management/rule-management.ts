import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RuleStore } from '../../stores/rule.store';
import { FormDefinitionStore } from '../../stores/form-definition.store';
import { FormDefinitionService } from '../../services/form-definition.service';
import { ComparisonOperator } from '../../models/rule-engine.models';
import { FormTemplate } from '../../models/form-definition.models';
import { BaseLayout } from '../../layouts/base-layout/base-layout';

export interface AvailableRuleField {
  id: string;
  key: string;
  label: string;
  type: string;
  options: any[];
  validationRules: Record<string, any>;
}

export type RuleBuilderType = 'selectionLimit' | 'condition' | 'requirement' | 'visibility';

@Component({
  selector: 'app-rule-management',
  imports: [BaseLayout, ReactiveFormsModule],
  templateUrl: './rule-management.html',
  styleUrl: './rule-management.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RuleManagementPage implements OnInit {
  protected readonly ruleStore = inject(RuleStore);
  protected readonly formDefinitionStore = inject(FormDefinitionStore);
  private readonly formDefinitionService = inject(FormDefinitionService);

  readonly selectedTemplateId = signal<number | 'global'>('global');
  readonly selectedRuleType = signal<RuleBuilderType>('selectionLimit');
  readonly isModalOpen = signal(false);
  readonly isSubmitting = signal(false);
  readonly actionSuccessMessage = signal<string | null>(null);

  readonly searchControl = new FormControl('');
  readonly searchQuery = signal('');

  // Selected full template details when a template is chosen
  readonly fullLoadedTemplate = signal<FormTemplate | null>(null);

  readonly selectedTemplate = computed(() => {
    const id = this.selectedTemplateId();
    if (id === 'global') return null;
    const loaded = this.fullLoadedTemplate();
    if (loaded && loaded.templateId === id) return loaded;
    return this.formDefinitionStore.templates().find((t) => t.templateId === id) || null;
  });

  // Available fields based on current scope (template or global master fields)
  readonly availableFields = computed<AvailableRuleField[]>(() => {
    const tmpl = this.selectedTemplate();
    if (tmpl) {
      if (tmpl.formSchema?.fields && Array.isArray(tmpl.formSchema.fields)) {
        return tmpl.formSchema.fields.map((f: any) => ({
          id: f.id || f.key,
          key: f.key || f.id,
          label: f.label || f.key,
          type: f.type || 'text',
          options: f.options || [],
          validationRules: f.validationRules || {},
        }));
      }
      if (tmpl.fields && Array.isArray(tmpl.fields)) {
        return tmpl.fields.map((f: any) => ({
          id: f.fieldDefinition?.fieldName || `field_${f.fieldDefinitionId}`,
          key: f.customFieldName || f.fieldDefinition?.fieldName || `field_${f.fieldDefinitionId}`,
          label:
            f.fieldLabelOverride || f.customFieldLabel || f.fieldDefinition?.fieldLabel || 'Field',
          type: f.fieldDefinition?.fieldType || 'text',
          options:
            (f.fieldDefinition?.defaultOptions as any)?.options ||
            (f.fieldOptions as any)?.options ||
            [],
          validationRules: (f.fieldDefinition?.validationRules as any) || {},
        }));
      }
      return [];
    }

    // Global scope uses master field definitions
    return this.formDefinitionStore.fieldDefinitions().map((f: any) => ({
      id: f.fieldName,
      key: f.fieldName,
      label: f.fieldLabel,
      type: f.fieldType,
      options: (f.defaultOptions as any)?.options || [],
      validationRules: (f.validationRules as any) || {},
    }));
  });

  // Checkbox fields (multiselect checkboxes with options) suitable for option selection limits
  readonly choiceFields = computed<AvailableRuleField[]>(() => {
    return this.availableFields().filter(
      (f: AvailableRuleField) => f.type === 'checkbox' && f.options && f.options.length > 0,
    );
  });

  // Displayed rules for the active scope
  readonly currentRules = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (this.selectedTemplateId() === 'global') {
      return this.ruleStore.filteredRules();
    }

    const tmpl = this.selectedTemplate();
    if (!tmpl) return [];
    const schemaRules: any[] =
      tmpl.formSchema?.compoundRules || (tmpl.formSchema as any)?.validations || [];

    if (!q) return schemaRules;
    return schemaRules.filter(
      (r) =>
        (r.ruleName && r.ruleName.toLowerCase().includes(q)) ||
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.description && r.description.toLowerCase().includes(q)) ||
        (r.errorMessage && r.errorMessage.toLowerCase().includes(q)),
    );
  });

  readonly totalRulesCount = computed(() => {
    if (this.selectedTemplateId() === 'global') {
      return this.ruleStore.totalRules();
    }
    return this.currentRules().length;
  });

  readonly ruleForm = new FormGroup({
    ruleType: new FormControl<RuleBuilderType>('selectionLimit'),
    ruleName: new FormControl('', [Validators.required, Validators.minLength(3)]),
    description: new FormControl(''),
    // Selection limit controls
    targetFieldId: new FormControl(''),
    limitType: new FormControl<'maxSelections' | 'minSelections'>('maxSelections'),
    limitCount: new FormControl<number>(3, [Validators.min(1)]),
    // Conditional logic controls
    conditionFieldId: new FormControl('age', [Validators.required]),
    conditionOperator: new FormControl<ComparisonOperator>('lessThan', [Validators.required]),
    conditionValue: new FormControl('18', [Validators.required]),
    actionFieldId: new FormControl('guardian_consent', [Validators.required]),
    actionOperator: new FormControl<ComparisonOperator>('equals', [Validators.required]),
    actionValue: new FormControl('true', [Validators.required]),
    errorMessage: new FormControl('', [Validators.required, Validators.minLength(3)]),
  });

  ngOnInit(): void {
    this.ruleStore.loadRules();
    this.formDefinitionStore.loadTemplates();
    this.formDefinitionStore.loadFieldDefinitions();

    this.searchControl.valueChanges.subscribe((val) => {
      this.searchQuery.set(val || '');
      this.ruleStore.setSearchQuery(val || '');
    });
  }

  onSelectTemplate(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    if (val === 'global') {
      this.selectedTemplateId.set('global');
      this.fullLoadedTemplate.set(null);
    } else {
      const templateId = Number(val);
      this.selectedTemplateId.set(templateId);
      // Fetch full template to ensure formSchema is populated
      this.formDefinitionService.getTemplateById(templateId).subscribe({
        next: (fullTmpl) => {
          this.fullLoadedTemplate.set(fullTmpl);
        },
        error: () => {
          // Fallback to list entry if individual fetch fails
        },
      });
    }
  }

  setRuleType(type: RuleBuilderType): void {
    this.selectedRuleType.set(type);
    this.ruleForm.patchValue({ ruleType: type });
    this.updateFormValidityForType(type);
  }

  private updateFormValidityForType(type: RuleBuilderType): void {
    if (type === 'selectionLimit') {
      const choice = this.choiceFields();
      if (choice.length > 0 && !this.ruleForm.value.targetFieldId) {
        this.ruleForm.patchValue({
          targetFieldId: choice[0].key || choice[0].id,
          errorMessage: `You can select at most ${this.ruleForm.value.limitCount || 3} options.`,
        });
      }
    } else {
      const fields = this.availableFields();
      if (fields.length > 0) {
        this.ruleForm.patchValue({
          conditionFieldId: fields[0]?.key || fields[0]?.id || 'age',
          actionFieldId: fields[1]?.key || fields[1]?.id || fields[0]?.key || 'consent',
        });
      }
    }
  }

  openCreateModal(): void {
    this.ruleStore.clearError();
    const isTmpl = this.selectedTemplateId() !== 'global';
    const fields = this.availableFields();
    const choices = this.choiceFields();

    const defaultType: RuleBuilderType =
      isTmpl && choices.length > 0 ? 'selectionLimit' : 'condition';
    this.selectedRuleType.set(defaultType);

    const defaultTarget = choices.length > 0 ? choices[0].key || choices[0].id : '';
    const defaultCondition = fields.length > 0 ? fields[0].key || fields[0].id : 'age';
    const defaultAction =
      fields.length > 1
        ? fields[1].key || fields[1].id
        : fields.length > 0
          ? fields[0].key || fields[0].id
          : 'guardian_consent';

    this.ruleForm.reset({
      ruleType: defaultType,
      ruleName: '',
      description: '',
      targetFieldId: defaultTarget,
      limitType: 'maxSelections',
      limitCount: 3,
      conditionFieldId: defaultCondition,
      conditionOperator: 'lessThan',
      conditionValue: '18',
      actionFieldId: defaultAction,
      actionOperator: 'equals',
      actionValue: 'true',
      errorMessage: defaultType === 'selectionLimit' ? 'You can select at most 3 options.' : '',
    });

    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  onLimitChange(): void {
    const val = this.ruleForm.getRawValue();
    const field = this.availableFields().find(
      (f: AvailableRuleField) => (f.key || f.id) === val.targetFieldId,
    );
    const label = field?.label || 'options';
    const count = val.limitCount || 3;
    const isMax = val.limitType === 'maxSelections';
    this.ruleForm.patchValue({
      errorMessage: isMax
        ? `Field "${label}" allows maximum ${count} selection${count > 1 ? 's' : ''}.`
        : `Field "${label}" requires at least ${count} selection${count > 1 ? 's' : ''}.`,
    });
  }

  onSubmit(): void {
    if (this.ruleForm.invalid) {
      this.ruleForm.markAllAsTouched();
      return;
    }

    const val = this.ruleForm.getRawValue();
    this.isSubmitting.set(true);

    const isGlobal = this.selectedTemplateId() === 'global';

    if (isGlobal) {
      // Parse values for global compound rule
      let condVal: any = val.conditionValue;
      if (val.conditionOperator === 'in' || val.conditionOperator === 'notIn') {
        if (typeof condVal === 'string') {
          condVal = condVal
            .split(',')
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0)
            .map((s: string) => (!isNaN(Number(s)) ? Number(s) : s));
        }
      } else if (typeof condVal === 'string' && condVal.trim() !== '' && !isNaN(Number(condVal))) {
        condVal = Number(condVal);
      } else if (condVal === 'true') {
        condVal = true;
      } else if (condVal === 'false') {
        condVal = false;
      }

      let actVal: any = val.actionValue;
      if (val.actionOperator === 'in' || val.actionOperator === 'notIn') {
        if (typeof actVal === 'string') {
          actVal = actVal
            .split(',')
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0)
            .map((s: string) => (!isNaN(Number(s)) ? Number(s) : s));
        }
      } else if (typeof actVal === 'string' && actVal.trim() !== '' && !isNaN(Number(actVal))) {
        actVal = Number(actVal);
      } else if (actVal === 'true') {
        actVal = true;
      } else if (actVal === 'false') {
        actVal = false;
      }

      this.ruleStore.createRule(
        {
          ruleName: val.ruleName!,
          description: val.description || undefined,
          conditions: {
            conjunction: 'AND',
            conditions: [
              {
                fieldId: val.conditionFieldId!,
                operator: val.conditionOperator!,
                value: condVal,
              },
            ],
          },
          actions: {
            conjunction: 'AND',
            conditions: [
              {
                fieldId: val.actionFieldId!,
                operator: val.actionOperator!,
                value: actVal,
              },
            ],
          },
          errorMessage: val.errorMessage!,
          isActive: true,
        },
        () => {
          this.isSubmitting.set(false);
          this.closeModal();
          this.showSuccessToast('Global rule created successfully');
        },
        () => {
          this.isSubmitting.set(false);
        },
      );
      return;
    }

    // Save to Template
    const templateId = this.selectedTemplateId() as number;
    const tmpl = this.selectedTemplate();
    if (!tmpl) {
      this.isSubmitting.set(false);
      return;
    }

    // Clone or initialize template formSchema
    const formSchema = tmpl.formSchema
      ? JSON.parse(JSON.stringify(tmpl.formSchema))
      : {
          templateName: tmpl.templateName,
          sportType: tmpl.sportType,
          tournamentType: tmpl.tournamentType,
          fields: this.availableFields(),
          compoundRules: [],
        };

    if (!formSchema.compoundRules) {
      formSchema.compoundRules = [];
    }

    if (val.ruleType === 'selectionLimit') {
      const fieldId = val.targetFieldId || '';
      const limitType = val.limitType || 'maxSelections';
      const limitCount = Number(val.limitCount) || 3;

      // 1. Update field validationRules directly on schema field
      if (Array.isArray(formSchema.fields)) {
        const targetField = formSchema.fields.find((f: any) => (f.key || f.id) === fieldId);
        if (targetField) {
          targetField.validationRules = {
            ...(targetField.validationRules || {}),
            [limitType]: limitCount,
          };
        }
      }

      // 2. Add compound rule for cross-field verification
      const isMax = limitType === 'maxSelections';
      const newCompoundRule = {
        ruleId: Date.now(),
        ruleName: val.ruleName,
        description: val.description || null,
        errorMessage: val.errorMessage,
        conditions: {
          conjunction: 'AND',
          conditions: [
            {
              fieldId,
              operator: isMax ? 'countGreaterThan' : 'countLessThan',
              value: limitCount,
            },
          ],
        },
        actions: {
          conjunction: 'AND',
          conditions: [
            {
              fieldId,
              operator: isMax ? 'countMax' : 'countMin',
              value: limitCount,
            },
          ],
        },
        isActive: true,
      };

      formSchema.compoundRules = [newCompoundRule, ...formSchema.compoundRules];
    } else {
      // Conditional or requirement rule
      let condVal: any = val.conditionValue;
      if (typeof condVal === 'string' && !isNaN(Number(condVal)) && condVal.trim() !== '') {
        condVal = Number(condVal);
      } else if (condVal === 'true') condVal = true;
      else if (condVal === 'false') condVal = false;

      let actVal: any = val.actionValue;
      if (typeof actVal === 'string' && !isNaN(Number(actVal)) && actVal.trim() !== '') {
        actVal = Number(actVal);
      } else if (actVal === 'true') actVal = true;
      else if (actVal === 'false') actVal = false;

      const newCompoundRule = {
        ruleId: Date.now(),
        ruleName: val.ruleName,
        description: val.description || null,
        errorMessage: val.errorMessage,
        actionType:
          val.ruleType === 'requirement'
            ? 'require'
            : val.ruleType === 'visibility'
              ? 'show'
              : 'assert',
        conditions: {
          conjunction: 'AND',
          conditions: [
            {
              fieldId: val.conditionFieldId!,
              operator: val.conditionOperator!,
              value: condVal,
            },
          ],
        },
        actions: {
          conjunction: 'AND',
          conditions: [
            {
              fieldId:
                val.ruleType === 'requirement' || val.ruleType === 'visibility'
                  ? val.targetFieldId!
                  : val.actionFieldId!,
              operator: val.actionOperator!,
              value: actVal,
            },
          ],
        },
        isActive: true,
      };

      formSchema.compoundRules = [newCompoundRule, ...formSchema.compoundRules];
    }

    this.formDefinitionService.updateTemplate(templateId, { formSchema }).subscribe({
      next: (updatedTmpl) => {
        this.fullLoadedTemplate.set(updatedTmpl);
        this.formDefinitionStore.loadTemplates();
        this.isSubmitting.set(false);
        this.closeModal();
        this.showSuccessToast('Rule saved to template successfully!');
      },
      error: (err) => {
        this.isSubmitting.set(false);
        alert(err?.error?.message || 'Failed to update template rules. Please verify permissions.');
      },
    });
  }

  onDelete(id: number | string): void {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    if (this.selectedTemplateId() === 'global') {
      this.ruleStore.deleteRule(Number(id));
      return;
    }

    const templateId = this.selectedTemplateId() as number;
    const tmpl = this.selectedTemplate();
    if (!tmpl || !tmpl.formSchema) return;

    const formSchema = JSON.parse(JSON.stringify(tmpl.formSchema));
    if (Array.isArray(formSchema.compoundRules)) {
      formSchema.compoundRules = formSchema.compoundRules.filter(
        (r: any) => r.ruleId !== id && r.id !== id,
      );
    }
    if (Array.isArray(formSchema.validations)) {
      formSchema.validations = formSchema.validations.filter(
        (r: any) => r.ruleId !== id && r.id !== id,
      );
    }

    this.formDefinitionService.updateTemplate(templateId, { formSchema }).subscribe({
      next: (updatedTmpl) => {
        this.fullLoadedTemplate.set(updatedTmpl);
        this.formDefinitionStore.loadTemplates();
        this.showSuccessToast('Rule removed from template.');
      },
      error: (err) => {
        alert(err?.error?.message || 'Failed to remove rule from template.');
      },
    });
  }

  private showSuccessToast(msg: string): void {
    this.actionSuccessMessage.set(msg);
    setTimeout(() => this.actionSuccessMessage.set(null), 3500);
  }

  getSportName(sportType?: number): string {
    const map: Record<number, string> = {
      1: 'Sambo',
      2: 'MMA',
      3: 'Boxing',
      4: 'Kickboxing',
      5: 'Muay Thai',
      6: 'BJJ',
      7: 'Judo',
      8: 'Wrestling',
      9: 'Karate',
      10: 'Taekwondo',
    };
    return (sportType && map[sportType]) || 'Combat Sport';
  }
}
