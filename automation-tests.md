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

