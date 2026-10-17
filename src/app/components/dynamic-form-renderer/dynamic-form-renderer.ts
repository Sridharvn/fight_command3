import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FormDefinition, FormField } from '../../models/dynamic-form.models';
import { RuleEngineService } from '../../services/rule-engine.service';

import { DateSelectorComponent } from '../date-selector/date-selector';

@Component({
  selector: 'app-dynamic-form-renderer',
  imports: [ReactiveFormsModule, DateSelectorComponent],
  templateUrl: './dynamic-form-renderer.html',
  styleUrl: './dynamic-form-renderer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicFormRendererComponent implements OnInit {
  private readonly ruleEngine = inject(RuleEngineService);

  readonly schema = input.required<FormDefinition>();
  readonly initialData = input<Record<string, any>>({});
  readonly disabled = input<boolean>(false);
  readonly submitButtonText = input<string>('Submit Registration');
  readonly showSubmitButton = input<boolean>(true);
  readonly forceSingleColumn = input<boolean>(false);

  readonly formSubmit = output<Record<string, any>>();
  readonly formReady = output<FormGroup>();
  readonly complianceErrorsChange = output<string[]>();

  readonly complianceErrors = signal<string[]>([]);
  form!: FormGroup;

  constructor() {
    effect(() => {
      const isDisabled = this.disabled();
      if (this.form) {
        if (isDisabled && this.form.enabled) {
          this.form.disable({ emitEvent: false });
        } else if (!isDisabled && this.form.disabled) {
          this.form.enable({ emitEvent: false });
        }
      }
    });

    effect(() => {
      const currentSchema = this.schema();
      const initData = this.initialData();
      if (currentSchema) {
        this.buildForm(currentSchema);
      }
    });
  }

  ngOnInit(): void {
    if (!this.form && this.schema()) {
      this.buildForm(this.schema());
    }
  }

  private buildForm(schema: FormDefinition): void {
    const group: Record<string, FormControl> = {};
    const initData = this.initialData();

    for (const field of schema.fields || []) {
      const fieldKey = field.key || field.id;

      // Checkbox group (multi-select option list)
      if (field.type === 'checkbox' && field.options && field.options.length > 0) {
        const groupValidators = [];
        if (field.required) {
          groupValidators.push((ctrl: AbstractControl) => {
            const v = ctrl.value;
            if (!v || (Array.isArray(v) && v.length === 0)) {
              return { required: true };
            }
            return null;
          });
        }
        if (field.validationRules?.maxSelections !== undefined) {
          const maxSel = field.validationRules.maxSelections;
          groupValidators.push((ctrl: AbstractControl) => {
            const v = ctrl.value;
            if (Array.isArray(v) && v.length > maxSel) {
              return { maxSelections: { required: maxSel, actual: v.length } };
            }
            return null;
          });
        }
        if (field.validationRules?.minSelections !== undefined) {
          const minSel = field.validationRules.minSelections;
          groupValidators.push((ctrl: AbstractControl) => {
            const v = ctrl.value;
            if (Array.isArray(v) && v.length < minSel) {
              return { minSelections: { required: minSel, actual: v.length } };
            }
            return null;
          });
        }

        const defaultArr = Array.isArray(initData[fieldKey])
          ? initData[fieldKey]
          : Array.isArray(field.defaultValue)
            ? field.defaultValue
            : [];
        group[fieldKey] = new FormControl(defaultArr, groupValidators);
        continue;
      }

      const validators = [];

      if (field.required) {
        validators.push(Validators.required);
      }

      if (field.type === 'email') {
        validators.push(Validators.email);
      }

      if (field.validationRules) {
        if (field.validationRules.min !== undefined) {
          validators.push(Validators.min(field.validationRules.min));
        }
        if (field.validationRules.max !== undefined) {
          validators.push(Validators.max(field.validationRules.max));
        }
        if (field.validationRules.minLength !== undefined) {
          validators.push(Validators.minLength(field.validationRules.minLength));
        }
        if (field.validationRules.maxLength !== undefined) {
          validators.push(Validators.maxLength(field.validationRules.maxLength));
        }
      }

      let defaultValue =
        initData[fieldKey] !== undefined ? initData[fieldKey] : (field.defaultValue ?? '');

      if (field.type === 'boolean' || field.type === 'checkbox') {
        defaultValue =
          defaultValue === true ||
          defaultValue === 'true' ||
          defaultValue === '1' ||
          defaultValue === 'yes';
      }

      group[fieldKey] = new FormControl(defaultValue, validators);
    }

    this.form = new FormGroup(group);

    if (this.disabled()) {
      this.form.disable({ emitEvent: false });
    }

    this.form.valueChanges.subscribe(() => {
      this.evaluateCompliance();
    });

    this.evaluateCompliance();
    this.formReady.emit(this.form);
  }

  isOptionChecked(key: string, optValue: any): boolean {
    const control = this.form?.get(key);
    return Array.isArray(control?.value) && control.value.includes(optValue);
  }

  onCheckboxGroupChange(field: FormField, optValue: any, event: Event): void {
    const key = field.key || field.id;
    const control = this.form?.get(key);
    if (!control) return;

    const isChecked = (event.target as HTMLInputElement).checked;
    const current = Array.isArray(control.value) ? [...control.value] : [];

    if (isChecked) {
      if (!current.includes(optValue)) {
        current.push(optValue);
      }
    } else {
      const idx = current.indexOf(optValue);
      if (idx > -1) {
        current.splice(idx, 1);
      }
    }

    control.setValue(current);
    control.markAsDirty();
    control.markAsTouched();
    control.updateValueAndValidity();
  }

  isFieldVisible(field: FormField): boolean {
    const rules = this.schema()?.validations || (this.schema() as any)?.compoundRules || [];
    const key = field.key || field.id;
    for (const r of rules) {
      if (!r) continue;
      const thenNode = r.then || r.actions;
      const whenNode = r.when || r.conditions;
      const actionCond = thenNode?.conditions?.[0] as any;
      const targetFieldId = actionCond?.fieldId;
      if (targetFieldId === key && whenNode) {
        if (r.actionType === 'hide' || actionCond?.operator === 'hide') {
          const conditionMet = this.ruleEngine.evaluate(whenNode, this.form?.getRawValue() || {});
          if (conditionMet) return false;
        } else if (r.actionType === 'show' || actionCond?.operator === 'show') {
          const conditionMet = this.ruleEngine.evaluate(whenNode, this.form?.getRawValue() || {});
          if (!conditionMet) return false;
        }
      }
    }
    return true;
  }

  isFieldRequired(field: FormField): boolean {
    if (field.required) return true;
    const rules = this.schema()?.validations || (this.schema() as any)?.compoundRules || [];
    const key = field.key || field.id;
    for (const r of rules) {
      if (!r) continue;
      const thenNode = r.then || r.actions;
      const whenNode = r.when || r.conditions;
      const actionCond = thenNode?.conditions?.[0] as any;
      const targetFieldId = actionCond?.fieldId;
      if (targetFieldId === key && whenNode) {
        if (r.actionType === 'require' || actionCond?.operator === 'require') {
          const conditionMet = this.ruleEngine.evaluate(whenNode, this.form?.getRawValue() || {});
          if (conditionMet) return true;
        }
      }
    }
    return false;
  }

  private evaluateCompliance(): void {
    if (!this.form || !this.schema()) return;
    const rawValues = this.form.getRawValue();
    const rules = this.schema().validations || (this.schema() as any).compoundRules || [];
    const errors = this.ruleEngine.validateForm(rules, rawValues);
    this.complianceErrors.set(errors);
    this.complianceErrorsChange.emit(errors);
  }

  isFieldInvalid(key: string): boolean {
    const control = this.form?.get(key);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getFieldError(field: FormField): string {
    const control = this.form?.get(field.key || field.id);
    if (!control || !control.errors) return '';
    if (control.errors['required']) return `${field.label} is required`;
    if (control.errors['email']) return 'Please enter a valid email address';
    if (control.errors['min'])
      return `${field.label} minimum value is ${control.errors['min'].min}`;
    if (control.errors['max'])
      return `${field.label} maximum value is ${control.errors['max'].max}`;
    if (control.errors['minlength'])
      return `${field.label} must be at least ${control.errors['minlength'].requiredLength} characters`;
    if (control.errors['maxlength'])
      return `${field.label} cannot exceed ${control.errors['maxlength'].requiredLength} characters`;
    if (control.errors['maxSelections'])
      return `${field.label} allows maximum ${control.errors['maxSelections'].required} selections`;
    if (control.errors['minSelections'])
      return `${field.label} requires at least ${control.errors['minSelections'].required} selections`;
    return 'Invalid value';
  }

  onSubmit(): void {
    if (this.disabled()) return;
    this.evaluateCompliance();
    if (this.form.invalid || this.complianceErrors().length > 0) {
      this.form.markAllAsTouched();
      return;
    }
    this.formSubmit.emit(this.form.getRawValue());
  }

  isDobField(field: FormField): boolean {
    const key = (field.key || field.id || '').toLowerCase();
    const label = (field.label || '').toLowerCase();
    return (
      key === 'dob' ||
      key === 'date_of_birth' ||
      key === 'dateofbirth' ||
      key === 'birth_date' ||
      key === 'birthdate' ||
      label.includes('birth') ||
      label.includes('dob')
    );
  }
}
