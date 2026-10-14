import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormDefinitionsPage } from './form-definitions';
import { FormDefinitionStore } from '../../stores/form-definition.store';
import { RuleStore } from '../../stores/rule.store';
import { AuthStore } from '../../stores/auth.store';
import { LayoutStore } from '../../stores/layout.store';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { FieldDefinition, FormTemplate } from '../../models/form-definition.models';

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
      createTemplate: vi.fn(),
      deleteFieldDefinition: vi.fn(),
      deleteTemplate: vi.fn(),
      toggleTemplateStatus: vi.fn(),
    };

    ruleStoreMock = {
      rules: signal([]),
      loadRules: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [FormDefinitionsPage],
      providers: [
        provideRouter([]),
        { provide: FormDefinitionStore, useValue: formStoreMock },
        { provide: RuleStore, useValue: ruleStoreMock },
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
});
