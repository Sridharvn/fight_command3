import { Injectable } from '@angular/core';
import {
  AtomicRule,
  CrossFieldValidation,
  FormField,
  RuleGroup,
} from '../models/dynamic-form.models';

@Injectable({
  providedIn: 'root',
})
export class RuleEngineService {
  /**
   * Evaluates a node (RuleGroup or AtomicRule) against the provided formData.
   */
  evaluate(node: RuleGroup | AtomicRule, formData: Record<string, any>): boolean {
    if ('conjunction' in node) {
      if (node.conjunction === 'AND') {
        return node.conditions.every((child) => this.evaluate(child, formData));
      }
      return node.conditions.some((child) => this.evaluate(child, formData));
    }

    return this.evaluateAtomic(node, formData);
  }

  private evaluateAtomic(rule: AtomicRule, formData: Record<string, any>): boolean {
    const rawVal = formData[rule.fieldId];

    // Check if target value is referencing another field via { $field: string }
    const targetVal =
      typeof rule.value === 'object' && rule.value?.$field
        ? formData[rule.value.$field]
        : rule.value;

    if (rawVal === undefined || rawVal === null) {
      return false;
    }

    switch (rule.operator) {
      case 'equals':
        return String(rawVal) === String(targetVal) || rawVal === targetVal;
      case 'notEquals':
        return String(rawVal) !== String(targetVal) && rawVal !== targetVal;
      case 'greaterThan':
        return Number(rawVal) > Number(targetVal);
      case 'lessThan':
        return Number(rawVal) < Number(targetVal);
      case 'in':
        return Array.isArray(targetVal) ? targetVal.map(String).includes(String(rawVal)) : false;
      case 'notIn':
        return Array.isArray(targetVal) ? !targetVal.map(String).includes(String(rawVal)) : true;
      case 'contains':
        return Array.isArray(rawVal)
          ? rawVal.map(String).includes(String(targetVal))
          : String(rawVal).includes(String(targetVal));
      case 'countEquals':
        return Array.isArray(rawVal) && rawVal.length === Number(targetVal);
      case 'countLessThan':
        return Array.isArray(rawVal) && rawVal.length < Number(targetVal);
      case 'countGreaterThan':
        return Array.isArray(rawVal) && rawVal.length > Number(targetVal);
      case 'countMax':
        return Array.isArray(rawVal) && rawVal.length <= Number(targetVal);
      case 'countMin':
        return Array.isArray(rawVal) && rawVal.length >= Number(targetVal);
      default:
        return false;
    }
  }

  /**
   * Validates cross-field compound rules.
   * If WHEN evaluates to true, THEN must also evaluate to true.
   * If THEN evaluates to false, errorMessage is collected.
   */
  validateForm(validations: CrossFieldValidation[], formData: Record<string, any>): string[] {
    const errors: string[] = [];
    if (!validations || validations.length === 0) return errors;

    for (const v of validations) {
      const isTriggered = this.evaluate(v.when, formData);
      if (isTriggered) {
        const isCompliant = this.evaluate(v.then, formData);
        if (!isCompliant) {
          errors.push(v.errorMessage);
        }
      }
    }
    return errors;
  }

  /**
   * Validates individual field rules (required, min/max length, min/max value, selection limits).
   */
  validateFields(fields: FormField[], formData: Record<string, any>): string[] {
    const errors: string[] = [];
    if (!fields || fields.length === 0) return errors;

    for (const field of fields) {
      const val = formData[field.key || field.id];

      if (
        field.required &&
        (val === undefined ||
          val === null ||
          val === '' ||
          (Array.isArray(val) && val.length === 0))
      ) {
        errors.push(`Field "${field.label}" is required`);
        continue;
      }

      if (field.validationRules) {
        const rules = field.validationRules;

        if (Array.isArray(val)) {
          if (rules.maxSelections !== undefined && val.length > rules.maxSelections) {
            errors.push(
              `Field "${field.label}" allows maximum ${rules.maxSelections} selection${rules.maxSelections > 1 ? 's' : ''}`,
            );
          }
          if (rules.minSelections !== undefined && val.length < rules.minSelections) {
            errors.push(
              `Field "${field.label}" requires at least ${rules.minSelections} selection${rules.minSelections > 1 ? 's' : ''}`,
            );
          }
        }

        if (val !== undefined && val !== null && val !== '') {
          if (rules.minLength && String(val).length < rules.minLength) {
            errors.push(`Field "${field.label}" must be at least ${rules.minLength} characters`);
          }
          if (rules.maxLength && String(val).length > rules.maxLength) {
            errors.push(`Field "${field.label}" must be at most ${rules.maxLength} characters`);
          }
          if (rules.min !== undefined && Number(val) < rules.min) {
            errors.push(`Field "${field.label}" minimum value is ${rules.min}`);
          }
          if (rules.max !== undefined && Number(val) > rules.max) {
            errors.push(`Field "${field.label}" maximum value is ${rules.max}`);
          }
        }
      }
    }

    return errors;
  }
}
