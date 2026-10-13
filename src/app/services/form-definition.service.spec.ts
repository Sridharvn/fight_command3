import { TestBed } from '@angular/core/testing';
import { FormDefinitionService } from './form-definition.service';
import { ApiService } from './api.service';
import { of } from 'rxjs';
import { FieldDefinition, FormTemplate } from '../models/form-definition.models';

describe('FormDefinitionService', () => {
  let service: FormDefinitionService;
  let apiServiceMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  const mockField: FieldDefinition = {
    fieldDefinitionId: 10,
    fieldName: 'weight_kg',
    fieldLabel: 'Weight (kg)',
    fieldType: 'number',
    isFilterable: true,
    isSortable: true,
    isSearchable: false,
    isGlobal: true,
  };

  const mockTemplate: FormTemplate = {
    templateId: 1,
    templateName: 'National Sambo Championship Template',
    templateType: 'PRESET',
    sportType: 1,
    tournamentType: 1,
    isActive: true,
  };

  beforeEach(() => {
    apiServiceMock = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [FormDefinitionService, { provide: ApiService, useValue: apiServiceMock }],
    });

    service = TestBed.inject(FormDefinitionService);
  });

  it('should get all field definitions', () => {
    apiServiceMock.get.mockReturnValue(of([mockField]));

    service.getFieldDefinitions().subscribe((res) => {
      expect(res).toEqual([mockField]);
    });

    expect(apiServiceMock.get).toHaveBeenCalledWith('templates/field-definitions', {
      params: undefined,
    });
  });

  it('should create a field definition', () => {
    apiServiceMock.post.mockReturnValue(of(mockField));

    service
      .createFieldDefinition({
        fieldName: 'weight_kg',
        fieldLabel: 'Weight (kg)',
        fieldType: 'number',
      })
      .subscribe((res) => {
        expect(res).toEqual(mockField);
      });

    expect(apiServiceMock.post).toHaveBeenCalledWith('templates/field-definitions', {
      fieldName: 'weight_kg',
      fieldLabel: 'Weight (kg)',
      fieldType: 'number',
    });
  });

  it('should get templates', () => {
    apiServiceMock.get.mockReturnValue(of({ data: [mockTemplate], total: 1 }));

    service.getTemplates().subscribe((res) => {
      expect(res).toEqual({ data: [mockTemplate], total: 1 });
    });

    expect(apiServiceMock.get).toHaveBeenCalledWith('templates', { params: undefined });
  });

  it('should get preset templates', () => {
    apiServiceMock.get.mockReturnValue(of([mockTemplate]));

    service.getPresets().subscribe((res) => {
      expect(res).toEqual([mockTemplate]);
    });

    expect(apiServiceMock.get).toHaveBeenCalledWith('templates/presets');
  });

  it('should toggle template status', () => {
    apiServiceMock.patch.mockReturnValue(of(mockTemplate));

    service.toggleTemplateStatus(1, false).subscribe((res) => {
      expect(res).toEqual(mockTemplate);
    });

    expect(apiServiceMock.patch).toHaveBeenCalledWith('templates/1/status', { isActive: false });
  });
});
