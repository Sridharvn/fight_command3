import { TestBed } from '@angular/core/testing';
import { FormDefinitionStore } from './form-definition.store';
import { FormDefinitionService } from '../services/form-definition.service';
import { of } from 'rxjs';
import { FieldDefinition, FormTemplate } from '../models/form-definition.models';

describe('FormDefinitionStore', () => {
  let store: InstanceType<typeof FormDefinitionStore>;
  let formServiceMock: {
    getFieldDefinitions: ReturnType<typeof vi.fn>;
    getTemplates: ReturnType<typeof vi.fn>;
    getPresets: ReturnType<typeof vi.fn>;
    createFieldDefinition: ReturnType<typeof vi.fn>;
    deleteFieldDefinition: ReturnType<typeof vi.fn>;
    createTemplate: ReturnType<typeof vi.fn>;
    deleteTemplate: ReturnType<typeof vi.fn>;
    toggleTemplateStatus: ReturnType<typeof vi.fn>;
  };

  const mockField: FieldDefinition = {
    fieldDefinitionId: 1,
    fieldName: 'dob',
    fieldLabel: 'Date of Birth',
    fieldType: 'date',
    isFilterable: true,
    isSortable: false,
    isSearchable: false,
    isGlobal: true,
  };

  const mockTemplate: FormTemplate = {
    templateId: 1,
    templateName: 'State Championship',
    templateType: 'CUSTOM',
    sportType: 1,
    tournamentType: 2,
    isActive: true,
  };

  beforeEach(() => {
    formServiceMock = {
      getFieldDefinitions: vi.fn().mockReturnValue(of([mockField])),
      getTemplates: vi.fn().mockReturnValue(of({ data: [mockTemplate], total: 1 })),
      getPresets: vi.fn().mockReturnValue(of([])),
      createFieldDefinition: vi.fn(),
      deleteFieldDefinition: vi.fn(),
      createTemplate: vi.fn(),
      deleteTemplate: vi.fn(),
      toggleTemplateStatus: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        FormDefinitionStore,
        { provide: FormDefinitionService, useValue: formServiceMock },
      ],
    });

    store = TestBed.inject(FormDefinitionStore);
  });

  it('should initialize and load field definitions and templates', async () => {
    store.loadAll();
    await new Promise((r) => setTimeout(r, 20));

    expect(store.fieldDefinitions().length).toBe(1);
    expect(store.templates().length).toBe(1);
    expect(store.totalTemplates()).toBe(1);
  });

  it('should switch activeTab', () => {
    expect(store.activeTab()).toBe('templates');
    store.setActiveTab('fields');
    expect(store.activeTab()).toBe('fields');
  });

  it('should filter field definitions by search', async () => {
    store.loadAll();
    await new Promise((r) => setTimeout(r, 20));

    store.setSearchQuery('Birth');
    expect(store.filteredFieldDefinitions().length).toBe(1);

    store.setSearchQuery('NonExistent');
    expect(store.filteredFieldDefinitions().length).toBe(0);
  });

  it('should add a field definition to state', async () => {
    const newField: FieldDefinition = {
      fieldDefinitionId: 2,
      fieldName: 'rank',
      fieldLabel: 'Belt Rank',
      fieldType: 'select',
      isFilterable: false,
      isSortable: false,
      isSearchable: false,
      isGlobal: true,
    };
    formServiceMock.createFieldDefinition.mockReturnValue(of(newField));

    store.createFieldDefinition({
      fieldName: 'rank',
      fieldLabel: 'Belt Rank',
      fieldType: 'select',
    });
    await new Promise((r) => setTimeout(r, 20));

    expect(store.fieldDefinitions().some((f) => f.fieldDefinitionId === 2)).toBe(true);
  });
});
