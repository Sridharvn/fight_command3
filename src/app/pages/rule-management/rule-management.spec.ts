import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RuleManagementPage } from './rule-management';
import { RuleStore } from '../../stores/rule.store';
import { AuthStore } from '../../stores/auth.store';
import { LayoutStore } from '../../stores/layout.store';
import { FormDefinitionStore } from '../../stores/form-definition.store';
import { FormDefinitionService } from '../../services/form-definition.service';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { GlobalCompoundRule } from '../../models/rule-engine.models';
import { FormTemplate } from '../../models/form-definition.models';

describe('RuleManagementPage', () => {
  let component: RuleManagementPage;
  let fixture: ComponentFixture<RuleManagementPage>;

  const mockRule: GlobalCompoundRule = {
    ruleId: 1,
    ruleName: 'Minor Consent Rule',
    description: 'Requires guardian signature if age < 18',
    conditions: {
      conjunction: 'AND',
      conditions: [{ fieldId: 'age', operator: 'lessThan', value: 18 }],
    },
    actions: {
      conjunction: 'AND',
      conditions: [{ fieldId: 'guardian_consent', operator: 'equals', value: true }],
    },
    errorMessage: 'Guardian consent required for participants under 18',
    isActive: true,
  };

  const mockTemplate: FormTemplate = {
    templateId: 101,
    templateName: 'MMA Championship Registration',
    templateType: 'CUSTOM',
    sportType: 2,
    tournamentType: 1,
    isActive: true,
    formSchema: {
      templateName: 'MMA Championship Registration',
      sportType: 2,
      tournamentType: 1,
      fields: [
        {
          id: 'categories',
          key: 'categories',
          label: 'Weight Categories',
          type: 'checkbox',
          options: ['Bantamweight', 'Featherweight', 'Lightweight', 'Welterweight'],
          validationRules: {},
        },
        {
          id: 'age',
          key: 'age',
          label: 'Age',
          type: 'number',
          validationRules: { required: true },
        },
        {
          id: 'guardian_consent',
          key: 'guardian_consent',
          label: 'Parent / Guardian Consent',
          type: 'checkbox',
          validationRules: {},
        },
      ],
      compoundRules: [
        {
          ruleId: 999,
          ruleName: 'Max 2 Categories',
          description: 'Cannot select more than 2 categories',
          errorMessage: 'You can select at most 2 options.',
          conditions: {
            conjunction: 'AND',
            conditions: [{ fieldId: 'categories', operator: 'countGreaterThan', value: 2 }],
          },
          actions: {
            conjunction: 'AND',
            conditions: [{ fieldId: 'categories', operator: 'countMax', value: 2 }],
          },
          isActive: true,
        },
      ],
    },
  };

  const rulesSignal = signal<GlobalCompoundRule[]>([mockRule]);
  const statusSignal = signal<'idle' | 'loading' | 'success' | 'error'>('success');
  const errorSignal = signal<string | null>(null);

  let ruleStoreMock: any;
  let formDefinitionStoreMock: any;
  let formDefinitionServiceMock: any;

  beforeEach(async () => {
    ruleStoreMock = {
      rules: rulesSignal,
      filteredRules: rulesSignal,
      activeRules: rulesSignal,
      totalRules: signal(1),
      status: statusSignal,
      error: errorSignal,
      loadRules: vi.fn(),
      setSearchQuery: vi.fn(),
      createRule: vi.fn(),
      deleteRule: vi.fn(),
      clearError: vi.fn(),
    };

    formDefinitionStoreMock = {
      templates: signal<FormTemplate[]>([mockTemplate]),
      loadTemplates: vi.fn(),
      fieldDefinitions: signal([]),
      loadFieldDefinitions: vi.fn(),
    };

    formDefinitionServiceMock = {
      getTemplateById: vi.fn().mockReturnValue(of(mockTemplate)),
      updateTemplate: vi
        .fn()
        .mockImplementation((id: number, dto: any) => of({ ...mockTemplate, ...dto })),
    };

    await TestBed.configureTestingModule({
      imports: [RuleManagementPage],
      providers: [
        provideRouter([]),
        { provide: RuleStore, useValue: ruleStoreMock },
        { provide: FormDefinitionStore, useValue: formDefinitionStoreMock },
        { provide: FormDefinitionService, useValue: formDefinitionServiceMock },
        {
          provide: AuthStore,
          useValue: {
            isAuthenticated: signal(true),
            user: signal({ firstName: 'Super', lastName: 'Admin' }),
            userFullName: signal('Super Admin'),
            userEmail: signal('admin@test.com'),
            userRoleName: signal('SUPERADMIN'),
            userInitials: signal('SA'),
            logout: vi.fn(),
          },
        },
        {
          provide: LayoutStore,
          useValue: {
            isSidebarCollapsed: signal(false),
            toggleSidebar: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RuleManagementPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and render rules list inside BaseLayout', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-base-layout')).toBeTruthy();
    expect(compiled.textContent).toContain('Minor Consent Rule');
    expect(compiled.textContent).toContain('Guardian consent required');
  });

  it('should toggle create rule modal', () => {
    expect(component.isModalOpen()).toBe(false);
    component.openCreateModal();
    fixture.detectChanges();

    expect(component.isModalOpen()).toBe(true);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.modal-backdrop')).toBeTruthy();

    component.closeModal();
    fixture.detectChanges();
    expect(component.isModalOpen()).toBe(false);
  });

  it('should submit new rule and close modal on success', () => {
    component.openCreateModal();
    component.ruleForm.patchValue({
      ruleName: 'Weight Division Check',
      description: 'Check weight division',
      conditionFieldId: 'weight_kg',
      conditionOperator: 'lessThan',
      conditionValue: '60',
      actionFieldId: 'has_valid_insurance',
      actionOperator: 'equals',
      actionValue: 'true',
      errorMessage: 'Weight division check failed',
    });

    component.onSubmit();

    expect(ruleStoreMock.createRule).toHaveBeenCalledWith(
      expect.objectContaining({
        ruleName: 'Weight Division Check',
        errorMessage: 'Weight division check failed',
        conditions: {
          conjunction: 'AND',
          conditions: [{ fieldId: 'weight_kg', operator: 'lessThan', value: 60 }],
        },
        actions: {
          conjunction: 'AND',
          conditions: [{ fieldId: 'has_valid_insurance', operator: 'equals', value: true }],
        },
      }),
      expect.any(Function),
      expect.any(Function),
    );
  });

  it('should reset isSubmitting on rule creation failure and clear error when opening modal (EC-RUL-001)', () => {
    ruleStoreMock.createRule.mockImplementation((dto: any, onSuccess: any, onError: any) => {
      if (onError) onError(new Error('Rule creation failed'));
    });

    component.openCreateModal();
    expect(ruleStoreMock.clearError).toHaveBeenCalled();

    component.ruleForm.patchValue({
      ruleName: 'Failed Rule',
      conditionFieldId: 'age',
      conditionOperator: 'lessThan',
      conditionValue: '18',
      actionFieldId: 'guardian_consent',
      actionOperator: 'equals',
      actionValue: 'true',
      errorMessage: 'Error message here',
    });

    component.onSubmit();
    expect(component.isSubmitting()).toBe(false);
    expect(component.isModalOpen()).toBe(true);
  });

  it('should parse comma-separated values into an array when condition operator is in', () => {
    component.openCreateModal();
    component.ruleForm.patchValue({
      ruleName: 'Division In List',
      conditionFieldId: 'division',
      conditionOperator: 'in',
      conditionValue: 'junior, senior, master',
      actionFieldId: 'approved',
      actionOperator: 'equals',
      actionValue: 'true',
      errorMessage: 'Valid division required',
    });

    component.onSubmit();

    expect(ruleStoreMock.createRule).toHaveBeenCalledWith(
      expect.objectContaining({
        conditions: {
          conjunction: 'AND',
          conditions: [
            { fieldId: 'division', operator: 'in', value: ['junior', 'senior', 'master'] },
          ],
        },
      }),
      expect.any(Function),
      expect.any(Function),
    );
  });

  it('should switch to template scope, display template rules, and populate available fields (HF-RUL-003)', () => {
    // Select template 101
    const event = { target: { value: '101' } } as unknown as Event;
    component.onSelectTemplate(event);
    fixture.detectChanges();

    expect(component.selectedTemplateId()).toBe(101);
    expect(formDefinitionServiceMock.getTemplateById).toHaveBeenCalledWith(101);

    // Available fields should be populated from template schema
    const fields = component.availableFields();
    expect(fields.length).toBe(3);
    expect(fields.map((f) => f.key)).toEqual(['categories', 'age', 'guardian_consent']);

    // Choice fields should identify checkbox group with options
    const choices = component.choiceFields();
    expect(choices.length).toBe(1);
    expect(choices[0].key).toBe('categories');

    // Current rules should display the template rule
    const rules = component.currentRules();
    expect(rules.length).toBe(1);
    expect(rules[0].ruleName).toBe('Max 2 Categories');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('MMA Championship Registration');
    expect(compiled.textContent).toContain('Max 2 Categories');
  });

  it('should submit selection limit rule to template schema (VR-RULE-001)', () => {
    // Select template 101
    const event = { target: { value: '101' } } as unknown as Event;
    component.onSelectTemplate(event);
    fixture.detectChanges();

    component.openCreateModal();
    expect(component.selectedRuleType()).toBe('selectionLimit');

    component.ruleForm.patchValue({
      ruleType: 'selectionLimit',
      ruleName: 'Limit 3 Categories',
      description: 'Maximum 3 categories per athlete',
      targetFieldId: 'categories',
      limitType: 'maxSelections',
      limitCount: 3,
      errorMessage: 'Field "Weight Categories" allows maximum 3 selections.',
    });

    component.onSubmit();

    expect(formDefinitionServiceMock.updateTemplate).toHaveBeenCalledWith(
      101,
      expect.objectContaining({
        formSchema: expect.objectContaining({
          fields: expect.arrayContaining([
            expect.objectContaining({
              key: 'categories',
              validationRules: expect.objectContaining({
                maxSelections: 3,
              }),
            }),
          ]),
          compoundRules: expect.arrayContaining([
            expect.objectContaining({
              ruleName: 'Limit 3 Categories',
              errorMessage: 'Field "Weight Categories" allows maximum 3 selections.',
              actions: {
                conjunction: 'AND',
                conditions: [{ fieldId: 'categories', operator: 'countMax', value: 3 }],
              },
            }),
          ]),
        }),
      }),
    );
    expect(component.isModalOpen()).toBe(false);
  });

  it('should delete a rule from template schema and update template', () => {
    // Mock window.confirm
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    // Switch to template 101
    const event = { target: { value: '101' } } as unknown as Event;
    component.onSelectTemplate(event);
    fixture.detectChanges();

    component.onDelete(999);

    expect(formDefinitionServiceMock.updateTemplate).toHaveBeenCalledWith(
      101,
      expect.objectContaining({
        formSchema: expect.objectContaining({
          compoundRules: [],
        }),
      }),
    );
  });
});
