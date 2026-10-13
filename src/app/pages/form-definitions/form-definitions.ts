import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormDefinitionStore } from '../../stores/form-definition.store';
import { RuleStore } from '../../stores/rule.store';
import { FieldType } from '../../models/form-definition.models';

@Component({
  selector: 'app-form-definitions',
  imports: [ReactiveFormsModule],
  templateUrl: './form-definitions.html',
  styleUrl: './form-definitions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormDefinitionsPage implements OnInit {
  protected readonly formStore = inject(FormDefinitionStore);
  protected readonly ruleStore = inject(RuleStore);

  readonly isFieldModalOpen = signal(false);
  readonly isTemplateModalOpen = signal(false);
  readonly isSubmitting = signal(false);

  readonly searchControl = new FormControl('');

  // Field creation form
  readonly fieldForm = new FormGroup({
    fieldName: new FormControl('', [
      Validators.required,
      Validators.pattern(/^[a-z0-9_]+$/),
    ]),
    fieldLabel: new FormControl('', [Validators.required]),
    fieldType: new FormControl<FieldType>('text', [Validators.required]),
    optionsInput: new FormControl(''),
    isFilterable: new FormControl(false),
    isSortable: new FormControl(false),
    isSearchable: new FormControl(false),
  });

  // Template creation form
  readonly templateForm = new FormGroup({
    templateName: new FormControl('', [Validators.required, Validators.minLength(3)]),
    sportType: new FormControl(1, [Validators.required]),
    tournamentType: new FormControl(1, [Validators.required]),
    selectedFieldIds: new FormControl<number[]>([]),
    selectedRuleIds: new FormControl<number[]>([]),
  });

  ngOnInit(): void {
    this.formStore.loadAll();
    this.ruleStore.loadRules();

    this.searchControl.valueChanges.subscribe((val) => {
      this.formStore.setSearchQuery(val || '');
    });
  }

  switchTab(tab: 'templates' | 'fields'): void {
    this.formStore.setActiveTab(tab);
    this.searchControl.setValue('');
  }

  // ── Field Modal ────────────────────────────────────────────────────────────
  openFieldModal(): void {
    this.fieldForm.reset({
      fieldName: '',
      fieldLabel: '',
      fieldType: 'text',
      optionsInput: '',
      isFilterable: false,
      isSortable: false,
      isSearchable: false,
    });
    this.isFieldModalOpen.set(true);
  }

  closeFieldModal(): void {
    this.isFieldModalOpen.set(false);
  }

  onSubmitField(): void {
    if (this.fieldForm.invalid) {
      this.fieldForm.markAllAsTouched();
      return;
    }

    const val = this.fieldForm.getRawValue();
    this.isSubmitting.set(true);

    let defaultOptions: { options: string[] } | undefined;
    if (['select', 'radio', 'checkbox'].includes(val.fieldType!) && val.optionsInput?.trim()) {
      defaultOptions = {
        options: val.optionsInput.split(',').map((s) => s.trim()).filter(Boolean),
      };
    }

    this.formStore.createFieldDefinition({
      fieldName: val.fieldName!,
      fieldLabel: val.fieldLabel!,
      fieldType: val.fieldType!,
      defaultOptions,
      isFilterable: !!val.isFilterable,
      isSortable: !!val.isSortable,
      isSearchable: !!val.isSearchable,
      isGlobal: true,
    });

    setTimeout(() => {
      this.isSubmitting.set(false);
      this.closeFieldModal();
    }, 200);
  }

  onDeleteField(id: number): void {
    if (confirm('Are you sure you want to delete this field definition?')) {
      this.formStore.deleteFieldDefinition(id);
    }
  }

  // ── Template Modal ─────────────────────────────────────────────────────────
  openTemplateModal(): void {
    this.templateForm.reset({
      templateName: '',
      sportType: 1,
      tournamentType: 1,
      selectedFieldIds: [],
      selectedRuleIds: [],
    });
    this.isTemplateModalOpen.set(true);
  }

  closeTemplateModal(): void {
    this.isTemplateModalOpen.set(false);
  }

  toggleFieldSelection(fieldId: number): void {
    const current = this.templateForm.controls.selectedFieldIds.value || [];
    if (current.includes(fieldId)) {
      this.templateForm.controls.selectedFieldIds.setValue(current.filter((id) => id !== fieldId));
    } else {
      this.templateForm.controls.selectedFieldIds.setValue([...current, fieldId]);
    }
  }

  toggleRuleSelection(ruleId: number): void {
    const current = this.templateForm.controls.selectedRuleIds.value || [];
    if (current.includes(ruleId)) {
      this.templateForm.controls.selectedRuleIds.setValue(current.filter((id) => id !== ruleId));
    } else {
      this.templateForm.controls.selectedRuleIds.setValue([...current, ruleId]);
    }
  }

  onSubmitTemplate(): void {
    if (this.templateForm.invalid) {
      this.templateForm.markAllAsTouched();
      return;
    }

    const val = this.templateForm.getRawValue();
    this.isSubmitting.set(true);

    const fieldsPayload = (val.selectedFieldIds || []).map((id, index) => ({
      fieldDefinitionId: id,
      displayOrder: index + 1,
      isRequired: true,
    }));

    const selectedRules = this.ruleStore
      .rules()
      .filter((r) => (val.selectedRuleIds || []).includes(r.ruleId));

    this.formStore.createTemplate({
      templateName: val.templateName!,
      sportType: Number(val.sportType),
      tournamentType: Number(val.tournamentType),
      fields: fieldsPayload,
      formSchema: {
        fields: [],
        compoundRules: selectedRules,
      },
    });

    setTimeout(() => {
      this.isSubmitting.set(false);
      this.closeTemplateModal();
    }, 200);
  }

  onToggleTemplateStatus(id: number, currentStatus: boolean): void {
    this.formStore.toggleTemplateStatus({ id, isActive: !currentStatus });
  }

  onDeleteTemplate(id: number): void {
    if (confirm('Are you sure you want to delete this template?')) {
      this.formStore.deleteTemplate(id);
    }
  }
}
