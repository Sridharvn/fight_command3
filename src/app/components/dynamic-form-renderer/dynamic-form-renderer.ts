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
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  FormDefinition,
  FormField,
} from '../../models/dynamic-form.models';
import { RuleEngineService } from '../../services/rule-engine.service';

@Component({
  selector: 'app-dynamic-form-renderer',
  imports: [ReactiveFormsModule],
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

      const defaultValue =
        initData[fieldKey] !== undefined
          ? initData[fieldKey]
          : field.type === 'boolean' || field.type === 'checkbox'
            ? false
            : (field.defaultValue ?? '');

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

  private evaluateCompliance(): void {
    if (!this.form || !this.schema()) return;
    const rawValues = this.form.getRawValue();
    const errors = this.ruleEngine.validateForm(
      this.schema().validations || [],
      rawValues,
    );
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
}
