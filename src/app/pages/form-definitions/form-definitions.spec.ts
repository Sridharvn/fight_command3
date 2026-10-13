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

  it('should render Add Template link directing to Form Builder without a popup modal', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const addTemplateBtn = compiled.querySelector('.create-template-btn') as HTMLAnchorElement;
    expect(addTemplateBtn).toBeTruthy();
    expect(addTemplateBtn.getAttribute('href')).toBe('/form-builder/new');
    expect(compiled.querySelector('.template-modal-dialog')).toBeFalsy();
  });

  it('should render Edit button on template card directing to /form-builder/:id', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const editBtn = compiled.querySelector('.btn-edit') as HTMLAnchorElement;
    expect(editBtn).toBeTruthy();
    expect(editBtn.getAttribute('href')).toBe('/form-builder/1');
  });

  it('should call deleteTemplate when confirming deletion', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.onDeleteTemplate(1);
    expect(formStoreMock.deleteTemplate).toHaveBeenCalledWith(1);
  });
});
