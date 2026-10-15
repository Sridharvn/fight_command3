import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RuleManagementPage } from './rule-management';
import { RuleStore } from '../../stores/rule.store';
import { AuthStore } from '../../stores/auth.store';
import { LayoutStore } from '../../stores/layout.store';
import { FormDefinitionStore } from '../../stores/form-definition.store';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { GlobalCompoundRule } from '../../models/rule-engine.models';

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

  const rulesSignal = signal<GlobalCompoundRule[]>([mockRule]);
  const statusSignal = signal<'idle' | 'loading' | 'success' | 'error'>('success');
  const errorSignal = signal<string | null>(null);

  let ruleStoreMock: any;

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

    await TestBed.configureTestingModule({
      imports: [RuleManagementPage],
      providers: [
        provideRouter([]),
        { provide: RuleStore, useValue: ruleStoreMock },
        {
          provide: FormDefinitionStore,
          useValue: {
            fieldDefinitions: signal([]),
            loadFieldDefinitions: vi.fn(),
          },
        },
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
});
