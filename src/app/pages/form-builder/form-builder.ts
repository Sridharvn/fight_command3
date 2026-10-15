import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { BaseLayout } from '../../layouts/base-layout/base-layout';
import { DynamicFormRendererComponent } from '../../components/dynamic-form-renderer/dynamic-form-renderer';
import { FormBuilderStore } from '../../stores/form-builder.store';
import { FormDefinitionStore } from '../../stores/form-definition.store';
import { FormDefinitionService } from '../../services/form-definition.service';
import { RuleStore } from '../../stores/rule.store';
import {
  ComparisonOperator,
  CrossFieldValidation,
  FormDefinition,
  FormField,
  FormFieldType,
} from '../../models/dynamic-form.models';
import { FieldDefinition } from '../../models/form-definition.models';

@Component({
  selector: 'app-form-builder',
  imports: [
    BaseLayout,
    DynamicFormRendererComponent,
    DragDropModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './form-builder.html',
  styleUrl: './form-builder.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormBuilderPage implements OnInit {
  protected readonly builderStore = inject(FormBuilderStore);
  protected readonly formDefStore = inject(FormDefinitionStore);
  private readonly formDefinitionService = inject(FormDefinitionService);
  protected readonly ruleStore = inject(RuleStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly activeTab = signal<'canvas' | 'rules' | 'settings'>('canvas');
  readonly isRuleModalOpen = signal(false);
  readonly saveSuccessMessage = signal<string | null>(null);

  // Field Palette Types
  readonly paletteTypes: { type: FormFieldType; label: string; icon: string }[] = [
    { type: 'text', label: 'Text Input', icon: 'T' },
    { type: 'number', label: 'Number', icon: '#' },
    { type: 'email', label: 'Email', icon: '@' },
    { type: 'select', label: 'Dropdown', icon: '▼' },
    { type: 'radio', label: 'Radio Group', icon: '◉' },
    { type: 'checkbox', label: 'Checkbox', icon: '☑' },
    { type: 'boolean', label: 'Toggle Switch', icon: '◨' },
    { type: 'date', label: 'Date Picker', icon: '📅' },
    { type: 'textarea', label: 'Text Area', icon: '¶' },
  ];

  readonly activeRuleType = signal<'condition' | 'selectionLimit'>('condition');

  readonly choiceFields = computed<FormField[]>(() => {
    return (
      this.builderStore
        .template()
        ?.fields.filter(
          (f) =>
            (f.options && f.options.length > 0) ||
            f.type === 'select' ||
            f.type === 'radio' ||
            f.type === 'checkbox',
        ) || []
    );
  });

  // Rule Modal Form
  readonly ruleForm = new FormGroup({
    ruleType: new FormControl<'condition' | 'selectionLimit'>('condition'),
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    errorMessage: new FormControl('', [Validators.required, Validators.minLength(3)]),
    targetFieldId: new FormControl(''),
    limitType: new FormControl<'maxSelections' | 'minSelections'>('maxSelections'),
    limitCount: new FormControl<number>(3, [Validators.min(1)]),
    whenField: new FormControl('', [Validators.required]),
    whenOperator: new FormControl<ComparisonOperator>('equals', [Validators.required]),
    whenValue: new FormControl('', [Validators.required]),
    thenField: new FormControl('', [Validators.required]),
    thenOperator: new FormControl<ComparisonOperator>('equals', [Validators.required]),
    thenValue: new FormControl('', [Validators.required]),
  });

  ngOnInit(): void {
    this.formDefStore.loadFieldDefinitions();

    const templateId = this.route.snapshot.paramMap.get('id');
    const basePresetId = this.route.snapshot.queryParamMap.get('basePresetId');
    const cloneFrom = this.route.snapshot.queryParamMap.get('cloneFrom');

    if (templateId && templateId !== 'new') {
      this.loadTemplate(+templateId);
    } else if (basePresetId) {
      this.loadBasePreset(+basePresetId);
    } else if (cloneFrom) {
      this.loadCloneTemplate(+cloneFrom);
    } else {
      this.builderStore.initNewTemplate(1, 1);
    }

    this.ruleStore.loadRules?.();
  }

  onUpdateTemplateSettings(
    settings: Partial<
      Pick<FormDefinition, 'sportType' | 'tournamentType' | 'description' | 'templateName'>
    >,
  ): void {
    this.builderStore.updateTemplateMetadata(settings);
  }

  private loadBasePreset(presetId: number): void {
    this.formDefinitionService.getTemplateById(presetId).subscribe({
      next: (tmpl) => {
        const fields: FormField[] = (tmpl.fields || []).map((tf) => ({
          id: `field_inherited_${tf.fieldDefinitionId}`,
          fieldDefinitionId: tf.fieldDefinitionId,
          key: tf.fieldDefinition?.fieldName || `field_${tf.fieldDefinitionId}`,
          label: tf.fieldLabelOverride || tf.fieldDefinition?.fieldLabel || 'Field',
          type: (tf.fieldDefinition?.fieldType || 'text') as FormFieldType,
          required: tf.isRequired,
          columnSpan: 1,
          isInherited: true,
        }));

        this.builderStore.setTemplate({
          templateName: `${tmpl.templateName} (Derived)`,
          sportType: tmpl.sportType,
          tournamentType: tmpl.tournamentType,
          fields,
          validations: [],
        });
      },
      error: () => {
        this.builderStore.initNewTemplate(1, 1);
      },
    });
  }

  private loadCloneTemplate(cloneId: number): void {
    this.formDefinitionService.getTemplateById(cloneId).subscribe({
      next: (tmpl) => {
        const fields: FormField[] = (tmpl.fields || []).map((tf) => ({
          id: `field_${Date.now()}_${tf.fieldDefinitionId}`,
          fieldDefinitionId: tf.fieldDefinitionId,
          key: tf.fieldDefinition?.fieldName || `field_${tf.fieldDefinitionId}`,
          label: tf.fieldLabelOverride || tf.fieldDefinition?.fieldLabel || 'Field',
          type: (tf.fieldDefinition?.fieldType || 'text') as FormFieldType,
          required: tf.isRequired,
          columnSpan: 1,
        }));

        this.builderStore.setTemplate({
          templateName: `${tmpl.templateName} (Copy)`,
          sportType: tmpl.sportType,
          tournamentType: tmpl.tournamentType,
          fields,
          validations: [],
        });
      },
      error: () => {
        this.builderStore.initNewTemplate(1, 1);
      },
    });
  }

  private loadTemplate(id: number): void {
    this.formDefinitionService.getTemplateById(id).subscribe({
      next: (tmpl) => {
        let fields: FormField[] = [];

        // 1. If formSchema has complete FormField definitions, use them
        const schemaFields = tmpl.formSchema?.fields as any[];
        if (Array.isArray(schemaFields) && schemaFields.length > 0 && schemaFields[0]?.key) {
          fields = schemaFields as FormField[];
        } else if (tmpl.fields && tmpl.fields.length > 0) {
          // 2. Otherwise map from backend template fields
          fields = tmpl.fields.map((tf: any) => ({
            id: `field_${tf.fieldDefinitionId || tf.templateFieldId}`,
            fieldDefinitionId: tf.fieldDefinitionId,
            key:
              tf.customFieldName ||
              tf.fieldDefinition?.fieldName ||
              `field_${tf.fieldDefinitionId}`,
            label:
              tf.fieldLabelOverride ||
              tf.customFieldLabel ||
              tf.fieldDefinition?.fieldLabel ||
              'Field',
            type: (tf.fieldDefinition?.fieldType || 'text') as FormFieldType,
            required: tf.isRequired,
            columnSpan: 1,
            options: (tf.fieldDefinition?.defaultOptions as any)?.options
              ? (tf.fieldDefinition.defaultOptions as any).options.map((opt: string) => ({
                  label: opt,
                  value: opt.toLowerCase().replace(/[^a-z0-9]/g, '_'),
                }))
              : undefined,
          }));
        }

        const compoundRules: CrossFieldValidation[] =
          tmpl.formSchema?.compoundRules?.map((r: any) => ({
            id: `rule_${r.ruleId || Date.now()}`,
            name: r.ruleName,
            errorMessage: r.errorMessage,
            when: r.conditions as any,
            then: r.actions as any,
          })) || [];

        this.builderStore.setTemplate({
          id: tmpl.templateId,
          templateName: tmpl.templateName,
          sportType: tmpl.sportType,
          tournamentType: tmpl.tournamentType,
          fields,
          validations: compoundRules,
        });
      },
      error: (err) => {
        this.builderStore.setError('Failed to load template');
      },
    });
  }

  onDropField(event: CdkDragDrop<FormField[]>): void {
    this.builderStore.moveField(event.previousIndex, event.currentIndex);
  }

  onAddField(type: FormFieldType, label?: string): void {
    this.builderStore.addField(type, label || `New ${type} field`);
  }

  onAddFieldFromDefinition(def: FieldDefinition): void {
    this.builderStore.addFieldFromDefinition(def);
  }

  onSelectField(fieldId: string): void {
    this.builderStore.setActiveField(fieldId);
  }

  onUpdateFieldLabel(fieldId: string, event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.builderStore.updateField(fieldId, { label: val });
  }

  onUpdateFieldPlaceholder(fieldId: string, event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.builderStore.updateField(fieldId, { placeholder: val });
  }

  onToggleFieldRequired(fieldId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.builderStore.updateField(fieldId, { required: checked });
  }

  onToggleColumnSpan(fieldId: string): void {
    const field = this.builderStore.template()?.fields.find((f) => f.id === fieldId);
    if (!field) return;
    this.builderStore.updateField(fieldId, {
      columnSpan: field.columnSpan === 2 ? 1 : 2,
    });
  }

  onDuplicateField(fieldId: string): void {
    this.builderStore.duplicateField(fieldId);
  }

  onRemoveField(fieldId: string): void {
    this.builderStore.removeField(fieldId);
  }

  onAddOption(fieldId: string): void {
    const field = this.builderStore.template()?.fields.find((f) => f.id === fieldId);
    const count = (field?.options?.length || 0) + 1;
    this.builderStore.addFieldOption(fieldId, {
      label: `Option ${count}`,
      value: `option_${count}`,
    });
  }

  onUpdateOptionLabel(fieldId: string, index: number, event: Event): void {
    const label = (event.target as HTMLInputElement).value;
    const value = label.toLowerCase().replace(/[^a-z0-9]/g, '_');
    this.builderStore.updateFieldOption(fieldId, index, { label, value });
  }

  onRemoveOption(fieldId: string, index: number): void {
    this.builderStore.removeFieldOption(fieldId, index);
  }

  openLivePreview(): void {
    this.builderStore.setPreviewOpen(true);
  }

  closeLivePreview(): void {
    this.builderStore.setPreviewOpen(false);
  }

  onPreviewSubmit(data: Record<string, any>): void {
    alert(`Preview Submission Successful!\n\nPayload:\n${JSON.stringify(data, null, 2)}`);
  }

  // Cross-Field Validations
  setRuleType(type: 'condition' | 'selectionLimit'): void {
    this.activeRuleType.set(type);
    this.ruleForm.patchValue({ ruleType: type });
    if (type === 'selectionLimit') {
      const choices = this.choiceFields();
      const defaultField = choices[0]?.key || '';
      if (!this.ruleForm.value.targetFieldId) {
        this.ruleForm.patchValue({
          targetFieldId: defaultField,
          errorMessage: `You can select at most ${this.ruleForm.value.limitCount || 3} options.`,
        });
      }
      this.ruleForm.get('whenField')?.clearValidators();
      this.ruleForm.get('whenOperator')?.clearValidators();
      this.ruleForm.get('whenValue')?.clearValidators();
      this.ruleForm.get('thenField')?.clearValidators();
      this.ruleForm.get('thenOperator')?.clearValidators();
      this.ruleForm.get('thenValue')?.clearValidators();
      this.ruleForm.get('targetFieldId')?.setValidators([Validators.required]);
      this.ruleForm.get('limitCount')?.setValidators([Validators.required, Validators.min(1)]);
    } else {
      const fields = this.builderStore.template()?.fields || [];
      if (!this.ruleForm.value.whenField && fields.length > 0) {
        this.ruleForm.patchValue({
          whenField: fields[0]?.key || '',
          thenField: fields[1]?.key || fields[0]?.key || '',
        });
      }
      this.ruleForm.get('targetFieldId')?.clearValidators();
      this.ruleForm.get('limitCount')?.clearValidators();
      this.ruleForm.get('whenField')?.setValidators([Validators.required]);
      this.ruleForm.get('whenOperator')?.setValidators([Validators.required]);
      this.ruleForm.get('whenValue')?.setValidators([Validators.required]);
      this.ruleForm.get('thenField')?.setValidators([Validators.required]);
      this.ruleForm.get('thenOperator')?.setValidators([Validators.required]);
      this.ruleForm.get('thenValue')?.setValidators([Validators.required]);
    }
    this.ruleForm.get('whenField')?.updateValueAndValidity();
    this.ruleForm.get('whenOperator')?.updateValueAndValidity();
    this.ruleForm.get('whenValue')?.updateValueAndValidity();
    this.ruleForm.get('thenField')?.updateValueAndValidity();
    this.ruleForm.get('thenOperator')?.updateValueAndValidity();
    this.ruleForm.get('thenValue')?.updateValueAndValidity();
    this.ruleForm.get('targetFieldId')?.updateValueAndValidity();
    this.ruleForm.get('limitCount')?.updateValueAndValidity();
  }

  onLimitChange(): void {
    const val = this.ruleForm.getRawValue();
    const field = this.builderStore.template()?.fields.find((f) => f.key === val.targetFieldId);
    const label = field?.label || 'options';
    const count = val.limitCount || 3;
    const isMax = val.limitType === 'maxSelections';
    this.ruleForm.patchValue({
      errorMessage: isMax
        ? `Field "${label}" allows maximum ${count} selection${count > 1 ? 's' : ''}.`
        : `Field "${label}" requires at least ${count} selection${count > 1 ? 's' : ''}.`,
    });
  }

  openAddRuleModal(): void {
    const fields = this.builderStore.template()?.fields || [];
    const choices = this.choiceFields();
    const defaultType: 'condition' | 'selectionLimit' =
      choices.length > 0 ? 'selectionLimit' : 'condition';

    this.ruleForm.reset({
      ruleType: defaultType,
      name: '',
      errorMessage: defaultType === 'selectionLimit' ? 'You can select at most 3 options.' : '',
      targetFieldId: choices[0]?.key || '',
      limitType: 'maxSelections',
      limitCount: 3,
      whenField: fields[0]?.key || '',
      whenOperator: 'equals',
      whenValue: '',
      thenField: fields[1]?.key || fields[0]?.key || '',
      thenOperator: 'equals',
      thenValue: '',
    });
    this.setRuleType(defaultType);
    this.isRuleModalOpen.set(true);
  }

  closeRuleModal(): void {
    this.isRuleModalOpen.set(false);
  }

  onSaveRule(): void {
    if (this.ruleForm.invalid) {
      this.ruleForm.markAllAsTouched();
      return;
    }

    const val = this.ruleForm.getRawValue();
    if (val.ruleType === 'selectionLimit') {
      const fieldKey = val.targetFieldId || '';
      const limitType = val.limitType || 'maxSelections';
      const limitCount = Number(val.limitCount) || 3;
      const isMax = limitType === 'maxSelections';

      // 1. Update validationRules on the field in template
      const targetField = this.builderStore.template()?.fields.find((f) => f.key === fieldKey);
      if (targetField) {
        this.builderStore.updateField(targetField.id, {
          validationRules: {
            ...(targetField.validationRules || {}),
            [limitType]: limitCount,
          },
        });
      }

      // 2. Add compound validation rule
      const rule: CrossFieldValidation = {
        id: `rule_${Date.now()}`,
        name: val.name!,
        errorMessage: val.errorMessage!,
        when: {
          conjunction: 'AND',
          conditions: [
            {
              fieldId: fieldKey,
              operator: isMax ? 'countGreaterThan' : 'countLessThan',
              value: limitCount,
            },
          ],
        },
        then: {
          conjunction: 'AND',
          conditions: [
            {
              fieldId: fieldKey,
              operator: isMax ? 'countMax' : 'countMin',
              value: limitCount,
            },
          ],
        },
      };
      this.onAddCompoundRule(rule);
    } else {
      const rule: CrossFieldValidation = {
        id: `rule_${Date.now()}`,
        name: val.name!,
        errorMessage: val.errorMessage!,
        when: {
          conjunction: 'AND',
          conditions: [
            {
              fieldId: val.whenField!,
              operator: val.whenOperator!,
              value: this.parseValue(val.whenValue),
            },
          ],
        },
        then: {
          conjunction: 'AND',
          conditions: [
            {
              fieldId: val.thenField!,
              operator: val.thenOperator!,
              value: this.parseValue(val.thenValue),
            },
          ],
        },
      };
      this.onAddCompoundRule(rule);
    }

    this.closeRuleModal();
  }

  onAddCompoundRule(rule: CrossFieldValidation): void {
    this.builderStore.addValidation(rule);
  }

  onRemoveCompoundRule(id: string): void {
    this.builderStore.removeValidation(id);
  }

  private parseValue(raw: any): any {
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    if (!isNaN(Number(raw)) && raw.trim() !== '') return Number(raw);
    return raw;
  }

  onSaveTemplate(): void {
    const tmpl = this.builderStore.template();
    if (!tmpl) return;

    this.builderStore.setSaving(true);
    this.saveSuccessMessage.set(null);

    // Save to server
    const usedSlugs = new Set<string>();
    const templateFields = tmpl.fields
      .filter((f) => !f.isSystemField)
      .map((f, i) => {
        let slug = (f.key || f.label)
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '_')
          .slice(0, 45);
        if (!slug || slug === '_') slug = `field_${f.type}`;
        if (usedSlugs.has(slug)) {
          slug = `${slug}_${i + 1}`;
        }
        usedSlugs.add(slug);

        const fieldOpts =
          f.options && f.options.length > 0
            ? f.options.map((o) => ({
                value: o.value || o.label,
                label: o.label || o.value,
              }))
            : undefined;

        if (typeof f.fieldDefinitionId === 'number' && f.fieldDefinitionId > 0) {
          return {
            fieldDefinitionId: f.fieldDefinitionId,
            customFieldName: slug,
            customFieldLabel: f.label,
            displayOrder: i + 1,
            isRequired: !!f.required,
            fieldOptions: fieldOpts,
          };
        }

        // New field definition created from palette
        const mappedType = f.type === 'email' ? 'text' : f.type;
        return {
          customFieldName: slug,
          customFieldLabel: f.label,
          displayOrder: i + 1,
          isRequired: !!f.required,
          fieldOptions: fieldOpts,
          newFieldDefinition: {
            fieldName: slug,
            fieldLabel: f.label,
            fieldType: mappedType,
            isGlobal: true,
            defaultOptions:
              f.options && f.options.length > 0
                ? { options: f.options.map((o) => o.label || o.value) }
                : undefined,
          },
        };
      });

    const schemaFields = tmpl.fields.map((f) => {
      if (f.isSystemField) return f;
      const matchingTf = templateFields.find(
        (tf) => tf.customFieldLabel === f.label || tf.customFieldName === f.key,
      );
      return {
        ...f,
        key: matchingTf?.customFieldName || f.key,
      };
    });

    const dto = {
      templateName: tmpl.templateName,
      sportType: tmpl.sportType,
      tournamentType: tmpl.tournamentType,
      templateType: 'CUSTOM' as const,
      fields: templateFields,
      formSchema: {
        templateName: tmpl.templateName,
        sportType: tmpl.sportType,
        tournamentType: tmpl.tournamentType,
        fields: schemaFields,
        compoundRules: tmpl.validations.map((v, i) => ({
          ruleId: i + 1,
          ruleName: v.name,
          description: null,
          conditions: v.when as any,
          actions: v.then as any,
          errorMessage: v.errorMessage,
          isActive: true,
        })),
      },
    };

    if (tmpl.id) {
      this.formDefinitionService.updateTemplate(+tmpl.id, dto).subscribe({
        next: () => {
          this.builderStore.setSaving(false);
          this.saveSuccessMessage.set('Form template saved successfully!');
          setTimeout(() => this.saveSuccessMessage.set(null), 3000);
        },
        error: (err) => {
          this.builderStore.setSaving(false);
          this.builderStore.setError(
            'Failed to update template: ' + (err.error?.message || err.message),
          );
        },
      });
    } else {
      this.formDefinitionService.createTemplate(dto as any).subscribe({
        next: (created) => {
          this.builderStore.setSaving(false);
          this.saveSuccessMessage.set('Form template created successfully!');
          if (created.templateId) {
            this.builderStore.updateTemplateMetadata({ id: created.templateId });
          }
          this.router.navigate(['/form-builder', created.templateId]);
        },
        error: (err) => {
          this.builderStore.setSaving(false);
          this.builderStore.setError(
            'Failed to create template: ' + (err.error?.message || err.message),
          );
        },
      });
    }
  }

  onDeleteTemplate(): void {
    const tmpl = this.builderStore.template();
    if (!tmpl || !tmpl.id) return;

    if (
      confirm(
        `Are you sure you want to delete template "${tmpl.templateName}"? This action cannot be undone.`,
      )
    ) {
      this.builderStore.setSaving(true);
      this.formDefinitionService.deleteTemplate(+tmpl.id).subscribe({
        next: () => {
          this.builderStore.setSaving(false);
          this.router.navigate(['/form-definitions']);
        },
        error: (err) => {
          this.builderStore.setSaving(false);
          this.builderStore.setError(
            'Failed to delete template: ' + (err.error?.message || err.message),
          );
        },
      });
    }
  }
}
