import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RuleStore } from '../../stores/rule.store';
import { FormDefinitionStore } from '../../stores/form-definition.store';
import { ComparisonOperator } from '../../models/rule-engine.models';

import { BaseLayout } from '../../layouts/base-layout/base-layout';

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

  readonly isModalOpen = signal(false);
  readonly isSubmitting = signal(false);

  readonly searchControl = new FormControl('');

  readonly ruleForm = new FormGroup({
    ruleName: new FormControl('', [Validators.required, Validators.minLength(3)]),
    description: new FormControl(''),
    conditionFieldId: new FormControl('age', [Validators.required]),
    conditionOperator: new FormControl<ComparisonOperator>('lessThan', [Validators.required]),
    conditionValue: new FormControl('18', [Validators.required]),
    actionFieldId: new FormControl('guardian_consent', [Validators.required]),
    actionOperator: new FormControl<ComparisonOperator>('equals', [Validators.required]),
    actionValue: new FormControl('true', [Validators.required]),
    errorMessage: new FormControl('', [Validators.required, Validators.minLength(5)]),
  });

  ngOnInit(): void {
    this.ruleStore.loadRules();
    this.formDefinitionStore.loadFieldDefinitions();

    this.searchControl.valueChanges.subscribe((val) => {
      this.ruleStore.setSearchQuery(val || '');
    });
  }

  openCreateModal(): void {
    this.ruleStore.clearError();
    this.ruleForm.reset({
      ruleName: '',
      description: '',
      conditionFieldId: 'age',
      conditionOperator: 'lessThan',
      conditionValue: '18',
      actionFieldId: 'guardian_consent',
      actionOperator: 'equals',
      actionValue: 'true',
      errorMessage: '',
    });
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  onSubmit(): void {
    if (this.ruleForm.invalid) {
      this.ruleForm.markAllAsTouched();
      return;
    }

    const val = this.ruleForm.getRawValue();
    this.isSubmitting.set(true);

    // Parse value to number if numeric, boolean if true/false, array if 'in' / 'notIn'
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
      },
      () => {
        this.isSubmitting.set(false);
      },
    );
  }

  onDelete(id: number): void {
    if (confirm('Are you sure you want to delete this global compound rule?')) {
      this.ruleStore.deleteRule(id);
    }
  }
}
