import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormDefinitionsPage } from './form-definitions';
import { FormDefinitionStore } from '../../stores/form-definition.store';
import { RuleStore } from '../../stores/rule.store';
import { AuthStore } from '../../stores/auth.store';
import { LayoutStore } from '../../stores/layout.store';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { FieldDefinition, FormTemplate } from '../../models/form-definition.models';
import { FormDefinitionService } from '../../services/form-definition.service';

describe('FormDefinitionsPage', () => {
  let component: FormDefinitionsPage;
  let fixture: ComponentFixture<FormDefinitionsPage>;

  const mockField: FieldDefinition = {
    fieldDefinitionId: 1,
    fieldName: 'belt_rank',
    fieldLabel: 'Belt Rank',
    fieldType: 'select',
    isFilterable: true,
    isSortable: false,
    isSearchable: false,
    isGlobal: true,
  };

  const mockTemplate: FormTemplate = {
    templateId: 1,
    templateName: 'National Championship Template',
    templateType: 'PRESET',
    sportType: 1,
    tournamentType: 1,
    isActive: true,
  };

  const fieldsSignal = signal<FieldDefinition[]>([mockField]);
  const templatesSignal = signal<FormTemplate[]>([mockTemplate]);
  const activeTabSignal = signal<'templates' | 'fields'>('templates');

  let formStoreMock: any;
  let ruleStoreMock: any;
  let formDefinitionServiceMock: any;

  beforeEach(async () => {
    activeTabSignal.set('templates');
    formStoreMock = {
      fieldDefinitions: fieldsSignal,
      filteredFieldDefinitions: fieldsSignal,
      templates: templatesSignal,
      filteredTemplates: templatesSignal,
      presets: signal([mockTemplate]),
      activeTab: activeTabSignal,
      status: signal('success'),
      error: signal(null),
      loadAll: vi.fn(),
      loadFieldDefinitions: vi.fn(),
      setActiveTab: vi.fn((tab: 'templates' | 'fields') => activeTabSignal.set(tab)),
      setSearchQuery: vi.fn(),
      createFieldDefinition: vi.fn(),
      updateFieldDefinition: vi.fn(),
      createTemplate: vi.fn(),
      deleteFieldDefinition: vi.fn(),
      deleteTemplate: vi.fn(),
      toggleTemplateStatus: vi.fn(),
    };

    ruleStoreMock = {
      rules: signal([]),
      loadRules: vi.fn(),
    };

    formDefinitionServiceMock = {
      getTemplateById: vi.fn().mockReturnValue(of(mockTemplate)),
    };

    await TestBed.configureTestingModule({
      imports: [FormDefinitionsPage],
      providers: [
        provideRouter([]),
        { provide: FormDefinitionStore, useValue: formStoreMock },
        { provide: RuleStore, useValue: ruleStoreMock },
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

    fixture = TestBed.createComponent(FormDefinitionsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and render Field Library table inside BaseLayout', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-base-layout')).toBeTruthy();
    expect(compiled.querySelector('.page-title')?.textContent?.trim()).toBe('Form Definitions');
    expect(compiled.textContent).toContain('Belt Rank');
    expect(compiled.textContent).toContain('belt_rank');
    expect(compiled.textContent).toContain('select');
  });

  it('should toggle field modal for field library', () => {
    expect(component.isFieldModalOpen()).toBe(false);
    component.openFieldModal();
    fixture.detectChanges();
    expect(component.isFieldModalOpen()).toBe(true);
    component.closeFieldModal();
    expect(component.isFieldModalOpen()).toBe(false);
  });

  it('should render Add Field button in page header', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const addFieldBtn = compiled.querySelector('.create-field-btn') as HTMLButtonElement;
    expect(addFieldBtn).toBeTruthy();
    expect(addFieldBtn.textContent).toContain('Add Field');
  });

  it('should filter field definitions via search input', () => {
    component.searchControl.setValue('Belt');
    expect(formStoreMock.setSearchQuery).toHaveBeenCalledWith('Belt');
  });

  describe('Form Definitions Management (HF-FD-001 to HF-FD-005)', () => {
    it('should open create field modal with blank state and reset options (HF-FD-001)', () => {
      component.openCreateFieldModal();
      expect(component.isFieldModalOpen()).toBe(true);
      expect(component.editingFieldId()).toBeNull();
      expect(component.optionsList()).toEqual([]);
      expect(component.fieldForm.get('fieldLabel')?.value).toBe('');
      expect(component.fieldForm.get('fieldType')?.value).toBe('text');
    });

    it('should create field definition with base form type, custom options, and validation rules (HF-FD-001)', () => {
      component.openCreateFieldModal();
      component.fieldForm.patchValue({
        fieldLabel: 'Weight Category',
        fieldName: 'weight_category',
        fieldType: 'select',
        required: true,
      });
      component.addOption('Under 64kg');
      component.addOption('Under 71kg');

      component.onSubmitField();

      expect(formStoreMock.createFieldDefinition).toHaveBeenCalledWith(
        expect.objectContaining({
          fieldLabel: 'Weight Category',
          fieldName: 'weight_category',
          fieldType: 'select',
          defaultOptions: { options: ['Under 64kg', 'Under 71kg'] },
          validationRules: expect.objectContaining({ required: true }),
        }),
      );
    });

    it('should open edit field modal and pre-populate field data, options, and rules (HF-FD-002)', () => {
      const existingField: FieldDefinition = {
        fieldDefinitionId: 10,
        fieldName: 'disciplines',
        fieldLabel: 'Disciplines',
        fieldType: 'checkbox',
        defaultOptions: { options: ['Combat Sambo', 'Sport Sambo'] },
        validationRules: { required: true, minSelections: 1, maxSelections: 2 },
        isFilterable: true,
        isSortable: false,
        isSearchable: false,
        isGlobal: true,
      };

      component.openEditFieldModal(existingField);

      expect(component.isFieldModalOpen()).toBe(true);
      expect(component.editingFieldId()).toBe(10);
      expect(component.fieldForm.get('fieldLabel')?.value).toBe('Disciplines');
      expect(component.fieldForm.get('fieldName')?.value).toBe('disciplines');
      expect(component.fieldForm.get('fieldType')?.value).toBe('checkbox');
      expect(component.fieldForm.get('required')?.value).toBe(true);
      expect(component.fieldForm.get('minSelections')?.value).toBe(1);
      expect(component.fieldForm.get('maxSelections')?.value).toBe(2);
      expect(component.optionsList()).toEqual(['Combat Sambo', 'Sport Sambo']);
    });

    it('should submit update to existing field definition via updateFieldDefinition (HF-FD-002)', () => {
      const existingField: FieldDefinition = {
        fieldDefinitionId: 10,
        fieldName: 'disciplines',
        fieldLabel: 'Disciplines',
        fieldType: 'checkbox',
        defaultOptions: { options: ['Combat Sambo', 'Sport Sambo'] },
        validationRules: { required: true, minSelections: 1, maxSelections: 2 },
        isFilterable: true,
        isSortable: false,
        isSearchable: false,
        isGlobal: true,
      };

      component.openEditFieldModal(existingField);
      component.fieldForm.patchValue({
        fieldLabel: 'Disciplines & Styles',
        maxSelections: 3,
      });
      component.addOption('Beach Sambo');

      component.onSubmitField();

      expect(formStoreMock.updateFieldDefinition).toHaveBeenCalledWith({
        id: 10,
        dto: expect.objectContaining({
          fieldLabel: 'Disciplines & Styles',
          defaultOptions: { options: ['Combat Sambo', 'Sport Sambo', 'Beach Sambo'] },
          validationRules: expect.objectContaining({
            required: true,
            minSelections: 1,
            maxSelections: 3,
          }),
        }),
      });
    });

    it('should delete field definition with user confirmation (HF-FD-003)', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      component.onDeleteField(5);
      expect(formStoreMock.deleteFieldDefinition).toHaveBeenCalledWith(5);
    });

    it('should manage interactive options list: add, deduplicate, reject empty, and remove (HF-FD-005)', () => {
      component.openCreateFieldModal();
      component.addOption('Option A');
      expect(component.optionsList()).toEqual(['Option A']);

      // Duplicate should not be added
      component.addOption('Option A');
      expect(component.optionsList()).toEqual(['Option A']);

      // Empty / whitespace should not be added
      component.addOption('   ');
      expect(component.optionsList()).toEqual(['Option A']);

      component.addOption('Option B');
      expect(component.optionsList()).toEqual(['Option A', 'Option B']);

      component.removeOption(0);
      expect(component.optionsList()).toEqual(['Option B']);
    });

    it('should format rules summary into badges accurately', () => {
      const fieldWithRules: FieldDefinition = {
        fieldDefinitionId: 1,
        fieldName: 'test',
        fieldLabel: 'Test',
        fieldType: 'number',
        validationRules: { required: true, min: 10, max: 100 },
        isFilterable: false,
        isSortable: false,
        isSearchable: false,
        isGlobal: true,
      };

      const summary = component.formatRulesSummary(fieldWithRules);
      expect(summary).toContain('Required');
      expect(summary).toContain('Min: 10');
      expect(summary).toContain('Max: 100');
    });

    describe('Automatic snake_case Field Key Generation (HF-FD-006)', () => {
      it('should automatically generate snake_case fieldName when typing fieldLabel in create mode (HF-FD-006)', () => {
        component.openCreateFieldModal();
        component.fieldForm.get('fieldLabel')?.setValue('Medical Insurance Policy');
        expect(component.fieldForm.get('fieldName')?.value).toBe('medical_insurance_policy');
      });

      it('should normalize special characters, whitespace, and collapse underscores', () => {
        component.openCreateFieldModal();
        component.fieldForm.get('fieldLabel')?.setValue('Belt Rank / Category (Under 18)!');
        expect(component.fieldForm.get('fieldName')?.value).toBe('belt_rank_category_under_18');

        component.fieldForm.get('fieldLabel')?.setValue('  Weight --- Class & Division  ');
        expect(component.fieldForm.get('fieldName')?.value).toBe('weight_class_division');
      });

      it('should preserve manual edits to fieldName and allow re-syncing from label', () => {
        component.openCreateFieldModal();
        component.fieldForm.get('fieldLabel')?.setValue('Emergency Contact');
        expect(component.fieldForm.get('fieldName')?.value).toBe('emergency_contact');

        // Simulate user typing into fieldName manually
        component.onKeyManualInput();
        component.fieldForm.get('fieldName')?.setValue('custom_emergency_phone');

        // Change label further
        component.fieldForm.get('fieldLabel')?.setValue('Primary Emergency Contact');
        // Manual key must remain intact
        expect(component.fieldForm.get('fieldName')?.value).toBe('custom_emergency_phone');

        // Re-sync explicitly
        component.syncKeyFromLabel();
        expect(component.fieldForm.get('fieldName')?.value).toBe('primary_emergency_contact');
      });

      it('should not overwrite fieldName when editing an existing field definition', () => {
        const existingField: FieldDefinition = {
          fieldDefinitionId: 10,
          fieldName: 'disciplines',
          fieldLabel: 'Disciplines',
          fieldType: 'checkbox',
          defaultOptions: { options: ['Combat Sambo', 'Sport Sambo'] },
          validationRules: { required: true },
          isFilterable: true,
          isSortable: false,
          isSearchable: false,
          isGlobal: true,
        };

        component.openEditFieldModal(existingField);
        component.fieldForm.get('fieldLabel')?.setValue('Martial Arts Disciplines');
        expect(component.fieldForm.get('fieldName')?.value).toBe('disciplines');
      });
    });

    describe('Selection Limits Restriction (HF-FD-007)', () => {
      it('should reset minSelections and maxSelections when switching fieldType away from checkbox', () => {
        component.openCreateFieldModal();
        component.fieldForm.patchValue({
          fieldType: 'checkbox',
          minSelections: 1,
          maxSelections: 3,
        });

        // Switch to select (dropdown)
        component.fieldForm.get('fieldType')?.setValue('select');
        expect(component.fieldForm.get('minSelections')?.value).toBeNull();
        expect(component.fieldForm.get('maxSelections')?.value).toBeNull();

        // Set back to checkbox, fill, then switch to radio
        component.fieldForm.patchValue({
          fieldType: 'checkbox',
          minSelections: 2,
          maxSelections: 4,
        });
        component.fieldForm.get('fieldType')?.setValue('radio');
        expect(component.fieldForm.get('minSelections')?.value).toBeNull();
        expect(component.fieldForm.get('maxSelections')?.value).toBeNull();
      });

      it('should not persist minSelections or maxSelections in validationRules when fieldType is select or radio', () => {
        component.openCreateFieldModal();
        component.fieldForm.patchValue({
          fieldLabel: 'Weight Division',
          fieldName: 'weight_division',
          fieldType: 'select',
          minSelections: 1 as any,
          maxSelections: 2 as any,
        });
        component.addOption('Lightweight');

        component.onSubmitField();

        expect(formStoreMock.createFieldDefinition).toHaveBeenCalledWith(
          expect.objectContaining({
            fieldType: 'select',
            validationRules: undefined,
          }),
        );
      });

      it('should only render Min/Max Pick badges in formatRulesSummary for checkbox fields', () => {
        const selectField: FieldDefinition = {
          fieldDefinitionId: 1,
          fieldName: 'style',
          fieldLabel: 'Style',
          fieldType: 'select',
          validationRules: { minSelections: 1, maxSelections: 3 },
          isFilterable: false,
          isSortable: false,
          isSearchable: false,
          isGlobal: true,
        };

        const checkboxField: FieldDefinition = {
          fieldDefinitionId: 2,
          fieldName: 'categories',
          fieldLabel: 'Categories',
          fieldType: 'checkbox',
          validationRules: { minSelections: 1, maxSelections: 3 },
          isFilterable: false,
          isSortable: false,
          isSearchable: false,
          isGlobal: true,
        };

        const selectSummary = component.formatRulesSummary(selectField);
        expect(selectSummary).not.toContain('Min Pick: 1');
        expect(selectSummary).not.toContain('Max Pick: 3');

        const checkboxSummary = component.formatRulesSummary(checkboxField);
        expect(checkboxSummary).toContain('Min Pick: 1');
        expect(checkboxSummary).toContain('Max Pick: 3');
      });
    });

    describe('Default Enabled Flags (HF-FD-008)', () => {
      it('should initialize isFilterable, isSortable, and isSearchable to true by default in create mode', () => {
        component.openCreateFieldModal();
        expect(component.fieldForm.get('isFilterable')?.value).toBe(true);
        expect(component.fieldForm.get('isSortable')?.value).toBe(true);
        expect(component.fieldForm.get('isSearchable')?.value).toBe(true);
      });

      it('should preserve false values when editing an existing field definition with disabled flags', () => {
        const existingField: FieldDefinition = {
          fieldDefinitionId: 5,
          fieldName: 'notes',
          fieldLabel: 'Internal Notes',
          fieldType: 'textarea',
          isFilterable: false,
          isSortable: false,
          isSearchable: false,
          isGlobal: true,
        };

        component.openEditFieldModal(existingField);
        expect(component.fieldForm.get('isFilterable')?.value).toBe(false);
        expect(component.fieldForm.get('isSortable')?.value).toBe(false);
        expect(component.fieldForm.get('isSearchable')?.value).toBe(false);
      });
    });
  });
});
