import { computed } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import {
  CrossFieldValidation,
  FormDefinition,
  FormField,
  FormFieldType,
} from '../models/dynamic-form.models';
import { FieldDefinition } from '../models/form-definition.models';

export const DEFAULT_SYSTEM_FIELDS: FormField[] = [
  {
    id: 'fullName',
    key: 'fullName',
    label: 'Full Name',
    description: 'Athlete legal full name',
    type: 'text',
    required: true,
    isSystemField: true,
    columnSpan: 1,
    placeholder: 'Enter full legal name',
  },
  {
    id: 'email',
    key: 'email',
    label: 'Email Address',
    description: 'Primary contact email address',
    type: 'email',
    required: true,
    isSystemField: true,
    columnSpan: 1,
    placeholder: 'athlete@example.com',
  },
];

export interface FormBuilderState {
  template: FormDefinition | null;
  activeFieldId: string | null;
  isPreviewOpen: boolean;
  isSaving: boolean;
  error: string | null;
}

const initialState: FormBuilderState = {
  template: null,
  activeFieldId: null,
  isPreviewOpen: false,
  isSaving: false,
  error: null,
};

function ensureSystemFields(fields: FormField[]): FormField[] {
  const result = [...fields];
  for (const sysField of DEFAULT_SYSTEM_FIELDS) {
    const existingIndex = result.findIndex((f) => f.key === sysField.key);
    if (existingIndex >= 0) {
      result[existingIndex] = {
        ...result[existingIndex],
        required: true,
        isSystemField: true,
      };
    } else {
      result.unshift({ ...sysField });
    }
  }
  return result;
}

export const FormBuilderStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ template, activeFieldId }) => ({
    activeField: computed(() => {
      const current = template();
      const activeId = activeFieldId();
      if (!current || !activeId) return null;
      return current.fields.find((f) => f.id === activeId) || null;
    }),
    fieldCount: computed(() => template()?.fields.length || 0),
    validationCount: computed(() => template()?.validations.length || 0),
  })),
  withMethods((store) => ({
    initNewTemplate(sportType = 1, tournamentType = 1) {
      const newTemplate: FormDefinition = {
        templateName: 'Untitled Registration Form',
        description: '',
        sportType,
        tournamentType,
        version: '1.0.0',
        fields: [...DEFAULT_SYSTEM_FIELDS],
        validations: [],
      };
      patchState(store, {
        template: newTemplate,
        activeFieldId: null,
        isPreviewOpen: false,
        error: null,
      });
    },

    setTemplate(template: FormDefinition) {
      const patchedFields = ensureSystemFields(template.fields || []);
      patchState(store, {
        template: {
          ...template,
          fields: patchedFields,
          validations: template.validations || [],
        },
        activeFieldId: patchedFields[0]?.id || null,
        error: null,
      });
    },

    setActiveField(fieldId: string | null) {
      patchState(store, { activeFieldId: fieldId });
    },

    setPreviewOpen(isOpen: boolean) {
      patchState(store, { isPreviewOpen: isOpen });
    },

    updateTemplateMetadata(
      metadata: Partial<
        Pick<
          FormDefinition,
          'id' | 'templateName' | 'description' | 'sportType' | 'tournamentType'
        >
      >,
    ) {
      const current = store.template();
      if (!current) return;
      patchState(store, {
        template: {
          ...current,
          ...metadata,
        },
      });
    },

    addField(type: FormFieldType, label = 'New Field') {
      const current = store.template();
      if (!current) return;

      const randomSuffix = Math.random().toString(36).substring(2, 6);
      const id = `field_${Date.now()}_${randomSuffix}`;
      const key = `${label.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${randomSuffix}`;

      const newField: FormField = {
        id,
        key,
        label,
        type,
        required: false,
        columnSpan: 1,
        options:
          type === 'select' || type === 'radio'
            ? [
                { label: 'Option 1', value: 'opt_1' },
                { label: 'Option 2', value: 'opt_2' },
              ]
            : undefined,
      };

      patchState(store, {
        template: {
          ...current,
          fields: [...current.fields, newField],
        },
        activeFieldId: id,
      });
    },

    addFieldFromDefinition(def: FieldDefinition) {
      const current = store.template();
      if (!current) return;

      const randomSuffix = Math.random().toString(36).substring(2, 6);
      const id = `field_${Date.now()}_${randomSuffix}`;

      // De-duplicate field key if collision occurs
      let key = def.fieldName;
      if (current.fields.some((f) => f.key === key)) {
        key = `${def.fieldName}_${randomSuffix}`;
      }

      // Map options
      let options = undefined;
      const rawOptions = (def.defaultOptions as any)?.options;
      if (Array.isArray(rawOptions) && rawOptions.length > 0) {
        options = rawOptions.map((opt: string) => ({
          label: opt,
          value: opt.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        }));
      } else if (def.fieldType === 'select' || def.fieldType === 'radio') {
        options = [
          { label: 'Option 1', value: 'opt_1' },
          { label: 'Option 2', value: 'opt_2' },
        ];
      }

      const newField: FormField = {
        id,
        fieldDefinitionId: def.fieldDefinitionId,
        key,
        label: def.fieldLabel,
        type: def.fieldType as FormFieldType,
        required: false,
        columnSpan: 1,
        options,
        validationRules: def.validationRules as any,
      };

      patchState(store, {
        template: {
          ...current,
          fields: [...current.fields, newField],
        },
        activeFieldId: id,
      });
    },

    updateField(fieldId: string, updates: Partial<FormField>) {
      const current = store.template();
      if (!current) return;

      const updatedFields = current.fields.map((field) => {
        if (field.id !== fieldId) return field;

        const merged = { ...field, ...updates };
        if (field.isSystemField) {
          merged.required = true;
          merged.isSystemField = true;
        }
        return merged;
      });

      patchState(store, {
        template: {
          ...current,
          fields: updatedFields,
        },
      });
    },

    removeField(fieldId: string) {
      const current = store.template();
      if (!current) return;

      const target = current.fields.find((f) => f.id === fieldId);
      if (target?.isSystemField) {
        // Protected invariant: cannot delete Full Name or Email
        return;
      }

      patchState(store, {
        template: {
          ...current,
          fields: current.fields.filter((f) => f.id !== fieldId),
        },
        activeFieldId:
          store.activeFieldId() === fieldId ? null : store.activeFieldId(),
      });
    },

    duplicateField(fieldId: string) {
      const current = store.template();
      if (!current) return;

      const target = current.fields.find((f) => f.id === fieldId);
      if (!target) return;

      const randomSuffix = Math.random().toString(36).substring(2, 6);
      const newId = `field_${Date.now()}_${randomSuffix}`;
      const newKey = `${target.key}_copy_${randomSuffix}`;

      const clonedField: FormField = {
        ...target,
        id: newId,
        key: newKey,
        label: `${target.label} (Copy)`,
        isSystemField: false, // Duplicates are custom fields
      };

      const targetIdx = current.fields.findIndex((f) => f.id === fieldId);
      const newFields = [...current.fields];
      newFields.splice(targetIdx + 1, 0, clonedField);

      patchState(store, {
        template: {
          ...current,
          fields: newFields,
        },
        activeFieldId: newId,
      });
    },

    moveField(fromIndex: number, toIndex: number) {
      const current = store.template();
      if (!current) return;

      if (
        fromIndex < 0 ||
        fromIndex >= current.fields.length ||
        toIndex < 0 ||
        toIndex >= current.fields.length
      ) {
        return;
      }

      const reordered = [...current.fields];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, moved);

      patchState(store, {
        template: {
          ...current,
          fields: reordered,
        },
      });
    },

    addValidation(validation: CrossFieldValidation) {
      const current = store.template();
      if (!current) return;

      patchState(store, {
        template: {
          ...current,
          validations: [...current.validations, validation],
        },
      });
    },

    updateValidation(validationId: string, updates: Partial<CrossFieldValidation>) {
      const current = store.template();
      if (!current) return;

      patchState(store, {
        template: {
          ...current,
          validations: current.validations.map((v) =>
            v.id === validationId ? { ...v, ...updates } : v,
          ),
        },
      });
    },

    removeValidation(validationId: string) {
      const current = store.template();
      if (!current) return;

      patchState(store, {
        template: {
          ...current,
          validations: current.validations.filter((v) => v.id !== validationId),
        },
      });
    },

    setSaving(isSaving: boolean) {
      patchState(store, { isSaving });
    },

    setError(error: string | null) {
      patchState(store, { error });
    },
  })),
);
