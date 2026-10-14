# Automation Tests Specification

## Feature / Change: User Authentication, Login Screen & JWT Interceptor Session Handling

**Priority:** High
**Desired Behavior:**
The application provides an accessible login screen (`/login`) allowing users to authenticate via email and password against the backend API (`POST /auth/login`). Upon login, JWT tokens (`accessToken`, `refreshToken`) and user profile are loaded and managed in `AuthStore` and persisted in `localStorage`. All outgoing API requests to backend endpoints automatically include `Authorization: Bearer <accessToken>`. If an API request fails with `401 Unauthorized`, an HTTP interceptor catches the response, triggers a token refresh using `POST /auth/refresh`, queues any concurrent requests, and replays failed calls once the token is refreshed. If token refresh fails (e.g., refresh token expired or invalid), the session is cleared and the user is redirected to `/login`. Functional guards (`authGuard`, `guestGuard`) ensure proper access control.

---

## Preconditions

1. Frontend is configured with `provideHttpClient(withFetch(), withInterceptors([authInterceptor]))`.
2. Backend API is reachable (default base URL `http://localhost:3000`).
3. Application routes include `/login`, `/`, `/users`, and `/roles`.

---

## Test Data

- Valid user credentials: `{ email: "test@test.com", password: "test" }`
- Invalid user credentials: `{ email: "test@test.com", password: "WrongPassword" }`
- Initial token mock:
  - `accessToken`: `"valid.jwt.access_token"`
  - `refreshToken`: `"valid.jwt.refresh_token"`
- Expired token mock:
  - `expiredAccessToken`: `"expired.jwt.access_token"`
  - `expiredRefreshToken`: `"expired.jwt.refresh_token"`

---

## Scenarios

### Happy Flows

**HF-001: Successful Login Flow**

- **Preconditions:** User is on `/login` and not authenticated.
- **User/System actions:** User enters valid email and password, then clicks "Sign In".
- **Expected results:**
  - Login request `POST /auth/login` is sent with `{ email, password }`.
  - On response, tokens are stored in `localStorage` and `AuthStore`.
  - User details are fetched via `GET /users/current` and saved to `AuthStore`.
  - User is navigated to `/` (or specified `returnUrl`).
- **Final state:** `authStore.isAuthenticated()` is `true`, user is on destination page.

**HF-002: Automatic Bearer Token Attachment**

- **Preconditions:** User is authenticated with an active `accessToken`.
- **User/System actions:** Any feature triggers an API request to a backend endpoint (e.g. `GET /users/current`).
- **Expected results:** `authInterceptor` inspects request; appends header `Authorization: Bearer <accessToken>`.
- **Final state:** Backend receives authenticated request with valid Bearer header.

**HF-003: Token Refresh on 401 & Replay**

- **Preconditions:** User is authenticated; access token has expired.
- **User/System actions:** App makes a protected request `GET /api/resource`; backend returns `401 Unauthorized`.
- **Expected results:**
  - `authInterceptor` catches 401 status.
  - Calls `POST /auth/refresh` sending `Authorization: Bearer <refreshToken>`.
  - Backend returns new `{ accessToken, refreshToken }`.
  - `AuthStore` updates stored tokens.
  - Original request `GET /api/resource` is cloned with new `accessToken` and replayed.
  - Calling component receives successful response without seeing failure.
- **Final state:** Request succeeds; active tokens updated in state and storage.

**HF-004: Concurrent 401 Deduplication & Queueing**

- **Preconditions:** User is authenticated; access token has expired.
- **User/System actions:** Multiple requests (e.g. `GET /api/req1` and `GET /api/req2`) fire concurrently and both receive 401.
- **Expected results:**
  - Only one `POST /auth/refresh` request is initiated.
  - Second request is queued and awaits the refresh resolution.
  - Both requests are replayed once refresh finishes with the new access token.
- **Final state:** Both requests succeed; only one token refresh occurs.

**HF-005: User Sign Out**

- **Preconditions:** User is authenticated.
- **User/System actions:** User triggers `logout()`.
- **Expected results:**
  - `POST /auth/signOut` is sent with current access token.
  - Tokens and user information are cleared from `AuthStore` and `localStorage`.
  - User is navigated to `/login`.
- **Final state:** `authStore.isAuthenticated()` is `false`.

**HF-006: Authenticated Sidemenu Visibility**

- **Preconditions:** User is authenticated.
- **User/System actions:** Navigate to `/` or any internal page.
- **Expected results:** Sidemenu is visible in layout with navigation buttons for Home (`/`), User Management (`/users`), and Role Management (`/roles`).
- **Final state:** Sidemenu rendered.

**HF-007: Sidemenu Collapse & Expand Toggle**

- **Preconditions:** User is authenticated, sidemenu is expanded (250px).
- **User/System actions:** User clicks collapse toggle button in header/sidebar.
- **Expected results:** Sidemenu transitions to compact icon-only mode (68px); preference is saved to `localStorage`.
- **Final state:** Sidemenu is collapsed.

**HF-008: Sidemenu Active Route Highlighting**

- **Preconditions:** User is authenticated.
- **User/System actions:** User clicks "User Management" (`/users`).
- **Expected results:** Route transitions to `/users`; "User Management" link receives `active` class and `aria-current="page"`.
- **Final state:** `/users` active in sidemenu.

**HF-009: User Management - List Users with Pagination & Filters**

- **Preconditions:** User is authenticated on `/users`.
- **User/System actions:** Page loads; user types in search box or switches status tab (`Active`/`Deleted`/`All`).
- **Expected results:** `GET /users` is triggered with `{ page, limit, search, status }`; table updates with user list, role badge, location tags, and pagination indicators.
- **Final state:** Filtered users rendered.

**HF-010: User Management - Create User with Cascading Location Scope**

- **Preconditions:** User is on `/users`.
- **User/System actions:**
  - Clicks "Add User" button; modal opens.
  - Fills in firstName, lastName, email, password, and selects Role.
  - Selects Country (queries `GET /master-data/countries/:id/states`).
  - Selects State (queries `GET /master-data/states/:id/districts`).
  - Selects District.
  - Submits form (`POST /users`).
- **Expected results:** User is created successfully; modal closes; user table refreshes to include new user.
- **Final state:** New user appears in list.

**HF-011: User Management - Update User Details**

- **Preconditions:** User exists in `/users` list.
- **User/System actions:** Admin clicks "Edit" on a user row, modifies designation/phone/role, and submits (`PUT /users/:id`).
- **Expected results:** User is updated successfully; table reflects changes.
- **Final state:** User details updated.

**HF-012: User Management - Soft Delete User**

- **Preconditions:** User exists in `/users` list.
- **User/System actions:** Admin clicks "Delete", confirms dialog (`DELETE /users/:id`).
- **Expected results:** User is soft-deleted; disappears from "Active" tab; appears under "Deleted" tab.
- **Final state:** User soft-deleted.

**HF-013: User Management - Reactivate Deleted User**

- **Preconditions:** Admin is on "Deleted" tab in `/users`.
- **User/System actions:** Admin clicks "Reactivate" on a deleted user (`PATCH /users/:id/reactivate`).
- **Expected results:** User is restored to active status; appears back on "Active" tab.
- **Final state:** User active.

**HF-014: Role Management - List Roles & Hierarchy**

- **Preconditions:** User is authenticated on `/roles`.
- **User/System actions:** Page loads.
- **Expected results:** `GET /roles` and `GET /roles/permissions/available` are called; roles are rendered with name, scope badge, hierarchy level, and assigned permissions count.
- **Final state:** Roles displayed.

**HF-015: Role Management - Create Role with Categorized Permission Matrix**

- **Preconditions:** User is on `/roles`.
- **User/System actions:**
  - Clicks "Create Role" button; modal opens.
  - Fills role name, selects Scope Type (`GLOBAL`, `COUNTRY`, `STATE`, `DISTRICT`).
  - In permission matrix, toggles permissions across Users, Roles, Events, etc.
  - Submits form (`POST /roles`).
- **Expected results:** Role is created successfully; modal closes; new role card appears in list.
- **Final state:** New role listed.

**HF-016: Role Management - Update Role Permissions**

- **Preconditions:** Custom role exists on `/roles`.
- **User/System actions:** User clicks "Edit", toggles permissions in matrix, and submits (`PUT /roles/:id`).
- **Expected results:** Role is updated with new permissions.
- **Final state:** Role updated.

**HF-017: Role Management - Delete Custom Role**

- **Preconditions:** Non-system custom role exists.
- **User/System actions:** User clicks "Delete" and confirms (`DELETE /roles/:id`).
- **Expected results:** Role is deleted; disappears from list.
- **Final state:** Role removed.

**HF-018: Sidemenu Footer User Details Display**

- **Preconditions:** User is authenticated.
- **User/System actions:** User views the sidemenu in expanded or collapsed mode.
- **Expected results:**
  - In expanded mode: Sidemenu bottom footer displays user avatar (initials), full name, email address, role badge, and a distinct full-width "Logout" button with icon and text.
  - In collapsed mode: Sidemenu bottom footer displays user avatar with title tooltip (name, email, role), and a compact logout icon button.
- **Final state:** User details and logout button clearly visible in sidemenu bottom.

**HF-019: Sidemenu Logout Action**

- **Preconditions:** User is authenticated and sidemenu is visible.
- **User/System actions:** User clicks the "Logout" button in the sidemenu footer.
- **Expected results:**
  - `authStore.logout()` is called.
  - Auth tokens and user profile are removed from `localStorage` and memory.
  - Sidemenu is removed from the DOM.
  - User is navigated to `/login`.
- **Final state:** Session terminated; unauthenticated view displayed.

**HF-020: Header User Details Display**

- **Preconditions:** User is authenticated.
- **User/System actions:** User views the application header.
- **Expected results:**
  - Header displays user profile container with user avatar (initials), full name, email address, and role badge.
  - Header displays a "Logout" button.
- **Final state:** User details and logout button clearly visible in header.

**HF-021: Header Logout Action**

- **Preconditions:** User is authenticated and header is visible.
- **User/System actions:** User clicks the "Logout" button in the header.
- **Expected results:**
  - `authStore.logout()` is called.
  - Tokens cleared, user redirected to `/login`, header switches to public "Sign In" button.
- **Final state:** Session terminated; unauthenticated view displayed.

**HF-022: Rule Management - List Global Compound Rules**

- **Preconditions:** User is authenticated on `/rule-management`.
- **User/System actions:** Page loads.
- **Expected results:** `GET /templates/global-compound-rules` is called; rules are rendered in a clean grid showing rule name, description, condition logic summary, error message, and active status.
- **Final state:** Rules displayed.

**HF-023: Rule Management - Create Global Compound Rule**

- **Preconditions:** User is authenticated on `/rule-management`.
- **User/System actions:** User clicks "Create Rule", fills name, description, adds WHEN condition (`fieldId`, `operator`, `value`), adds THEN action assertion, enters error message, and clicks "Create Rule".
- **Expected results:** `POST /templates/global-compound-rules` is sent with payload; modal closes; rules list refreshes with the new rule.
- **Final state:** Rule saved and visible in grid.

**HF-024: Rule Management - Update and Delete Compound Rule**

- **Preconditions:** Rule exists in list.
- **User/System actions:** User edits rule fields (`PUT /templates/global-compound-rules/:id`) or clicks delete and confirms dialog (`DELETE /templates/global-compound-rules/:id`).
- **Expected results:** API call succeeds; UI state updates accordingly.
- **Final state:** Rule updated or removed from state.

**HF-025: Form Definitions - List Field Definitions Library**

- **Preconditions:** User is authenticated on `/form-definitions`.
- **User/System actions:** User selects "Field Library" tab.
- **Expected results:** `GET /templates/field-definitions` is called; table displays registered field definitions (machine key, human label, input type, filterable/sortable badges).
- **Final state:** Field definitions listed.

**HF-026: Form Definitions - Create Reusable Field Definition**

- **Preconditions:** User on "Field Library" tab.
- **User/System actions:** User clicks "Create Field", enters `fieldName` (snake_case), `fieldLabel`, selects `fieldType` (e.g. `select`), enters options if applicable, toggles filterable/sortable flags, and submits.
- **Expected results:** `POST /templates/field-definitions` is sent; modal closes; new field definition appears in list.
- **Final state:** Field definition created.

**HF-027: Form Definitions - List Form Templates**

- **Preconditions:** User on `/form-definitions` under "Form Templates" tab.
- **User/System actions:** Page loads.
- **Expected results:** `GET /templates` is called; templates are displayed with name, sport type, tournament type, preset/custom badges, active status toggle, and fields count.
- **Final state:** Form templates listed.

**HF-028: Form Definitions - Create Form Template Navigates to Form Builder**

- **Preconditions:** User is authenticated on `/form-definitions` under "Form Templates" tab.
- **User/System actions:** User clicks "Add Template" (or "Create First Template" if list is empty).
- **Expected results:**
  - Application does NOT open a popup modal.
  - User is navigated directly to `/form-builder/new` (or `/form-builder`).
  - `FormBuilderPage` initializes a clean new template state with default protected system fields (`Full Name`, `Email Address`).
- **Final state:** User is in the Form Builder workspace authoring the new template schema.

**HF-029: Rule Management - BaseLayout, Header & Sidemenu Integration**

- **Preconditions:** User is authenticated on `/rule-management`.
- **User/System actions:** User accesses or refreshes `/rule-management`.
- **Expected results:**
  - Page is enclosed in `<app-base-layout>`.
  - Authenticated sidemenu (`<app-base-sidebar>`) is rendered with collapsible toggle, navigation links, and user bottom details.
  - Header (`<app-base-header>`) is rendered with navigation links, user profile details pill, and logout button.
  - Page visuals (header, title typography, search toolbar, buttons, cards, modals) match the design system established in Users and Roles.
- **Final state:** Consistent shell and theme displayed.

**HF-030: Form Definitions - BaseLayout, Header & Sidemenu Integration**

- **Preconditions:** User is authenticated on `/form-definitions`.
- **User/System actions:** User accesses or refreshes `/form-definitions`.
- **Expected results:**
  - Page is enclosed in `<app-base-layout>`.
  - Authenticated sidemenu (`<app-base-sidebar>`) is rendered with collapsible toggle, navigation links, and user bottom details.
  - Header (`<app-base-header>`) is rendered with navigation links, user profile details pill, and logout button.
  - Page visuals (header, title typography, tab navigation, search toolbar, table, badges, modals) match the design system established in Users and Roles.
- **Final state:** Consistent shell and theme displayed.

**HF-031: RuleEngineService - Conjunction Evaluation (AND / OR)**

- **Preconditions:** `RuleEngineService` is instantiated.
- **User/System actions:** Evaluates rule trees with `conjunction: 'AND'` and `conjunction: 'OR'`.
- **Expected results:**
  - AND returns `true` only if all child conditions evaluate to `true`.
  - OR returns `true` if any child condition evaluates to `true`.
- **Final state:** Deterministic boolean result returned.

**HF-032: RuleEngineService - Atomic Operators Evaluation**

- **Preconditions:** `RuleEngineService` is instantiated.
- **User/System actions:** Evaluates atomic rules with operators: `equals`, `notEquals`, `greaterThan`, `lessThan`, `in`, `notIn`, and `$field` pointers.
- **Expected results:** Correct boolean evaluation for strings, numbers, arrays, and field-to-field references.
- **Final state:** Accurate evaluation matching backend `RuleEngine.util.ts`.

**HF-033: RuleEngineService - Cross-Field Validation & Error Message Generation**

- **Preconditions:** Cross-field validation rule defined (e.g., WHEN `age < 18` THEN `guardian_consent == true`).
- **User/System actions:** Runs `validateForm()` on compliant and non-compliant payloads.
- **Expected results:**
  - Compliant payload returns empty array `[]`.
  - Non-compliant payload returns array with rule's `errorMessage`.
- **Final state:** Compliance errors returned.

**HF-034: DynamicFormRenderer - Reactive FormGroup Generation from JSON Schema**

- **Preconditions:** `DynamicFormRendererComponent` receives a `FormDefinition` schema with text, number, select, radio, checkbox, and date fields.
- **User/System actions:** Component renders.
- **Expected results:**
  - Creates reactive `FormGroup` with a `FormControl` per field ID.
  - Applies field validation rules (`required`, `min`, `max`, `minLength`, `maxLength`).
  - Emits `formReady` output with initialized `FormGroup`.
- **Final state:** Interactive form displayed to user.

**HF-035: DynamicFormRenderer - Real-Time AST Rule Violation & Compliance Banner**

- **Preconditions:** Schema contains cross-field AST validations.
- **User/System actions:** User inputs data that triggers the WHEN condition but fails the THEN requirement.
- **Expected results:**
  - Top red compliance banner dynamically displays the violation message.
  - Form status becomes `INVALID`.
  - Submit button is disabled.
- **Final state:** User alerted in real-time.

**HF-036: DynamicFormRenderer - Read-Only / Disabled Simulation Mode**

- **Preconditions:** `disabled` input signal set to `true`.
- **User/System actions:** User views rendered form.
- **Expected results:**
  - All form controls are disabled (`disabled: true`).
  - Form widgets visually dimmed (`cursor-not-allowed`, reduced opacity).
  - Submit button disabled or hidden.
- **Final state:** Read-only view rendered.

**HF-037: FormBuilderStore - System Field Protection Invariant**

- **Preconditions:** `FormBuilderStore` is initialized with new or existing template.
- **User/System actions:** Admin inspects default fields or attempts to delete `Full Name` or `Email`.
- **Expected results:**
  - `Full Name` and `Email` are present by default with `isSystemField: true`.
  - `removeField()` blocks deletion of system fields.
  - `required` cannot be toggled to false for system fields.
- **Final state:** Identity resolution fields preserved.

**HF-038: FormBuilderStore - Field Insertion, Duplication, and Reordering**

- **Preconditions:** `FormBuilderStore` has active template.
- **User/System actions:** Adds new field (`addField('select')`), duplicates a field (`duplicateField(id)`), and reorders (`moveField(prev, curr)`).
- **Expected results:**
  - New field inserted with unique ID.
  - Duplicated field cloned with unique ID and updated label/key.
  - Fields array order updated immutably.
- **Final state:** Schema updated in store.

**HF-039: FormBuilderPage - Interactive Canvas & CdkDragDrop Reordering**

- **Preconditions:** Admin is on `/form-builder` or `/form-builder/:id`.
- **User/System actions:** Reorders field cards via CDK drag handle (`cdkDropListDropped`).
- **Expected results:** Field cards smoothly transition and reorder in canvas and store state.
- **Final state:** Reordered list persisted.

**HF-040: FormBuilderPage - Live Preview Modal with DynamicFormRenderer**

- **Preconditions:** Admin authors form in canvas and clicks "Live Preview".
- **User/System actions:** Clicks "Live Preview" button in header.
- **Expected results:**
  - Modal opens embedding `DynamicFormRendererComponent` passing the builder's active `schema()`.
  - Admin can fill out the form, test real-time AST compliance alerts, and test simulate disabled toggle.
- **Final state:** Live interactive simulation works without page reload.

**HF-041: Form Definitions - Edit Form Template Navigates to Form Builder**

- **Preconditions:** User is authenticated on `/form-definitions` with existing templates loaded.
- **User/System actions:** User clicks "Edit" button (`.btn-edit`) or "Open Form Builder" on a template card.
- **Expected results:**
  - Application does NOT open a popup modal.
  - User is navigated directly to `/form-builder/:id`.
  - `FormBuilderPage` loads the template by ID including fields, metadata (sport discipline, tournament level), and compound cross-field validation rules.
- **Final state:** User is in the Form Builder workspace with existing template pre-populated.

**HF-042: Form Template Delete from Template Card in FormDefinitionsPage**

- **Preconditions:** User is authenticated on `/form-definitions`.
- **User/System actions:** User clicks delete button on a template card; confirms the confirmation prompt.
- **Expected results:**
  - `DELETE /templates/:id` is executed via `FormDefinitionStore.deleteTemplate()`.
  - Template is removed from store state and UI count decreases by 1.
- **Final state:** Template removed from view.

**HF-043: Form Template Delete from FormBuilderPage Top Bar**

- **Preconditions:** User is on `/form-builder/:id` editing an existing template.
- **User/System actions:** User clicks "Delete Template" in the top bar; confirms the prompt.
- **Expected results:**
  - `DELETE /templates/:id` is executed via `FormDefinitionService`.
  - User is navigated back to `/form-definitions`.
- **Final state:** Navigated to `/form-definitions`, deleted template removed.

**HF-044: Form Builder - Template Settings Tab & Metadata Authoring**

- **Preconditions:** User is in `FormBuilderPage` on any template.
- **User/System actions:** User switches to the "Template Settings" sub-tab; updates template name, sport discipline (e.g. Sambo, MMA, BJJ), tournament level (National, State, District, Invitational), and template description.
- **Expected results:**
  - `FormBuilderStore.updateTemplateMetadata()` updates the reactive template state.
  - Clicking "Save Template" serializes the metadata and saves to backend (`POST /templates` for new, `PUT /templates/:id` for existing).
- **Final state:** Template metadata saved in backend and state.

**HF-045: Form Definitions - Template Modal Popup Elimination**

- **Preconditions:** User is on `/form-definitions`.
- **User/System actions:** Inspect DOM and trigger actions on templates.
- **Expected results:**
  - No template creation or editing popup dialog (`isTemplateModalOpen`) exists in the template.
  - All template create and edit flows route directly through `FormBuilderPage`.
- **Final state:** Simplified, unified workflow with 0 popup dialogs for templates.

**HF-046: Form Builder - Custom Field Definitions Palette & Inclusion in Form Template**

- **Preconditions:** User is authenticated and navigates to `FormBuilderPage` (`/form-builder/new` or `/form-builder/:id`). Master library has registered `FieldDefinition` records (e.g. `belt_rank`, `weight`, `date_of_birth`).
- **User/System actions:**
  - Page loads; `FormDefinitionStore.loadFieldDefinitions()` fetches registered custom field definitions.
  - Form Builder palette renders a dedicated "Custom Field Library" section containing chips/buttons for each custom field definition with label, type, and field name.
  - User clicks a custom field chip (e.g. `Belt Rank`).
- **Expected results:**
  - A new `FormField` is appended to the canvas.
  - The new field retains the origin `fieldDefinitionId`, `fieldName` (`belt_rank`), `fieldLabel` (`Belt Rank`), `fieldType` (`select`), and options parsed from `defaultOptions`.
  - The canvas field card displays a "Library Field" badge indicating it is linked to the master field library.
  - When the template is saved (`POST /templates` or `PUT /templates/:id`), each field in the payload preserves its `fieldDefinitionId`.
- **Final state:** Custom field definition from the library is embedded directly into the template canvas and saved with its master definition association.

**HF-047: User Accounts - Jurisdiction Column, Sort Dropdown, Export to CSV, and Manual Refresh**

- **Preconditions:** User is authenticated and on `/users`. User directory table contains loaded users.
- **User/System actions:**
  - View directory table: inspect column headers and rows.
  - Select sort option from the new sort dropdown (e.g. `Sort: Name (A-Z)` or `Sort: Role`).
  - Click the manual "Refresh" button.
  - Click the "Export CSV" button.
- **Expected results:**
  - Table renders a distinct "Jurisdiction" column displaying geographic assignment tags (e.g., Country, State, District or "Global Scope").
  - The sort dropdown reactively reorders the displayed users according to the chosen criterion.
  - Clicking "Refresh" triggers `usersStore.loadUsers()` and updates the table without a page reload.
  - Clicking "Export CSV" converts the currently filtered/sorted user roster into a CSV blob and initiates browser file download (`users_export_YYYY-MM-DD.csv`).
- **Final state:** User directory table provides full geographic visibility, sorting, instant refresh, and data export.

**HF-048: Role Management - System ID, Hierarchy Level, Delegation Indicator, and Parent-Subset Child Role Creation**

- **Preconditions:** User is authenticated and on `/roles`.
- **User/System actions:**
  - Inspect role cards.
  - Locate a role with delegation authority (`canCreateRoles: true`) and click "+ Create Child Role".
  - Inspect the permissions matrix in the child role creation modal.
  - Fill in child role name and save.
- **Expected results:**
  - Role cards prominently display their System ID badge (e.g. `ROLE #1`), numeric Hierarchy Level badge (e.g. `Level 0 (Global)`, `Level 1 (Country)`, `Level 2 (State)`), and explicit delegation indicator (`Can Delegate: YES` / `Can Delegate: NO`).
  - Clicking "+ Create Child Role" opens the role creation modal pre-configured with the parent role's scope and ID.
  - The permissions matrix strictly restricts available checkboxes to ONLY the parent role's granted permissions, disabling permissions that exceed the parent's authority.
  - Successfully creates the child role respecting the hierarchical parent-subset invariant.
- **Final state:** Hierarchical role delegation and permissions boundaries are visually explicit and strictly enforced.

**HF-049: Form Templates - Preset Immutability Safeguards & Direct "VIEW FORM" Preview on Template Cards**

- **Preconditions:** User is authenticated and on `/form-definitions` (Templates tab). Directory contains both canonical PRESET templates and CUSTOM templates.
- **User/System actions:**
  - Inspect PRESET template cards vs CUSTOM template cards.
  - Attempt to edit/delete a PRESET template.
  - Click "VIEW FORM" on any template card.
- **Expected results:**
  - PRESET template cards have delete actions disabled or hidden, and the edit button is replaced with "Clone as Custom Template" or locked view, safeguarding canonical sport standards from accidental mutation.
  - Each template card features a direct "VIEW FORM" preview button.
  - Clicking "VIEW FORM" immediately opens a read-only modal powered by `DynamicFormRendererComponent` displaying the actual athlete registration fields without routing to the builder canvas.
- **Final state:** Official presets are protected from deletion/mutation, and admins can quickly inspect form layouts directly from the directory.

**HF-050: Form Templates - Base Preset Inheritance Creation Workflow & Read-Only Inherited Fields in Form Builder**

- **Preconditions:** User is on `/form-definitions`.
- **User/System actions:**
  - Click "+ Add Template".
  - Choose between "Start from Scratch" or "Extend Base Preset Template" (e.g. Sambo or MMA Preset).
  - When extending a preset, proceed to Form Builder.
  - Inspect the inherited fields on the canvas and add a custom field.
- **Expected results:**
  - A setup modal provides the inheritance choice before routing to the builder.
  - If a base preset is selected, its canonical fields are imported onto the canvas with an `isInherited: true` flag.
  - Inherited fields cannot be deleted or have their core identity modified, but custom fields can be added alongside them.
  - Saving creates a new CUSTOM template extending the official preset foundation.
- **Final state:** Clean inheritance model preserving base sport rules while allowing tournament-specific extensions.

---

### Negative Flows

**NF-001: Invalid Credentials at Login**

- **Preconditions:** User is on `/login`.
- **User/System actions:** User enters invalid email or incorrect password and submits.
- **Expected results:**
  - `POST /auth/login` returns `401 Unauthorized`.
  - Error alert is displayed in the UI ("Invalid email or password").
  - Form remains editable; password field retains focus or user can retry.
- **Final state:** User remains on `/login`, not authenticated.

**NF-002: Token Refresh Failure (Expired Refresh Token)**

- **Preconditions:** Access token expires, and refresh token is also invalid/expired.
- **User/System actions:** Protected API call receives 401; interceptor calls `POST /auth/refresh` which also returns `401/403`.
- **Expected results:**
  - Interceptor catches refresh error.
  - Session is terminated: `authStore.logout()` is called, tokens are purged from `localStorage`.
  - User is redirected to `/login` with `returnUrl` query parameter.
- **Final state:** User is on `/login`, unauthenticated.

**NF-003: Network Error during Login**

- **Preconditions:** Backend server is offline or unreachable.
- **User/System actions:** User submits login form.
- **Expected results:**
  - API call fails with status 0 or 500+.
  - User-friendly error message is displayed ("Unable to connect to server. Please try again.").
  - Submit button re-enables.
- **Final state:** User remains on `/login`.

**NF-004: Create User with Duplicate Email**

- **Preconditions:** A user with email `test@test.com` already exists.
- **User/System actions:** Admin attempts to create another user with email `test@test.com`.
- **Expected results:** Backend returns `409 Conflict` ("Email already in use"); form displays error alert; modal remains open.
- **Final state:** User not created.

**NF-005: Delete System Role Prevented**

- **Preconditions:** System role (e.g. `SUPERADMIN`).
- **User/System actions:** Admin views system role.
- **Expected results:** Delete button is disabled or hidden for system roles.
- **Final state:** System role protected.

---

### Edge Cases

**EC-001: Public Endpoints Bypass Bearer Attachment & 401 Loop**

- **Preconditions:** Requests are directed to `/auth/login` or `/auth/refresh`.
- **User/System actions:** Outgoing request made to `/auth/login`.
- **Expected results:**
  - `authInterceptor` does NOT attach the access token to `/auth/login`.
  - If `/auth/login` returns 401 (invalid credentials), `authInterceptor` does NOT trigger a token refresh loop.
- **Final state:** Error is propagated directly to the caller.

**EC-002: Page Reload with Existing Session in LocalStorage**

- **Preconditions:** Valid tokens and user profile exist in `localStorage`.
- **User/System actions:** User refreshes browser window (`F5`).
- **Expected results:**
  - `AuthStore` initializes and loads tokens/user profile from `localStorage`.
  - User remains authenticated without redirecting to `/login`.
- **Final state:** `authStore.isAuthenticated()` is `true`.

**EC-003: Duplicate Key Suffixing for Library Fields Added to Canvas**

- **Preconditions:** A field with `fieldName: 'belt_rank'` is already present on the canvas.
- **User/System actions:** User clicks the `Belt Rank` custom field definition chip in the palette again.
- **Expected results:**
- `FormBuilderStore` detects the existing key collision and assigns an automatically de-duplicated unique key (e.g. `belt_rank_2`).
- The `fieldDefinitionId` is maintained so it remains associated with the master definition.
- **Final state:** Both fields coexist safely on the canvas without collision in form controls or json schema.

---

### Validation Rules

**VR-001: Email Validation (Login)**

- **Preconditions:** User on `/login`.
- **User/System actions:** User leaves email empty or enters an invalid email format (e.g. `invalid-email`).
- **Expected results:** Field indicates error; submit button disabled or prevented.
- **Final state:** Form invalid.

**VR-002: Password Validation (Login)**

- **Preconditions:** User on `/login`.
- **User/System actions:** User leaves password empty.
- **Expected results:** Field indicates error; submit button disabled or prevented.
- **Final state:** Form invalid.

**VR-003: User Creation Validation**

- **Preconditions:** Admin on "Add User" form.
- **User/System actions:** Submits with empty required fields (firstName, lastName, email, password, roleId).
- **Expected results:** Field-level validation messages appear; submission blocked.
- **Final state:** Form invalid.

**VR-004: User Password Minimum Length**

- **Preconditions:** Admin on "Add User" form.
- **User/System actions:** Enters password shorter than required (e.g. 3 chars).
- **Expected results:** Validation error displayed; submission blocked.
- **Final state:** Form invalid.

**VR-005: Role Creation Validation**

- **Preconditions:** Admin on "Create Role" form.
- **User/System actions:** Submits without role name or without any selected permissions.
- **Expected results:** Field-level validation flags empty name; submission blocked.
- **Final state:** Form invalid.

---

### Loading & State Transitions

**ST-001: Login Submission Loading State**

- **Preconditions:** User submits valid login form.
- **User/System actions:** Request is in flight.
- **Expected results:** Submit button shows loading spinner / "Signing in...".
- **Final state:** Loading state resolves to success or error.

**ST-002: Users Table Loading Skeleton**

- **Preconditions:** User navigates to `/users`.
- **User/System actions:** API request is in flight.
- **Expected results:** Table renders loading state / spinner.
- **Final state:** Table populated with data.

**ST-003: Roles Grid Loading Skeleton**

- **Preconditions:** User navigates to `/roles`.
- **User/System actions:** API request is in flight.
- **Expected results:** Roles grid renders loading state / spinner.
- **Final state:** Roles grid populated with data.

---

### Authentication & Authorization

**AUTH-001: Unauthenticated Navigation to Protected Route**

- **Preconditions:** User is not authenticated.
- **User/System actions:** User attempts to navigate directly to `/users` or `/roles`.
- **Expected results:** `authGuard` intercepts navigation; redirects to `/login?returnUrl=%2Fusers`.
- **Final state:** User lands on `/login`.

**AUTH-002: Authenticated Navigation to Login Page**

- **Preconditions:** User is already authenticated.
- **User/System actions:** User navigates to `/login`.
- **Expected results:** `guestGuard` intercepts navigation; redirects to `/`.
- **Final state:** User remains on `/`.

**AUTH-003: Sidemenu Hidden for Unauthenticated Users**

- **Preconditions:** User is not authenticated (or on `/login`).
- **User/System actions:** Renders base layout.
- **Expected results:** Sidemenu is NOT rendered; only public header/footer shown.
- **Final state:** Sidemenu hidden.

---

### Regression Requirements

**RR-001: Public Layout and Existing Home Page Unbroken**

- **Preconditions:** Home page and Base layout exist.
- **User/System actions:** Navigate to `/`.
- **Expected results:** Home page renders correctly with Base layout and dashboard overview modules.
- **Final state:** All pre-existing functionality passes tests.

**RR-002: Route Full-Path Match & NG04002 Prevention**

- **Preconditions:** Application defines root (`/`), `/login`, `/users`, and `/roles`.
- **User/System actions:** Navigate to `/login`, `/users`, `/roles`, or deep refresh without route prefix conflicts.
- **Expected results:** Root route specifies `pathMatch: 'full'` to prevent empty-prefix premature match and subsequent `NG04002: Cannot match any routes` errors. Wildcard `path: '**'` safely redirects unmatched routes to root.
- **Final state:** Route transitions complete cleanly without runtime errors.

**RR-003: Unified Reddish Accent Styling Across Application**

- **Preconditions:** Application is loaded in the browser.
- **User/System actions:** User navigates across `/`, `/login`, `/users`, `/roles`, `/rule-management`, `/form-definitions`, and `/form-builder`.
- **Expected results:**
  - Centralized design tokens `--accent-primary`, `--accent-primary-hover`, `--accent-gradient`, `--accent-primary-glow`, and `--accent-primary-light` are defined in `:root` inside `src/styles.scss`.
  - All primary buttons (`.btn-primary`), active tabs (`.nav-tab-btn.active`, `.status-tab.active`), input focus highlights, checkboxes/radios (`accent-color`), brand badges, user avatars, and hero highlights consistently use the reddish accent tokens.
  - No orphaned blues or conflicting accent schemes remain in primary interactive controls.
- **Final state:** Harmonious, accessible (WCAG AA compliant) reddish accent theme across the entire application.

---

## Feature / Change: Event Management (Events Board & Directory), Athlete Roster Lister & Public Registration Form

**Priority:** High
**Desired Behavior:**
The application provides:

1. **Events Board & Directory (`/events`)**:
   - Central tournament hub displaying KPI counters (Total, Active, Draft, Archived).
   - Global search, sport filter, tournament level filter, and status filter tabs (All, Active, Draft, Archived).
   - "+ Create Event" modal to configure event details, location, dates, and bind a form template with registration open/close dates.
   - Lifecycle actions: Publish Draft event to open registrations; Archive event; Copy shareable public registration link to clipboard.
   - Direct link to manage event roster (`/events/:eventId/roster`).
2. **Athlete Roster Management (`/events/:eventId/roster`)**:
   - Event summary header with tournament metadata, status, and public link copy action.
   - KPI counters: Total Registered, Approved, Pending Approval, Rejected, Duplicates & Flagged.
   - Filter tabs: All, Pending Approval, Approved, Rejected, Duplicates & Flagged.
   - Athlete directory table with participant contact, category, registration date, and status.
   - Row-level actions: Approve, Reject, View Submission Details modal.
   - Bulk actions: Multi-select athletes for Batch Approve and Batch Reject.
   - Admin "+ Register Fighter" modal rendering dynamic form schema.
   - Duplicates review and resolution (Merge & Approve / False Positive).
   - Export Roster to Excel/CSV.
3. **Public Registration Form (`/events/:eventId/register`)**:
   - Unauthenticated public registration portal with branded hero banner.
   - Live registration window check (displays closed notice if event is Draft or outside dates).
   - Dynamic form rendering core participant fields + custom template fields + compliance rules.
   - Submission to backend `POST /events/:eventId/registrations`.
   - Clear confirmation view with Registration ID.

---

### Happy Flows

**HF-EV-001: Events Listing and Status Filtering**

- **Preconditions:** Admin is authenticated and navigates to `/events`.
- **User/System actions:**
  - Page loads event directory and KPI summary cards.
  - User switches tabs between "All", "Active", "Draft", and "Archived".
  - User enters a search query in the search box.
- **Expected results:**
  - KPI counts reflect backend data.
  - Switching tabs filters list by corresponding `EventStatus` codes.
  - Search filters events by title, ID, or venue.
- **Final state:** Filtered events render with accurate status badges.

**HF-EV-002: Create Event with Template Binding**

- **Preconditions:** User is on `/events` and clicks "+ Create Event".
- **User/System actions:**
  - User fills in Event Name, Sport Type, Tournament Type, Start/End dates, Location.
  - User selects a Form Template from the dropdown, sets registration open & close dates, form title and description.
  - User clicks "Create Tournament".
- **Expected results:**
  - `POST /events` is invoked with valid `CreateEventDto`.
  - On success, modal closes, events list refreshes, and newly created event appears in "Draft" state.
- **Final state:** Event persisted with linked registration form.

**HF-EV-003: Publish Draft Event to Open Registrations**

- **Preconditions:** An event exists in "Draft" status (`status === 1`).
- **User/System actions:** User clicks "Publish / Activate" on the event card.
- **Expected results:**
  - `PUT /events/:eventId` is invoked with `{ status: 3 }` (Registration Open).
  - Event status badge updates to "Registration Open".
  - Event now appears in "Active" tab.
- **Final state:** Event status is updated in backend and store.

**HF-EV-004: Copy Public Registration Link**

- **Preconditions:** An event exists with ID `123`.
- **User/System actions:** User clicks "Copy Registration Link" on event card or roster banner.
- **Expected results:**
  - System writes `<origin>/events/123/register` to clipboard.
  - Toast notification confirms "Public registration link copied to clipboard!".
- **Final state:** Link in clipboard ready for distribution.

**HF-REG-001: Roster Directory & Status Segregation**

- **Preconditions:** Admin navigates to `/events/:eventId/roster`.
- **User/System actions:** Page loads registrations and KPI metrics; user clicks through tabs ("Pending", "Approved", "Rejected").
- **Expected results:**
  - Table displays participant full name, contact, age/category, submission date, status badge.
  - Each tab filters rows to only athletes with matching status.
- **Final state:** Segregated roster views displayed.

**HF-REG-002: Individual Athlete Approval & Rejection**

- **Preconditions:** Athlete registration exists with status "Pending".
- **User/System actions:** User clicks "Approve" (or "Reject") row action button.
- **Expected results:**
  - `PUT /events/:eventId/registrations/:registrationId/status` called with `{ status: 2 }` (Approved) or `{ status: 3 }` (Rejected).
  - Athlete row updates immediately without full page reload.
  - KPI counts update reactively.
- **Final state:** Athlete status persisted as Approved/Rejected.

**HF-REG-003: Batch Approval and Batch Rejection**

- **Preconditions:** Multiple athletes in "Pending" status.
- **User/System actions:** User checks checkboxes for 3 athletes, clicks "Batch Approve" in floating actions bar.
- **Expected results:**
  - `PUT /events/:eventId/registrations/status/batch` called with `{ registrationIds: [...], status: 2 }`.
  - All selected athletes update to Approved; checkboxes clear.
- **Final state:** Batch statuses updated and reflected in UI.

**HF-REG-004: Admin Manual Fighter Registration**

- **Preconditions:** Admin clicks "+ Register Fighter" in roster view.
- **User/System actions:**
  - Modal opens rendering the event's dynamic form schema.
  - Admin enters athlete data and submits.
- **Expected results:**
  - Form validates and sends `POST /events/:eventId/registrations`.
  - Modal closes, roster refreshes, newly registered fighter appears in Pending list.
- **Final state:** Athlete registered via admin flow.

**HF-REG-005: Export Roster to Excel**

- **Preconditions:** User is on `/events/:eventId/roster` and clicks "Export Roster".
- **User/System actions:** Browser requests `GET /events/:eventId/registrations/export`.
- **Expected results:**
  - Backend streams `.xlsx` binary workbook.
  - Browser downloads `<event_name>_registrations.xlsx`.
- **Final state:** File saved locally.

**HF-REG-006: Duplicate Detection & Resolution**

- **Preconditions:** Two or more participants have matching name/DOB/contact.
- **User/System actions:**
  - User navigates to "Duplicates & Flagged" tab.
  - System displays grouped duplicate cluster.
  - Admin selects which participant to keep and clicks "Merge & Approve".
- **Expected results:**
  - `POST /events/:eventId/duplicates/resolve` called with `{ action: 'MERGE', participantIds: [...], keepParticipantId: ... }`.
  - Kept participant approved; duplicates rejected; group cleared from duplicate view.
- **Final state:** Duplicates resolved cleanly.

**HF-PUB-001: Public Athlete Self-Registration**

- **Preconditions:** Public unauthenticated user visits `/events/:eventId/register`.
- **User/System actions:**
  - User views tournament details and instructions.
  - User fills out Full Name, Email, Phone, DOB, plus required dynamic category/weight/club fields.
  - User clicks "Submit Registration".
- **Expected results:**
  - Form evaluates client-side validations and rule compliance.
  - `POST /events/:eventId/registrations` is submitted.
  - Page transitions to confirmation view displaying "Registration Successful!" and assigned Registration ID.
- **Final state:** Participant registered in database in Pending status.

**HF-REG-007: Dynamic Form Definition Columns in Roster Table**

- **Preconditions:** Event has a linked form definition containing custom fields (e.g. weight category, gender, state, district, academy). Roster contains registered athletes with submitted responses.
- **User/System actions:** Admin navigates to `/events/:eventId/roster`.
- **Expected results:**
  - Roster table dynamically renders a header column (`<th>`) for each custom/dynamic field defined in the event's form definition.
  - Table rows dynamically render cells (`<td>`) displaying the athlete's corresponding response value (using `displayValue` for master data/options, or `—` if not provided).
  - Table supports horizontal scrolling for wide schemas, preserving sticky athlete name and action columns.
- **Final state:** All form definition fields and submitted responses are visible across the roster table.

**HF-REG-008: Read-Only Dynamic Form Renderer in Athlete Details Popup**

- **Preconditions:** Admin clicks the "View Details" (eye icon) action button on an athlete row.
- **User/System actions:** Details popup opens.
- **Expected results:**
  - Modal embeds `<app-dynamic-form-renderer>` with `[schema]="dynamicFormDefinition()"`, `[initialData]="athleteAnswers"`, `[disabled]="true"`, and `[showSubmitButton]="false"`.
  - Displays the complete form definition for the event with all fields populated with the athlete's submitted answers in disabled/read-only mode.
  - Status action buttons (Approve / Reject) remain available in the modal footer.
- **Final state:** All form definition data is rendered inside the details popup in read-only form mode.

**HF-TH-001: Global Dark Mode Rendering for All Pages, Modals, Tables & Portals**

- **Preconditions:** Application is loaded on any route (`/login`, `/`, `/users`, `/roles`, `/rules`, `/form-definitions`, `/form-builder`, `/events`, `/events/:eventId/roster`, `/events/:eventId/register`).
- **User/System actions:** User views and navigates through events management, event roster, athlete details modal, create event modal, and the public registration portal.
- **Expected results:**
  - All pages, containers, cards, tables, heroes, dialogs, inputs, and popups render consistently in dark mode using dark surfaces (`#0b0f19`, `#111827`, `#0f172a`, `#1e293b`) with crisp light typography (`#ffffff`, `#f8fafc`, `#94a3b8`) and dark borders (`#1f2937`, `#334155`).
  - No white or harsh light background surfaces are rendered on any page, card, or modal dialog.
  - Modals (including Create Event modal and Athlete Details modal with embedded form renderer) render on dark cards with dark inputs.
  - Public registration portal (`/events/:eventId/register`) renders in dark mode with dark container, dark header, dark tournament hero, dark dynamic form inputs, and dark confirmation card.
  - Reddish accent tokens (`var(--accent-primary)`, `#e11d48`) are preserved throughout.
- **Final state:** 100% of application pages and components display in unified dark mode.

**HF-DOB-001: Date of Birth Persistence & Visibility in Registered Users List and Athlete Details Modal**

- **Preconditions:** Athlete registers for an event via public self-registration or manual registration with a Date of Birth (DOB).
- **User/System actions:**
  - Registration is submitted with `dob`.
  - Admin navigates to `/events/:eventId/roster`.
  - Admin views the Roster Table and opens the Athlete Details modal for the registered athlete.
- **Expected results:**
  - Backend API `GET /events/:eventId/registrations` returns `dob` on the registration item.
  - Roster Table renders the athlete's Date of Birth in the "Date of Birth" column formatted as `YYYY-MM-DD` (never blank or `'—'`).
  - Athlete Details modal displays `DOB` in the metadata summary bar and populates the Date of Birth input in the read-only dynamic form renderer with the submitted date.
  - Excel export (`.xlsx`) includes the athlete's Date of Birth column.
- **Final state:** Date of Birth is fully persistent and visible across the roster table, details popup, and export.

**HF-FB-002: Dynamic Form Creation & Full-Fidelity Rebuilding**

- **Preconditions:** Admin navigates to `/form-builder` or edits an existing template.
- **User/System actions:**
  - Admin initializes or customizes a form template with standard fields (Full Name, Email, Phone, Date of Birth) and custom fields.
  - Admin saves the template.
  - Admin reloads the template or links it to an event.
- **Expected results:**
  - Complete `FormField[]` definition (including `id`, `key`, `label`, `type`, `options`, `required`, `columnSpan`, `validationRules`) is persisted in `formSchema.fields` and synced to `template_field` rows.
  - When reloaded in the Form Builder or rendered by `DynamicFormRendererComponent`, all fields, options, and validations rebuild with 100% fidelity.
- **Final state:** Dynamic form templates create and rebuild completely without field metadata loss.

---

### Negative Flows & Edge Cases

**NF-EV-001: Create Event Validation Failure**

- **Preconditions:** User attempts to submit "+ Create Event" modal with missing event name or dates.
- **User/System actions:** User leaves Event Name blank and clicks submit.
- **Expected results:** Form prevents submission, highlights required fields with error messages.
- **Final state:** Modal remains open, no API call sent.

**NF-PUB-001: Public Registration on Closed or Draft Tournament**

- **Preconditions:** Event is in "Draft" status (`status === 1`) or registration close date has passed.
- **User/System actions:** Public user visits `/events/:eventId/register`.
- **Expected results:**
  - System checks event status and dates.
  - Displays informational banner: "Registration for this tournament is currently closed."
  - Form inputs are hidden or disabled.
- **Final state:** No registrations accepted.

**NF-PUB-002: Duplicate Registration on Public Form**

- **Preconditions:** Athlete has already submitted a registration for this event with same email/phone.
- **User/System actions:** User attempts to register again with same details.
- **Expected results:**
  - Backend returns `409 Conflict: This participant has already registered for this event`.
  - Frontend displays clear alert banner with the error message without crashing.
- **Final state:** User alerted, no duplicate registration created.

**HF-REG-009: Multi-Item Dynamic Form Creation, Event Attachment, Public Registration, & Roster Details Verification**

- **Preconditions:** Admin creates a form template containing diverse form elements (Text, Textarea, Number, Select, Radio, Checkbox, Boolean toggle, Date) and custom fields. Event/tournament is created or updated using this form template.
- **User/System actions:**
  1. Multiple users/athletes register through the public registration form (`/events/:eventId/register`) filling out all diverse form fields.
  2. Admin navigates to the event roster (`/events/:eventId/roster`).
  3. Admin checks table columns and values.
  4. Admin clicks the "View Details" action icon on registered athlete rows.
- **Expected results:**
  - All form items are rendered with appropriate inputs (dropdowns with options, radios with choices, checkboxes, number fields, date pickers, textareas).
  - Form submission succeeds and saves responses for all template fields in the backend database.
  - In Event Roster table, each custom field appears as a dynamic table header column (`<th>`), and the submitted values for each athlete appear under their respective columns (booleans as "Yes"/"No", numbers as values, text as text, dates as dates).
  - In Athlete Details modal, both the read-only dynamic form renderer and the submitted responses table display all field values with 100% fidelity (checkboxes checked/unchecked accurately, select options correctly matched, custom numbers and dates displayed accurately).
- **Final state:** All diverse form fields and entered values are completely persistent, visible, and verified across both public registration and admin roster surfaces.

**EC-REG-001: Boolean and Checkbox Serialization in Read-Only Details View**

- **Preconditions:** Form includes boolean toggles and checkboxes. Athlete submits with some checked and some unchecked.
- **User/System actions:** Admin opens Athlete Details modal.
- **Expected results:** Checked inputs appear checked (`true`), unchecked inputs remain unchecked (`false`). Unchecked inputs do not evaluate to true due to string truthiness.
- **Final state:** Boolean states faithfully represented.

**EC-REG-002: Distinct Date Handling Between Participant DOB and Custom Form Date Fields**

- **Preconditions:** Form contains both athlete Date of Birth and a custom date field (e.g., "Medical Clearance Date").
- **User/System actions:** Athlete submits different dates for DOB and custom date. Admin views roster table and details modal.
- **Expected results:** The custom date column displays the custom date value, not the athlete's date of birth.
- **Final state:** No cross-contamination between date fields.

**EC-REG-003: Custom Option Label Resolution in Roster Table and Details Modal**

- **Preconditions:** Form contains a select dropdown or radio choice with distinct values and labels (e.g., value "purple" -> label "Purple Belt", value "southpaw" -> label "Southpaw").
- **User/System actions:** Athlete registers choosing these options. Admin views roster table and opens athlete details modal.
- **Expected results:** The roster table, modal responses summary table, and Excel export resolve and display the human-readable labels ("Purple Belt", "Southpaw") instead of the raw option values ("purple", "southpaw").
- **Final state:** Human-readable option labels rendered consistently across all viewing surfaces.

**EC-REG-004: Non-DOB Fields Containing 'birth' in Label Render Submitted Values**

- **Preconditions:** Form contains custom text or select fields containing the word "birth" in the label (e.g., "Place of Birth", "Birth City", "Birth Certificate Number").
- **User/System actions:** Athlete enters text (e.g. "Bengaluru") in the "Place of Birth" field. Admin views roster table.
- **Expected results:** The table renders the submitted text ("Bengaluru") under the "Place of Birth" column, rather than mistakenly intercepting the label and displaying the athlete's date of birth (`reg.dob`).
- **Final state:** Custom birth-related text fields display submitted text accurately.

**EC-REG-005: Form Schema Field Key Alignment with Template Field Slugs**

- **Preconditions:** Admin creates a custom template with multiple palette items.
- **User/System actions:** Form template is saved. Form schema is inspected and used in public registration.
- **Expected results:** `formSchema.fields[].key` matches the slugified `customFieldName` of each template field, ensuring 1:1 control mapping between reactive form inputs and response submission.
- **Final state:** Form schema keys and template field names are fully synchronized.

**HF-EV-005: Unarchive Archived Tournament**

- **Preconditions:** Tournament is in `COMPLETED` or `CANCELLED` status (listed in the "Archived" tab).
- **User/System actions:** User clicks the "Unarchive" action button on the event card.
- **Expected results:**
  - `PUT /events/:eventId` is invoked with `{ status: 3 }` (`REGISTRATION_OPEN`).
  - Event status updates to "Registration Open".
  - Event is removed from the "Archived" tab and appears in the "Active" tab.
  - Toast notification confirms "Tournament unarchived and registrations reopened!".
- **Final state:** Tournament unarchived and reactively updated in the store.

**HF-EV-006: Edit Tournament Details and Form Association**

- **Preconditions:** Tournament exists on `/events`.
- **User/System actions:**
  - User clicks the "Edit" action button (pencil icon) on the tournament card.
  - Modal opens pre-populated with current event data (name, sport, level, start/end dates, location, poster image URL, status, form template, registration open/close dates, form title, form description).
  - User modifies tournament properties and submits the form.
- **Expected results:**
  - `PUT /events/:eventId` updates the event specifications.
  - `PUT /events/:eventId/registration-form` updates the linked registration form and template.
  - Modal closes, store reloads events, and the tournament card renders the updated details immediately.
  - Toast notification confirms "Tournament updated successfully!".
- **Final state:** Updated tournament details persisted and rendered with OnPush reactivity.

**HF-EV-007: Delete Tournament with Confirmation Dialog**

- **Preconditions:** Tournament exists on `/events`.
- **User/System actions:**
  - User clicks the "Delete" action button (trash icon) on the tournament card.
  - A confirmation dialog appears with tournament name and warning.
  - User confirms by clicking "Delete Tournament".
- **Expected results:**
  - `DELETE /events/:eventId` is invoked.
  - Event is removed from the active event store and disappears from the UI without a full page refresh.
  - Toast notification confirms "Tournament deleted successfully".
- **Final state:** Tournament soft-deleted and removed from active listings.

**HF-UI-001: Form Template Card Action Buttons Styling & Proportions**

- **Preconditions:** User is on `/form-definitions` under "Form Templates" tab.
- **User/System actions:** User inspects the action buttons in the footer of any template card ("View Form", "Open Form Builder", "Activate" / "Deactivate").
- **Expected results:**
  - "Open Form Builder" has `text-decoration: none` (no underline).
  - "Open Form Builder" applies `btn-sm` sizing matching adjacent buttons in height, padding, and font-size.
  - Text does not wrap across lines (`white-space: nowrap`).
  - Action buttons are aligned horizontally with consistent spacing.
- **Final state:** Form template card footer buttons are harmoniously styled.

**HF-UI-002: Role Management Child Role Button Without Duplicate Plus Icon**

- **Preconditions:** User is on `/roles` viewing a role with `canCreateRoles: true`.
- **User/System actions:** User inspects the child role button on the role card.
- **Expected results:**
  - Button contains an SVG plus icon followed by text "Child Role" without a duplicate literal `+`.
  - Visual output reads cleanly as `+ Child Role`.
  - `white-space: nowrap` prevents text wrapping in narrow card viewports.
- **Final state:** Role delegation button renders cleanly without duplicate markers.

**HF-PUB-001: Public Form for Archived/Completed Tournament Shows "Registration Closed"**

- **Preconditions:** Tournament exists and has status `COMPLETED`, `CANCELLED`, or `REGISTRATION_CLOSED`, or current date has exceeded `registrationCloseDate`.
- **User/System actions:** User navigates to the public registration form URL `/events/:eventId/register`.
- **Expected results:**
  - Hero badge displays "Registration Closed" (or "Registrations Closed").
  - Closed card displays heading `Registration Closed`.
  - Description clarifies that tournament registrations have concluded or are closed.
  - Athlete entry form is hidden; registration submission is blocked.
- **Final state:** Archived status clearly communicated as Registration Closed.

**HF-PUB-002: Public Form for Unopened Tournament Shows "Tournament Not Opened"**

- **Preconditions:** Tournament exists and has status `DRAFT`, or current date is before `registrationOpenDate`.
- **User/System actions:** User navigates to the public registration form URL `/events/:eventId/register`.
- **Expected results:**
  - Hero badge displays "Tournament Not Opened".
  - Dedicated unopened card displays heading `Tournament Not Opened`.
  - Description clarifies that tournament registrations have not yet opened (with opening date displayed if available).
  - Athlete entry form is hidden; registration submission is blocked.
- **Final state:** Unopened tournament state clearly distinguished from closed state.

**HF-PUB-003: Public Form for Open Tournament Shows "Registrations Open" and Form**

- **Preconditions:** Tournament has status `REGISTRATION_OPEN` (or `PUBLISHED`), and current date is within the open registration window.
- **User/System actions:** User navigates to the public registration form URL `/events/:eventId/register`.
- **Expected results:**
  - Hero badge displays "Registrations Open".
  - Athlete entry form is rendered with all dynamic inputs and submission controls.
- **Final state:** Athletes can enter and submit their registrations.

**NF-REG-004: Backend Rejects Registration Submissions for Closed or Unopened Tournaments**

- **Preconditions:** Event status is `COMPLETED`, `CANCELLED`, `REGISTRATION_CLOSED`, or `DRAFT`.
- **User/System actions:** Client issues `POST /events/:eventId/register`.
- **Expected results:**
  - For `COMPLETED`, `CANCELLED`, or `REGISTRATION_CLOSED`: returns HTTP 400 with "Registration for this tournament is closed".
  - For `DRAFT` or prior to `registrationOpenDate`: returns HTTP 400 with "Registration for this tournament has not opened yet".
- **Final state:** Submissions against closed or draft tournaments rejected with accurate descriptive errors.
