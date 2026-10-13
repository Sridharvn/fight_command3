import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilderPage } from './form-builder';
import { FormBuilderStore } from '../../stores/form-builder.store';
import { FormDefinitionStore } from '../../stores/form-definition.store';
import { FormDefinitionService } from '../../services/form-definition.service';
import { RuleStore } from '../../stores/rule.store';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

describe('FormBuilderPage', () => {
  let component: FormBuilderPage;
  let fixture: ComponentFixture<FormBuilderPage>;
  let builderStore: InstanceType<typeof FormBuilderStore>;

  const mockFormDefinitionService = {
    getTemplateById: vi.fn().mockReturnValue(of({
      templateId: 10,
      templateName: 'Regional Championship Form',
      sportType: 1,
      tournamentType: 1,
      isActive: true,
      fields: [],
    })),
    createTemplate: vi.fn().mockReturnValue(of({ templateId: 11 })),
    updateTemplate: vi.fn().mockReturnValue(of({ templateId: 10 })),
    deleteTemplate: vi.fn().mockReturnValue(of({ message: 'Template deleted' })),
  };

  const mockRuleStore = {
    rules: vi.fn().mockReturnValue([]),
    loadRules: vi.fn(),
  };

  const mockFormDefinitionStore = {
    fieldDefinitions: vi.fn().mockReturnValue([
      {
        fieldDefinitionId: 101,
        fieldName: 'belt_rank',
        fieldLabel: 'Belt Rank',
        fieldType: 'select',
        isFilterable: true,
        isSortable: true,
        isSearchable: true,
        isGlobal: true,
      },
    ]),
    isLoading: vi.fn().mockReturnValue(false),
    loadFieldDefinitions: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormBuilderPage],
      providers: [
        provideRouter([{ path: 'form-definitions', component: class {} }]),
        FormBuilderStore,
        { provide: FormDefinitionService, useValue: mockFormDefinitionService },
        { provide: RuleStore, useValue: mockRuleStore },
        { provide: FormDefinitionStore, useValue: mockFormDefinitionStore },
      ],
    }).compileComponents();

    builderStore = TestBed.inject(FormBuilderStore);
    fixture = TestBed.createComponent(FormBuilderPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and render canvas with default system fields', () => {
    expect(component).toBeTruthy();
    const template = builderStore.template();
    expect(template).toBeTruthy();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.form-builder-container')).toBeTruthy();
    expect(compiled.textContent).toContain('Full Name');
    expect(compiled.textContent).toContain('Email Address');
  });

  it('should allow adding a new field from the field palette', () => {
    const initialFieldCount = builderStore.template()!.fields.length;
    component.onAddField('number', 'Athlete Weight');
    fixture.detectChanges();

    expect(builderStore.template()!.fields.length).toBe(initialFieldCount + 1);
    const addedField = builderStore.template()!.fields.find((f) => f.label === 'Athlete Weight');
    expect(addedField).toBeTruthy();
    expect(addedField?.type).toBe('number');
  });

  it('should toggle column span between 1 and 2', () => {
    component.onAddField('text', 'Emergency Contact');
    const field = builderStore.template()!.fields.find((f) => f.label === 'Emergency Contact')!;

    expect(field.columnSpan).toBe(1);
    component.onToggleColumnSpan(field.id);
    fixture.detectChanges();

    const updated = builderStore.template()!.fields.find((f) => f.id === field.id)!;
    expect(updated.columnSpan).toBe(2);
  });

  it('should open and close live preview modal with DynamicFormRenderer', () => {
    expect(builderStore.isPreviewOpen()).toBe(false);

    component.openLivePreview();
    fixture.detectChanges();
    expect(builderStore.isPreviewOpen()).toBe(true);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.preview-modal-backdrop')).toBeTruthy();
    expect(compiled.querySelector('app-dynamic-form-renderer')).toBeTruthy();

    component.closeLivePreview();
    fixture.detectChanges();
    expect(builderStore.isPreviewOpen()).toBe(false);
  });

  it('should add a cross-field validation rule', () => {
    component.onAddCompoundRule({
      id: 'rule-test-1',
      name: 'Weight Limit Check',
      errorMessage: 'Weight must be within tournament limits',
      when: {
        conjunction: 'AND',
        conditions: [{ fieldId: 'fullName', operator: 'notEquals', value: '' }],
      },
      then: {
        conjunction: 'AND',
        conditions: [],
      },
    });

    expect(builderStore.template()!.validations.length).toBe(1);
    expect(builderStore.template()!.validations[0].name).toBe('Weight Limit Check');
  });

  it('should switch to settings tab and update template metadata', () => {
    component.activeTab.set('settings');
    fixture.detectChanges();

    component.onUpdateTemplateSettings({
      sportType: 2,
      tournamentType: 3,
      description: 'Regional tournament registration',
    });

    const template = builderStore.template()!;
    expect(template.sportType).toBe(2);
    expect(template.tournamentType).toBe(3);
    expect(template.description).toBe('Regional tournament registration');
  });

  it('should call createTemplate when saving a new template without id', () => {
    builderStore.initNewTemplate(1, 1);
    builderStore.updateTemplateMetadata({ templateName: 'New Championship Template' });

    component.onSaveTemplate();

    expect(mockFormDefinitionService.createTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        templateName: 'New Championship Template',
        sportType: 1,
        tournamentType: 1,
      }),
    );
  });

  it('should delete existing template and navigate to form-definitions', () => {
    builderStore.setTemplate({
      id: 10,
      templateName: 'Regional Form',
      sportType: 1,
      tournamentType: 1,
      fields: [],
      validations: [],
    });
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    component.onDeleteTemplate();

    expect(mockFormDefinitionService.deleteTemplate).toHaveBeenCalledWith(10);
  });

  it('should render custom field definitions in palette and add them to canvas on click', () => {
    const initialFieldCount = builderStore.template()!.fields.length;
    const def = mockFormDefinitionStore.fieldDefinitions()[0];

    component.onAddFieldFromDefinition(def as any);
    fixture.detectChanges();

    expect(builderStore.template()!.fields.length).toBe(initialFieldCount + 1);
    const added = builderStore.template()!.fields.find((f) => f.fieldDefinitionId === 101);
    expect(added).toBeTruthy();
    expect(added?.label).toBe('Belt Rank');
    expect(added?.type).toBe('select');
  });
});
