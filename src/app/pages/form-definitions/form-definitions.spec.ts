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

  it('should create and render templates tab by default inside BaseLayout', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-base-layout')).toBeTruthy();
    expect(compiled.textContent).toContain('National Championship Template');
  });

  it('should switch to field library tab', () => {
    component.switchTab('fields');
    fixture.detectChanges();

    expect(formStoreMock.setActiveTab).toHaveBeenCalledWith('fields');
  });

  it('should toggle field modal for field library', () => {
    expect(component.isFieldModalOpen()).toBe(false);
    component.openFieldModal();
    fixture.detectChanges();
    expect(component.isFieldModalOpen()).toBe(true);
    component.closeFieldModal();
    expect(component.isFieldModalOpen()).toBe(false);
  });

  it('should render New Form Template button opening inheritance setup modal (HF-NAV-009)', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const addTemplateBtn = compiled.querySelector('.create-template-btn') as HTMLButtonElement;
    expect(addTemplateBtn).toBeTruthy();
    expect(addTemplateBtn.textContent).toContain('New Form Template');
    expect(component.isCreateTemplateModalOpen()).toBe(false);
    addTemplateBtn.click();
    expect(component.isCreateTemplateModalOpen()).toBe(true);
  });

  it('should render Edit Form Template button on custom template card directing to /form-builder/:id (HF-NAV-010)', () => {
    templatesSignal.set([
      {
        templateId: 2,
        templateName: 'Regional Championship Custom',
        templateType: 'CUSTOM',
        sportType: 1,
        tournamentType: 1,
        isActive: true,
      },
    ]);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const editBtn = compiled.querySelector('.btn-edit') as HTMLAnchorElement;
    expect(editBtn).toBeTruthy();
    expect(editBtn.getAttribute('href')).toBe('/form-builder/2');

    const builderBtn = compiled.querySelector('.btn-builder') as HTMLAnchorElement;
    expect(builderBtn).toBeTruthy();
    expect(builderBtn.textContent?.trim()).toBe('Edit Form Template');
    expect(builderBtn.getAttribute('href')).toBe('/form-builder/2');
  });

  it('should call deleteTemplate when confirming deletion for custom template', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.onDeleteTemplate(1);
    expect(formStoreMock.deleteTemplate).toHaveBeenCalledWith(1);
  });

  it('should handle template preview modal open and close', () => {
    expect(component.previewingTemplate()).toBeNull();
    component.openPreviewModal(mockTemplate);
    expect(component.previewingTemplate()).toEqual(mockTemplate);
    expect(component.previewFormDefinition()).toBeTruthy();
    expect(component.previewFormDefinition()?.templateName).toBe(mockTemplate.templateName);

    component.closePreviewModal();
    expect(component.previewingTemplate()).toBeNull();
    expect(component.previewFormDefinition()).toBeNull();
  });

  it('should handle template creation inheritance modal open and close', () => {
    expect(component.isCreateTemplateModalOpen()).toBe(false);
    component.openCreateTemplateModal();
    expect(component.isCreateTemplateModalOpen()).toBe(true);

    component.closeCreateTemplateModal();
    expect(component.isCreateTemplateModalOpen()).toBe(false);
  });

  it('should safeguard PRESET templates: delete is hidden and clone link is rendered', () => {
    templatesSignal.set([mockTemplate]);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    // Template 1 is PRESET
    expect(compiled.querySelector('.btn-delete')).toBeFalsy();
    expect(compiled.querySelector('.btn-clone')).toBeTruthy();
    const cloneBtn = compiled.querySelector('.btn-clone') as HTMLAnchorElement;
    expect(cloneBtn.getAttribute('href')).toContain('cloneFrom=1');
  });

  it('should fetch complete template schema via getTemplateById when opening preview modal (HF-051)', () => {
    const fullTemplateMock: FormTemplate = {
      templateId: 1,
      templateName: 'National Championship Template',
      templateType: 'PRESET',
      sportType: 1,
      tournamentType: 1,
      isActive: true,
      formSchema: {
        fields: [
          { id: 'phone', key: 'phone', label: 'Phone Number', type: 'text', required: true },
          {
            id: 'belt_rank',
            key: 'belt_rank',
            label: 'Belt Rank',
            type: 'select',
            required: true,
            options: [{ label: 'White', value: 'white' }],
          },
          { id: 'dob', key: 'dob', label: 'Date of Birth', type: 'date', required: true },
        ],
        compoundRules: [],
      },
    };
    formDefinitionServiceMock.getTemplateById.mockReturnValue(of(fullTemplateMock));

    component.openPreviewModal(mockTemplate);
    fixture.detectChanges();

    expect(formDefinitionServiceMock.getTemplateById).toHaveBeenCalledWith(1);
    expect(component.previewFormDefinition()?.fields.length).toBeGreaterThanOrEqual(5); // fullName + email + 3 custom fields
    expect(component.previewFormDefinition()?.fields.some((f) => f.key === 'belt_rank')).toBe(true);
    expect(component.previewFormDefinition()?.fields.some((f) => f.key === 'dob')).toBe(true);
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
  });
});
