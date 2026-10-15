# Martial Arts Events Manager - Frontend

A modern, responsive web application built with **Angular v21** (Standalone Components, Signals, and `@ngrx/signals` SignalStore) for managing martial arts tournaments, dynamic registration forms, athlete rosters, roles, and validation rules.

---

## Tech Stack & Architecture

- **Framework:** Angular v21 (Standalone components only, Signals, Native control flow `@if` / `@for`)
- **State Management:** `@ngrx/signals` (SignalStore with `withState`, `withComputed`, `withMethods`, `patchState`)
- **Styling:** SCSS, Tokenized CSS custom properties, Dark Mode design standard
- **Form Engine:** Custom Reactive Dynamic Form Engine with cross-field conditional rule evaluation
- **Testing:** [Vitest](https://vitest.dev/) with Angular TestBed
- **Formatting:** Prettier

---

## Rule Management System

The application features a modern, form-scoped **Rule Management System** that allows tournament organizers and administrators to define custom compliance logic, option selection limits, and cross-field validation rules directly on form templates.

### Key Capabilities

1. **Form-Scoped Rule Management (`/rule-management`)**:
   - Scope Selector enables toggling between **Global Cross-System Rules** and **Individual Form Templates** (e.g. _National Championship Form_, _MMA Registration Form_).
   - Dynamically populates field dropdowns in the rule builder based on the selected template's actual schema.
   - Shows live scope metadata: sport type, attached field count, and active rule count.

2. **Option Selection Constraints (`maxSelections` & `minSelections`)**:
   - Specifically built for multi-select choice fields (e.g., checkbox groups, weight classes, categories, divisions).
   - Configure a maximum limit (e.g., _"Select at most 3 categories"_) or minimum required selections (e.g., _"Select at least 1 division"_).
   - Automatically generates a registrant-facing error message with real-time reactive feedback in the dynamic registration form.

3. **Cross-Field Conditional Validation**:
   - Define `WHEN` conditions (e.g., `age < 18`) and `THEN` assertions (e.g., `guardian_consent == true`).
   - If `WHEN` conditions evaluate to true, the form enforces the `THEN` conditions; otherwise, the custom error message is surfaced to the athlete.

4. **Supported Operators**:
   - **Scalar Comparisons:** `equals`, `notEquals`, `greaterThan`, `greaterThanOrEqual`, `lessThan`, `lessThanOrEqual`, `in`, `notIn`.
   - **Option & Count Bounds:** `countMax`, `countMin`, `countEquals`, `countLessThan`, `countGreaterThan`, and `contains`.

5. **Client-Side Reactive Enforcement**:
   - `DynamicFormRenderer` monitors user inputs and array selections in real time.
   - Immediately flags invalid selection bounds (e.g. checking 4 checkboxes when maximum 3 are allowed) and displays inline error banners.

---

### How to Use the Rule Management UI

1. **Navigate to Rule Management**:
   - Click **Rule Management** in the sidebar navigation or browse to `/rule-management`.
2. **Choose the Rule Scope**:
   - In the **Select Rule Scope** dropdown, choose either `🌐 Global Compound Rules (Cross-System)` or a specific Form Template (e.g. `📋 Comprehensive Championship Multi-Item Form`).
3. **Open the Rule Creator**:
   - Click the **Add Rule** button (or **Create Rule in Scope**).
4. **Configure the Rule**:
   - **Selection Limit Tab (`☑ Selection Limit`)**:
     1. Enter a **Rule Name** (e.g., _"Max 3 Category Checkboxes"_).
     2. Select the **Target Multi-Option Field** from the template's dropdown list.
     3. Select the **Constraint Type** (`Maximum Selections` or `Minimum Selections`).
     4. Set the **Limit Count** (e.g., `3`).
     5. Customize the **Validation Error Message** if desired.
     6. Click **Save Rule**.
   - **Conditional Validation Tab (`➔ Conditional Validation`)**:
     1. Enter a **Rule Name** (e.g., _"Minor Parent Consent"_).
     2. Define the `WHEN` condition (e.g., Field: `age`, Operator: `lessThan`, Value: `18`).
     3. Define the `THEN` assertion (e.g., Field: `guardian_consent`, Operator: `equals`, Value: `true`).
     4. Enter the **Validation Error Message**.
     5. Click **Save Rule**.
5. **Managing Existing Rules**:
   - Rules attached to the template appear with metadata chips (`SELECTION LIMIT`, `VALIDATION`, `ACTIVE`).
   - Click the **Delete** button on any rule card to remove it from the template's schema.

---

## Development Server

To start the local development server:

```bash
npm start
# or
ng serve
```

Navigate to `http://localhost:4200/`. The application will automatically reload on source changes.

---

## Running Tests

Execute unit and integration tests using Vitest:

```bash
npm test -- --watch=false
```

To run a specific test suite:

```bash
npm test -- --include src/app/pages/rule-management/rule-management.spec.ts --watch=false
```

---

## Building for Production

Compile the production bundle:

```bash
npm run build
```

Build artifacts will be stored in the `dist/martial-arts-events-manager` directory.
