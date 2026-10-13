import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormDefinitionsPage } from './form-definitions';
import { FormDefinitionStore } from '../../stores/form-definition.store';
import { RuleStore } from '../../stores/rule.store';
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
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FormDefinitionsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and render templates tab by default', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('National Championship Template');
  });

  it('should switch to field library tab', () => {
    component.switchTab('fields');
    fixture.detectChanges();

    expect(formStoreMock.setActiveTab).toHaveBeenCalledWith('fields');
  });

  it('should toggle field modal and template modal', () => {
    expect(component.isFieldModalOpen()).toBe(false);
    component.openFieldModal();
    fixture.detectChanges();
    expect(component.isFieldModalOpen()).toBe(true);
    component.closeFieldModal();
    expect(component.isFieldModalOpen()).toBe(false);

    expect(component.isTemplateModalOpen()).toBe(false);
    component.openTemplateModal();
    fixture.detectChanges();
    expect(component.isTemplateModalOpen()).toBe(true);
    component.closeTemplateModal();
    expect(component.isTemplateModalOpen()).toBe(false);
  });
});
