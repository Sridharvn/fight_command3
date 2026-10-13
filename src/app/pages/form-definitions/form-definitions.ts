import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormDefinitionStore } from '../../stores/form-definition.store';
import { RuleStore } from '../../stores/rule.store';
import { FieldType, FormTemplate } from '../../models/form-definition.models';

import { RouterLink } from '@angular/router';
import { BaseLayout } from '../../layouts/base-layout/base-layout';

@Component({
  selector: 'app-form-definitions',
  imports: [BaseLayout, ReactiveFormsModule, RouterLink],
  templateUrl: './form-definitions.html',
  styleUrl: './form-definitions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormDefinitionsPage implements OnInit {
  protected readonly formStore = inject(FormDefinitionStore);
  protected readonly ruleStore = inject(RuleStore);

  readonly isFieldModalOpen = signal(false);
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

  onToggleTemplateStatus(id: number, currentStatus: boolean): void {
    this.formStore.toggleTemplateStatus({ id, isActive: !currentStatus });
  }

  onDeleteTemplate(id: number): void {
    if (confirm('Are you sure you want to delete this template?')) {
      this.formStore.deleteTemplate(id);
    }
  }
}
