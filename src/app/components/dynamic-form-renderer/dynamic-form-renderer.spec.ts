import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DynamicFormRendererComponent } from './dynamic-form-renderer';
import { FormDefinition } from '../../models/dynamic-form.models';
import { RuleEngineService } from '../../services/rule-engine.service';

describe('DynamicFormRendererComponent', () => {
  let component: DynamicFormRendererComponent;
  let fixture: ComponentFixture<DynamicFormRendererComponent>;

  const mockSchema: FormDefinition = {
    templateName: 'National Sambo Registration',
    sportType: 1,
    tournamentType: 1,
    fields: [
      {
        id: 'fullName',
        key: 'fullName',
        label: 'Full Name',
        type: 'text',
        required: true,
        isSystemField: true,
      },
      {
        id: 'age',
        key: 'age',
        label: 'Athlete Age',
        type: 'number',
        required: true,
      },
      {
        id: 'guardianConsent',
        key: 'guardianConsent',
        label: 'Guardian Consent',
        type: 'boolean',
      },
      {
        id: 'weightClass',
        key: 'weightClass',
        label: 'Weight Category',
        type: 'select',
        options: [
          { label: 'Under 64kg', value: 'u64' },
          { label: 'Under 71kg', value: 'u71' },
        ],
      },
    ],
    validations: [
      {
        id: 'rule-guardian-minor',
        name: 'Minor Guardian Consent',
        errorMessage: 'Athletes under 18 must have guardian consent.',
        when: {
          conjunction: 'AND',
          conditions: [{ fieldId: 'age', operator: 'lessThan', value: 18 }],
        },
        then: {
          conjunction: 'AND',
          conditions: [{ fieldId: 'guardianConsent', operator: 'equals', value: true }],
        },
      },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DynamicFormRendererComponent],
      providers: [RuleEngineService],
    }).compileComponents();

    fixture = TestBed.createComponent(DynamicFormRendererComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('schema', mockSchema);
    fixture.detectChanges();
  });

  it('should create and instantiate FormGroup with all schema fields', () => {
    expect(component).toBeTruthy();
    expect(component.form).toBeTruthy();
    expect(component.form.get('fullName')).toBeTruthy();
    expect(component.form.get('age')).toBeTruthy();
    expect(component.form.get('guardianConsent')).toBeTruthy();
    expect(component.form.get('weightClass')).toBeTruthy();
  });

  it('should validate required fields and enforce form validity', () => {
    component.form.patchValue({
      fullName: '',
      age: null,
    });
    expect(component.form.valid).toBe(false);

    component.form.patchValue({
      fullName: 'Alex Gracie',
      age: 22,
      guardianConsent: false,
      weightClass: 'u71',
    });
    expect(component.form.valid).toBe(true);
  });

  it('should detect cross-field AST violation and populate compliance errors', () => {
    // Under 18 without consent
    component.form.patchValue({
      fullName: 'Junior Fighter',
      age: 16,
      guardianConsent: false,
    });
    fixture.detectChanges();

    expect(component.complianceErrors().length).toBe(1);
    expect(component.complianceErrors()[0]).toContain('Athletes under 18 must have guardian consent');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.compliance-alert')).toBeTruthy();
    expect(compiled.textContent).toContain('Athletes under 18 must have guardian consent');

    // Grant consent
    component.form.patchValue({ guardianConsent: true });
    fixture.detectChanges();

    expect(component.complianceErrors().length).toBe(0);
    expect(compiled.querySelector('.compliance-alert')).toBeNull();
  });

  it('should disable all controls when disabled signal is true', () => {
    expect(component.form.enabled).toBe(true);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    expect(component.form.disabled).toBe(true);
  });

  it('should emit formSubmit when submit button is clicked on valid form', () => {
    const submitSpy = vi.fn();
    component.formSubmit.subscribe(submitSpy);

    component.form.patchValue({
      fullName: 'Valid Competitor',
      age: 20,
      guardianConsent: false,
      weightClass: 'u64',
    });
    fixture.detectChanges();

    component.onSubmit();
    expect(submitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: 'Valid Competitor',
        age: 20,
      }),
    );
  });
});
