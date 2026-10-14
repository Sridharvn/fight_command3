import { TestBed } from '@angular/core/testing';
import { FormBuilderStore } from './form-builder.store';
import { FormDefinition } from '../models/dynamic-form.models';

describe('FormBuilderStore', () => {
  let store: InstanceType<typeof FormBuilderStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FormBuilderStore],
    });
    store = TestBed.inject(FormBuilderStore);
  });

  it('should initialize with default template containing mandatory system fields (Full Name, Email, Phone Number) (HF-052)', () => {
    store.initNewTemplate(1, 1);
    const template = store.template();

    expect(template).toBeTruthy();
    expect(template?.fields.length).toBeGreaterThanOrEqual(3);

    const fullNameField = template?.fields.find((f) => f.key === 'fullName');
    const emailField = template?.fields.find((f) => f.key === 'email');
    const phoneField = template?.fields.find((f) => f.key === 'phone');

    expect(fullNameField).toBeTruthy();
    expect(fullNameField?.isSystemField).toBe(true);
    expect(fullNameField?.required).toBe(true);

    expect(emailField).toBeTruthy();
    expect(emailField?.isSystemField).toBe(true);
    expect(emailField?.required).toBe(true);

    expect(phoneField).toBeTruthy();
    expect(phoneField?.isSystemField).toBe(true);
    expect(phoneField?.required).toBe(true);
  });

  it('should add a new field to the template and set it active', () => {
    store.initNewTemplate(1, 1);
    const initialCount = store.template()!.fields.length;

    store.addField('number', 'Weight in KG');
    const updated = store.template()!;

    expect(updated.fields.length).toBe(initialCount + 1);
    const newField = updated.fields[updated.fields.length - 1];
    expect(newField.label).toBe('Weight in KG');
    expect(newField.type).toBe('number');
    expect(store.activeFieldId()).toBe(newField.id);
  });

  it('should update field properties while protecting system invariants', () => {
    store.initNewTemplate(1, 1);
    const fullNameField = store.template()!.fields.find((f) => f.key === 'fullName')!;

    // Cannot remove required from system field
    store.updateField(fullNameField.id, { required: false, label: 'Legal Name' });
    const updatedFullName = store.template()!.fields.find((f) => f.id === fullNameField.id)!;

    expect(updatedFullName.label).toBe('Legal Name');
    expect(updatedFullName.required).toBe(true); // System field remains required!
  });

  it('should prevent deleting system fields but allow deleting custom fields', () => {
    store.initNewTemplate(1, 1);
    const fullNameField = store.template()!.fields.find((f) => f.key === 'fullName')!;

    // Attempting to delete system field is ignored
    store.removeField(fullNameField.id);
    expect(store.template()!.fields.find((f) => f.id === fullNameField.id)).toBeTruthy();

    // Adding and removing custom field works
    store.addField('text', 'Belt Rank');
    const customField = store.template()!.fields.find((f) => f.label === 'Belt Rank')!;
    expect(customField).toBeTruthy();

    store.removeField(customField.id);
    expect(store.template()!.fields.find((f) => f.id === customField.id)).toBeUndefined();
  });

  it('should reorder fields properly via moveField', () => {
    store.initNewTemplate(1, 1);
    store.addField('text', 'Field A');
    store.addField('text', 'Field B');

    const fieldsBefore = store.template()!.fields;
    const aIndex = fieldsBefore.findIndex((f) => f.label === 'Field A');
    const bIndex = fieldsBefore.findIndex((f) => f.label === 'Field B');

    store.moveField(aIndex, bIndex);

    const fieldsAfter = store.template()!.fields;
    expect(fieldsAfter[bIndex].label).toBe('Field A');
  });

  it('should manage cross-field compound validations and live preview toggle', () => {
    store.initNewTemplate(1, 1);

    expect(store.isPreviewOpen()).toBe(false);
    store.setPreviewOpen(true);
    expect(store.isPreviewOpen()).toBe(true);

    store.addValidation({
      id: 'rule-waiver',
      name: 'Waiver Check',
      errorMessage: 'Waiver must be signed',
      when: { conjunction: 'AND', conditions: [] },
      then: { conjunction: 'AND', conditions: [] },
    });

    expect(store.template()!.validations.length).toBe(1);
    expect(store.template()!.validations[0].id).toBe('rule-waiver');

    store.removeValidation('rule-waiver');
    expect(store.template()!.validations.length).toBe(0);
  });

  it('should add a field from a FieldDefinition including fieldDefinitionId and default options', () => {
    store.initNewTemplate(1, 1);
    const initialCount = store.template()!.fields.length;

    store.addFieldFromDefinition({
      fieldDefinitionId: 42,
      fieldName: 'belt_rank',
      fieldLabel: 'Belt Rank',
      fieldType: 'select',
      isFilterable: true,
      isSortable: true,
      isSearchable: true,
      isGlobal: true,
      defaultOptions: { options: ['White', 'Blue', 'Purple', 'Brown', 'Black'] },
    });

    const updated = store.template()!;
    expect(updated.fields.length).toBe(initialCount + 1);

    const added = updated.fields[updated.fields.length - 1];
    expect(added.fieldDefinitionId).toBe(42);
    expect(added.label).toBe('Belt Rank');
    expect(added.key).toBe('belt_rank');
    expect(added.type).toBe('select');
    expect(added.options).toEqual([
      { label: 'White', value: 'white' },
      { label: 'Blue', value: 'blue' },
      { label: 'Purple', value: 'purple' },
      { label: 'Brown', value: 'brown' },
      { label: 'Black', value: 'black' },
    ]);
    expect(store.activeFieldId()).toBe(added.id);
  });

  it('should de-duplicate field key when adding a FieldDefinition whose key is already on the canvas', () => {
    store.initNewTemplate(1, 1);

    store.addFieldFromDefinition({
      fieldDefinitionId: 42,
      fieldName: 'belt_rank',
      fieldLabel: 'Belt Rank',
      fieldType: 'select',
      isFilterable: true,
      isSortable: true,
      isSearchable: true,
      isGlobal: true,
    });

    // Add again with same fieldName
    store.addFieldFromDefinition({
      fieldDefinitionId: 42,
      fieldName: 'belt_rank',
      fieldLabel: 'Belt Rank',
      fieldType: 'select',
      isFilterable: true,
      isSortable: true,
      isSearchable: true,
      isGlobal: true,
    });

    const fields = store.template()!.fields;
    const addedFields = fields.filter((f) => f.fieldDefinitionId === 42);
    expect(addedFields.length).toBe(2);
    expect(addedFields[0].key).toBe('belt_rank');
    expect(addedFields[1].key).not.toBe('belt_rank');
    expect(addedFields[1].key.startsWith('belt_rank_')).toBe(true);
  });

  it('should allow deleting non-system fields including date of birth and preset inherited fields (HF-053)', () => {
    store.setTemplate({
      templateName: 'Test Template',
      sportType: 1,
      tournamentType: 1,
      fields: [
        { id: 'dob_1', key: 'dob', label: 'Date of Birth', type: 'date', required: false },
        {
          id: 'preset_weight',
          key: 'weight_class',
          label: 'Weight Class',
          type: 'text',
          isInherited: true,
        },
      ],
      validations: [],
    });

    const fields = store.template()!.fields;
    const dobField = fields.find((f) => f.key === 'dob')!;
    const presetField = fields.find((f) => f.id === 'preset_weight')!;

    // Date of birth and preset fields can be deleted
    store.removeField(dobField.id);
    expect(store.template()!.fields.find((f) => f.id === dobField.id)).toBeUndefined();

    store.removeField(presetField.id);
    expect(store.template()!.fields.find((f) => f.id === presetField.id)).toBeUndefined();

    // But phone and email and full name remain non-deletable
    const phoneField = store.template()!.fields.find((f) => f.key === 'phone')!;
    store.removeField(phoneField.id);
    expect(store.template()!.fields.find((f) => f.key === 'phone')).toBeTruthy();
  });

  it('should support adding, updating, and removing options on choice fields (HF-054)', () => {
    store.initNewTemplate(1, 1);
    store.addField('select', 'Category');
    const field = store.template()!.fields.find((f) => f.label === 'Category')!;

    expect(field.options?.length).toBe(2);

    // Add option
    store.addFieldOption(field.id, { label: 'Option 3', value: 'opt_3' });
    let updatedField = store.template()!.fields.find((f) => f.id === field.id)!;
    expect(updatedField.options?.length).toBe(3);
    expect(updatedField.options?.[2].label).toBe('Option 3');

    // Update option
    store.updateFieldOption(field.id, 2, { label: 'Heavyweight', value: 'heavyweight' });
    updatedField = store.template()!.fields.find((f) => f.id === field.id)!;
    expect(updatedField.options?.[2].label).toBe('Heavyweight');

    // Remove option
    store.removeFieldOption(field.id, 0);
    updatedField = store.template()!.fields.find((f) => f.id === field.id)!;
    expect(updatedField.options?.length).toBe(2);
    expect(updatedField.options?.[0].label).toBe('Option 2');
  });
});
