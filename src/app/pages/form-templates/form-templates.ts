import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FormDefinitionStore } from '../../stores/form-definition.store';
import { FormDefinitionService } from '../../services/form-definition.service';
import { FormTemplate } from '../../models/form-definition.models';
import {
  CrossFieldValidation,
  FormDefinition,
  FormField,
  FormFieldOption,
  FormFieldType,
} from '../../models/dynamic-form.models';
import { DynamicFormRendererComponent } from '../../components/dynamic-form-renderer/dynamic-form-renderer';
import { BaseLayout } from '../../layouts/base-layout/base-layout';

@Component({
  selector: 'app-form-templates',
  imports: [BaseLayout, ReactiveFormsModule, RouterLink, DynamicFormRendererComponent],
  templateUrl: './form-templates.html',
  styleUrl: './form-templates.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormTemplatesPage implements OnInit {
  protected readonly formStore = inject(FormDefinitionStore);
  protected readonly formDefinitionService = inject(FormDefinitionService);

  readonly searchControl = new FormControl('');
  readonly isCreateTemplateModalOpen = signal(false);
  readonly selectedBasePresetId = signal<number | null>(null);
  readonly previewingTemplate = signal<FormTemplate | null>(null);
  readonly previewFormDefinition = signal<FormDefinition | null>(null);
  readonly isPreviewLoading = signal(false);

  ngOnInit(): void {
    this.formStore.loadTemplates();
    this.formStore.loadPresets();

    this.searchControl.valueChanges.subscribe((val) => {
      this.formStore.setSearchQuery(val || '');
    });
  }

  onToggleTemplateStatus(id: number, currentStatus: boolean): void {
    this.formStore.toggleTemplateStatus({ id, isActive: !currentStatus });
  }

  onDeleteTemplate(id: number): void {
    if (confirm('Are you sure you want to delete this template?')) {
      this.formStore.deleteTemplate(id);
    }
  }

  // ── Template Creation Setup Modal ──────────────────────────────────────────
  openCreateTemplateModal(): void {
    this.selectedBasePresetId.set(null);
    this.isCreateTemplateModalOpen.set(true);
  }

  closeCreateTemplateModal(): void {
    this.isCreateTemplateModalOpen.set(false);
  }

  onSelectBasePreset(presetId: number | null): void {
    this.selectedBasePresetId.set(presetId);
  }

  // ── Template Preview Modal ─────────────────────────────────────────────────
  openPreviewModal(template: FormTemplate): void {
    this.previewingTemplate.set(template);

    // If template already has complete formSchema fields or attached fields, use them directly
    const schemaFields = template.formSchema?.fields as any[];
    if (Array.isArray(schemaFields) && schemaFields.length > 0 && schemaFields[0]?.key) {
      this.buildAndSetPreviewDefinition(
        template,
        schemaFields as FormField[],
        template.formSchema?.compoundRules,
      );
      return;
    }

    if (template.fields && template.fields.length > 0) {
      this.buildAndSetPreviewDefinitionFromBackendFields(
        template,
        template.fields,
        template.formSchema?.compoundRules,
      );
      return;
    }

    // Otherwise fetch the complete template details via getTemplateById
    this.isPreviewLoading.set(true);
    this.previewFormDefinition.set(null);

    this.formDefinitionService.getTemplateById(template.templateId).subscribe({
      next: (fullTemplate) => {
        this.isPreviewLoading.set(false);
        const fullSchemaFields = fullTemplate.formSchema?.fields as any[];
        if (
          Array.isArray(fullSchemaFields) &&
          fullSchemaFields.length > 0 &&
          fullSchemaFields[0]?.key
        ) {
          this.buildAndSetPreviewDefinition(
            fullTemplate,
            fullSchemaFields as FormField[],
            fullTemplate.formSchema?.compoundRules,
          );
        } else if (fullTemplate.fields && fullTemplate.fields.length > 0) {
          this.buildAndSetPreviewDefinitionFromBackendFields(
            fullTemplate,
            fullTemplate.fields,
            fullTemplate.formSchema?.compoundRules,
          );
        } else {
          this.buildAndSetPreviewDefinition(
            fullTemplate,
            [],
            fullTemplate.formSchema?.compoundRules,
          );
        }
      },
      error: () => {
        this.isPreviewLoading.set(false);
        this.buildAndSetPreviewDefinition(template, [], template.formSchema?.compoundRules);
      },
    });
  }

  private buildAndSetPreviewDefinition(
    template: FormTemplate,
    initialFields: FormField[],
    compoundRules?: any[],
  ): void {
    const fields: FormField[] = initialFields.map((f) => ({
      ...f,
      options: f.options?.map((opt: any) =>
        typeof opt === 'string'
          ? { label: opt, value: opt.toLowerCase().replace(/[^a-z0-9]/g, '_') }
          : opt,
      ),
    }));

    // Ensure Full Name & Email exist in preview without duplicating existing fields
    const isFullName = (k?: string) => {
      const norm = (k || '').toLowerCase().replace(/[^a-z]/g, '');
      return norm === 'fullname' || norm === 'name';
    };
    const isEmail = (k?: string) => {
      const norm = (k || '').toLowerCase().replace(/[^a-z]/g, '');
      return norm === 'email' || norm === 'emailaddress';
    };

    if (!fields.some((f) => isFullName(f.key) || isFullName(f.id))) {
      fields.unshift({
        id: 'fullName',
        key: 'fullName',
        label: 'Full Name',
        type: 'text',
        required: true,
        isSystemField: true,
        columnSpan: 1,
      });
    }
    if (!fields.some((f) => isEmail(f.key) || isEmail(f.id))) {
      const fullNameIdx = fields.findIndex((f) => isFullName(f.key) || isFullName(f.id));
      const insertIdx = fullNameIdx >= 0 ? fullNameIdx + 1 : 0;
      fields.splice(insertIdx, 0, {
        id: 'email',
        key: 'email',
        label: 'Email Address',
        type: 'email',
        required: true,
        isSystemField: true,
        columnSpan: 1,
      });
    }

    const validations: CrossFieldValidation[] =
      compoundRules?.map((r: any) => ({
        id: `rule_${r.ruleId || Date.now()}`,
        name: r.ruleName || 'Validation Rule',
        errorMessage: r.errorMessage || 'Validation error',
        when: r.conditions as any,
        then: r.actions as any,
      })) || [];

    this.previewFormDefinition.set({
      id: template.templateId,
      templateName: template.templateName,
      sportType: template.sportType,
      tournamentType: template.tournamentType,
      fields,
      validations,
    });
  }

  private buildAndSetPreviewDefinitionFromBackendFields(
    template: FormTemplate,
    backendFields: any[],
    compoundRules?: any[],
  ): void {
    const mappedFields: FormField[] = backendFields.map((tf: any) => {
      let options: FormFieldOption[] | undefined;
      const rawOpts =
        tf.options ||
        tf.fieldOptions?.options ||
        tf.defaultOptions?.options ||
        tf.fieldDefinition?.defaultOptions?.options;

      if (Array.isArray(rawOpts)) {
        options = rawOpts.map((opt: any) =>
          typeof opt === 'string'
            ? { label: opt, value: opt.toLowerCase().replace(/[^a-z0-9]/g, '_') }
            : opt,
        );
      }

      return {
        id: `field_${tf.fieldDefinitionId || tf.templateFieldId}`,
        fieldDefinitionId: tf.fieldDefinitionId,
        key:
          tf.customFieldName ||
          tf.fieldName ||
          tf.fieldDefinition?.fieldName ||
          `field_${tf.fieldDefinitionId}`,
        label:
          tf.fieldLabelOverride ||
          tf.customFieldLabel ||
          tf.fieldLabel ||
          tf.fieldDefinition?.fieldLabel ||
          'Field',
        type: (tf.fieldType || tf.fieldDefinition?.fieldType || 'text') as FormFieldType,
        required: !!tf.isRequired,
        columnSpan: 1,
        options,
        helpText: tf.helpText,
      };
    });

    this.buildAndSetPreviewDefinition(template, mappedFields, compoundRules);
  }

  closePreviewModal(): void {
    this.previewingTemplate.set(null);
    this.previewFormDefinition.set(null);
    this.isPreviewLoading.set(false);
  }
}
