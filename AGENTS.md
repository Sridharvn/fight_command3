# Project Shared Context & Guidelines

This document provides a comprehensive overview of the Martial Arts Events Manager project structure, technology stack, and core development guidelines to ensure all agent assistants maintain codebase alignment and quality standards.

---

## Project Overview
The **Martial Arts Events Manager** is a modern web application designed to manage martial arts events, registrations, and participant details. It provides event organizers with tools to coordinate tournaments, handle entries, track brackets, and manage participant check-ins.

---

## Tech Stack & Architecture
* **Frontend Framework:** Angular v21.2.0 (utilizing standalone components, signals, and native control flow)
* **Language:** TypeScript v5.9.2 (strict checking, type inference)
* **Styling:** SCSS / Vanilla CSS
* **State Management:** `@ngrx/signals` v21.1.0 (SignalStore) for reactive, lightweight state management
* **Testing:** Vitest v4.0.8 for fast, reliable unit and integration testing via `@angular/build:unit-test`
* **Formatting:** Prettier v3.8.1 for consistent code style configuration

---

## Directory Map
Here is a curated layout of the application's directory structure:

* **`src/`**: Main source code folder.
  * **`main.ts`**: Entry point for bootstrapping the Angular application.
  * **`styles.scss`**: Global stylesheets.
  * **`app/`**: Core application files.
    * **`app.config.ts`**: Application-wide configurations and dependency providers.
    * **`app.routes.ts`**: Route configurations mapping paths to lazy-loaded components.
    * **`app.ts` / `app.html` / `app.scss`**: Root component of the application.
    * **`layouts/`**: Layout containers defining viewport shell structures.
      * **`base-layout/`**: Core page layout containing the header, footer, and router outlet.
        * **`base-header/`**: Header standalone component containing navigation links.
        * **`base-footer/`**: Footer standalone component with copyright and branding.
    * **`pages/`**: Feature-level page components.
      * **`home/`**: Home/landing page of the events manager.
    * **`store/`**: Global state management definitions using `@ngrx/signals`.
      * **`counter.store.ts`**: Initial example store demonstrating SignalStore actions and selectors.

---

## Agent Personas & Core Rules
You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

### TypeScript Best Practices
- Use strict type checking.
- Prefer type inference when the type is obvious.
- Avoid the `any` type; use `unknown` when type is uncertain.

### Angular Best Practices
- Always use standalone components over NgModules.
- Must NOT set `standalone: true` inside Angular decorators. It is the default in Angular v20+.
- Use signals for state management.
- Implement lazy loading for feature routes.
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead.
- Use `NgOptimizedImage` for all static images (does not work for inline base64 images).

### Accessibility Requirements
- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

#### Components
- Keep components small and focused on a single responsibility.
- Use `input()` and `output()` functions instead of decorators.
- Use `computed()` for derived state.
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator.
- Prefer inline templates for small components.
- Prefer Reactive forms instead of Template-driven ones.
- Do NOT use `ngClass`, use `class` bindings instead (e.g., `[class.active]="isActive()"`).
- Do NOT use `ngStyle`, use `style` bindings instead (e.g., `[style.color]="color()"`).
- When using external templates/styles, use paths relative to the component TS file.

### State Management
- Use signals for local component state.
- Use `computed()` for derived state.
- Keep state transformations pure and predictable.
- Do NOT use `mutate` on signals, use `update` or `set` instead.

### Templates
- Keep templates simple and avoid complex logic.
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`.
- Use the async pipe to handle observables.
- Do not assume globals like (`new Date()`) are available in templates.

### Services
- Design services around a single responsibility.
- Use the `providedIn: 'root'` option for singleton services.
- Use the `inject()` function instead of constructor injection.


---

## Agent Personas & Core Rules
You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

### TypeScript Best Practices
- Use strict type checking.
- Prefer type inference when the type is obvious.
- Avoid the `any` type; use `unknown` when type is uncertain.

### Angular Best Practices
- Always use standalone components over NgModules.
- Must NOT set `standalone: true` inside Angular decorators. It is the default in Angular v20+.
- Use signals for state management.
- Implement lazy loading for feature routes.
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead.
- Use `NgOptimizedImage` for all static images (does not work for inline base64 images).

### Accessibility Requirements
- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

#### Components
- Keep components small and focused on a single responsibility.
- Use `input()` and `output()` functions instead of decorators.
- Use `computed()` for derived state.
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator.
- Prefer inline templates for small components.
- Prefer Reactive forms instead of Template-driven ones.
- Do NOT use `ngClass`, use `class` bindings instead (e.g., `[class.active]="isActive()"`).
- Do NOT use `ngStyle`, use `style` bindings instead (e.g., `[style.color]="color()"`).
- When using external templates/styles, use paths relative to the component TS file.

### State Management
- Use signals for local component state.
- Use `computed()` for derived state.
- Keep state transformations pure and predictable.
- Do NOT use `mutate` on signals, use `update` or `set` instead.

### Templates
- Keep templates simple and avoid complex logic.
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`.
- Use the async pipe to handle observables.
- Do not assume globals like (`new Date()`) are available in templates.

### Services
- Design services around a single responsibility.
- Use the `providedIn: 'root'` option for singleton services.
- Use the `inject()` function instead of constructor injection.

---

## Architecture Addendum: Mandatory Angular 21+ Implementation Standard

This section extends the existing project guidance. It can replace the current folder structure or rules above if not fully compliant, after checking feasibility. For all future work, agents MUST follow this architecture direction as the target standard and gradually align new features to it without introducing conflicting patterns.

### Canonical Technology Stack

| Concern             | Required Technology                                                      |
| ------------------- | ------------------------------------------------------------------------ |
| Framework           | Angular 21+ using standalone components only                             |
| UI Library          | Angular Material 3 where shared primitives are needed                    |
| State Management    | NgRx SignalStore using `@ngrx/signals` and `@ngrx/signals/entities`      |
| Async orchestration | RxJS with `rxMethod` for store-driven async flows                        |
| HTTP                | `HttpClient` configured with `withFetch()`                               |
| Export / Extraction | Angular feature layer for HTML, PDF, CSV, Excel, and print-ready exports |
| Charts              | Chart.js by default, D3.js only for specialized visualizations           |
| Testing             | Vitest with Angular TestBed                                              |
| Styling             | SCSS plus centralized design tokens via CSS custom properties            |

### Target Folder Architecture

The current repository may still contain legacy placements such as `core/`, `features/`, and `store/`. New work should move toward the structure below without breaking active code.

```text
src/app/
  app.config.ts          — root providers and platform configuration
  app.routes.ts          — top-level lazy route definitions only
  app.ts / app.html      — root shell mount
  models/                — pure interfaces and types only
  constants/             — route constants and static lookup tables
  services/              — ApiService, feature API services, utility services
  stores/                — global SignalStore slices
  interceptors/          — functional HTTP interceptors
  guards/                — functional route guards
  pages/                 — lazy-loaded routed pages only
  components/            — shared reusable standalone UI components
  layouts/               — shell layout components
  pipes/                 — pure custom pipes
  export-system/         — export domain feature for HTML/PDF/CSV/Excel/print
    models/              — export request/result contracts
    services/            — export builders, mappers, adapters
    stores/              — SignalStore state for export workflows
    components/          — reusable export widgets
    pages/               — routed export screens or admin surfaces
  assets/                — fonts, icons, static data
  styles/                — tokenized global styling partials
```

### Layer Responsibilities

#### 1. Models

- `models/` contains only `interface`, `type`, union, and enum-like constant definitions.
- No classes, no side effects, no service imports, and no store imports.
- Model categories must include API DTOs, SignalStore state shapes, UI option types, and filter contracts.

Rule: `models/` is the lowest layer and may be imported by any higher layer, but it must not import from any feature layer.

#### 2. Constants

Two baseline files should exist as the app evolves:

- `app-constants.ts` for lookup tables, statuses, column definitions, page-size options, export MIME maps, and polling intervals.
- `app-routes.ts` for all route strings.

Rule: route paths must never be hardcoded in pages, templates, stores, guards, or services.

Example pattern:

```ts
export const APP_ROUTES = {
  root: '/',
  login: '/login',
  superAdmin: '/super-admin',
  exports: '/exports',
  exportTemplates: '/exports/templates',
} as const;

export function toSegment(path: string): string {
  return path.startsWith('/') ? path.slice(1) : path;
}

export function withIdParam(path: string): string {
  return `${toSegment(path)}/:id`;
}
```

#### 3. Services

Services must be split into three layers.

##### 3a. ApiService

- `ApiService` is the only default entry point for JSON HTTP operations.
- Feature code should not inject `HttpClient` directly unless handling multipart uploads or another browser-level exception.
- It must expose typed `get`, `post`, `put`, `patch`, and `delete` helpers.
- It should support named base URLs through `ApiOptions`.

##### 3b. Feature API services

- One thin service per backend resource.
- Each method returns typed `Observable<T>` values.
- Filter mapping and query-param transformation belong here.
- Error toasts and user-facing messaging do not belong here.

##### 3c. Utility services

Expected utility service categories:

- `NotificationService` for snackbars or app-level status messages
- `BreadcrumbService` for shell breadcrumb signals
- `DateFormatService` for all ISO date formatting
- `ButtonLoadingService` for request-scoped button loading states
- `ExportFacadeService` for file naming, MIME resolution, download triggering, and print helpers

#### 4. Interceptors

Register functional interceptors through `provideHttpClient(withFetch(), withInterceptors([...]))`.

Required interceptor responsibilities:

- `authInterceptor`: attach bearer token to allowed base URLs
- `errorInterceptor`: surface normalized HTTP failures through a notification service
- `loadingInterceptor`: manage button-level loading state through `HttpContext`

Optional future interceptor:

- `exportAuditInterceptor`: annotate export requests with trace metadata when audit logging is added

#### 5. Stores

SignalStore is the mandatory shared-state pattern.

Store rules:

- Use `signalStore()` with `{ providedIn: 'root' }` for global slices.
- Use `withState()` for canonical state.
- Use `withComputed()` for derived values only.
- Use `withMethods()` for the public API.
- Use `patchState()` for all writes.
- Use `withEntities()` for entity collections and O(1) lookups.
- Use `rxMethod()` for all async flows that rely on RxJS.
- Use `debounceTime(300)` for search/filter driven requests.
- Never use direct mutation patterns.

Example anatomy:

```ts
export const FeatureStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    totalPages: computed(() => Math.ceil(store.total() / store.pageSize())),
  })),
  withMethods((store) => ({
    setFilters(filters: Partial<FeatureFilters>) {
      patchState(store, { filters, currentPage: 1 });
    },
  })),
);
```

#### 6. Guards

- All guards must be functional guards.
- `authGuard` redirects unauthenticated users to login with `returnUrl`.
- `guestGuard` redirects authenticated users away from public auth pages.
- Role guards must respect the project hierarchy exactly: Super Admin > Country Admin > State Admin > District Admin > User.
- Guard logic must support hard refreshes by waiting for the authenticated user profile when needed.

#### 7. Pages

- All routed pages must be lazy loaded using `loadComponent`.
- Pages coordinate stores and layout state; they should not contain raw business logic that belongs in stores or services.
- Every page must use `ChangeDetectionStrategy.OnPush`.
- Shared page variants may use route data to switch behavior instead of duplicating page classes.

#### 8. Components

All reusable UI must follow these rules:

- standalone component model only
- `ChangeDetectionStrategy.OnPush` required
- `input()`, `model()`, and `output()` over decorator-based inputs and outputs
- derived display values through `computed()`
- use `host` metadata instead of `@HostBinding` or `@HostListener`
- use native control flow: `@if`, `@for`, `@switch`
- no arrow functions in templates
- no `ngClass`; use `[class]` or `[class.foo]`
- no `ngStyle`; use `[style]` or `[style.foo]`
- accessibility must pass WCAG AA and AXE checks

#### 9. Layouts

- Layouts own shell composition such as header, breadcrumb, sidebar, content frame, footer, and top-level notification polling.
- Authenticated experiences should render inside a base layout.
- Layouts may read breadcrumb and navigation signals, but feature-specific logic should remain outside the shell.

#### 10. Pipes

- Pipes must be pure and stateless unless there is a documented exception.
- Any sanitizer-based HTML pipe must only receive already-sanitized trusted content.

#### 11. Theming

- Prefer Angular Material 3 tokens plus project design tokens.
- Raw colors, spacing values, shadows, and radii should not be hardcoded into new SCSS unless the token system is being expanded deliberately.
- Fonts, spacing, and semantic colors should be centralized under global style tokens.

### Export / Extraction System Architecture

The application must support a dedicated Angular export system for sending user-facing data to external formats such as HTML, PDF, CSV, Excel, and print layouts.

#### Export system intent

- Centralize all export behavior instead of scattering download logic across components.
- Support dummy UI first, then evolve into real export generation.
- Keep UI orchestration in Angular pages and components, state in SignalStore, and document generation in services.

#### Export domain structure

```text
src/app/export-system/
  models/
    export.types.ts           — formats, statuses, request/result contracts
    export-template.types.ts  — reusable template definitions
  services/
    export-builder.service.ts — transforms domain data into export payloads
    export-file.service.ts    — browser Blob/download/print handling
    export-html.service.ts    — HTML markup generation
    export-pdf.service.ts     — PDF adapter abstraction
    export-tabular.service.ts — CSV / Excel mapping abstraction
  stores/
    export.store.ts           — SignalStore for export queue, filters, preview, status
  components/
    export-format-card/
    export-preview-panel/
    export-history-table/
    export-trigger-button/
  pages/
    export-center/
    export-template-library/
```

#### Export data model expectations

At minimum, the export system should model:

- `ExportFormat = 'html' | 'pdf' | 'csv' | 'xlsx' | 'print'`
- `ExportScope = 'tournament' | 'participants' | 'users' | 'reports' | 'forms'`
- `ExportStatus = 'idle' | 'preparing' | 'ready' | 'failed'`
- `ExportRequest` with format, scope, filters, requestedBy, requestedAt
- `ExportResult` with fileName, mimeType, size, status, and preview metadata
- `ExportTemplate` for reusable branding/layout presets

#### Export UI rules

- The first implementation may be a dummy Angular UI, but it must still follow this architecture.
- Export pages should expose format cards, scope filters, preview panes, and export history panels.
- Preview state must be signal-driven.
- Buttons should show deterministic loading states.
- Accessibility must include keyboard support, clear labels, and status announcements for file generation.

#### Export store responsibilities

The export SignalStore should own:

- selected export format
- selected scope and filters
- preview content model
- active loading state
- recent export history
- error and success signals

Rule: components must not directly assemble file payloads. They should call store methods, and stores should delegate generation to services.

#### Export service responsibilities

- HTML export service builds branded markup documents.
- PDF export service abstracts the eventual PDF engine choice.
- Tabular export service maps domain entities into CSV/XLSX-safe row structures.
- File service performs download, Blob creation, print handoff, and file-name normalization.

#### Export page pattern

When the export center is implemented, the page should:

1. Load export templates and available scopes.
2. Bind user choices to SignalStore state.
3. Trigger preview generation from the store.
4. Trigger final export generation from the store.
5. Render success/error status from store signals only.

### Data Flow Standard

All future features, including the export system, should follow this flow:

```text
User Action
  -> Page or Reusable Component
  -> SignalStore method
  -> rxMethod or service call
  -> ApiService or specialized export service
  -> State update through patchState
  -> OnPush component rerender via signal reads
```

### Routing Standard

- All route definitions must stay in `app.routes.ts`.
- Use route constants from a central `APP_ROUTES` object.
- Every new page, including export pages, must be lazy loaded.
- Wildcard routes should redirect using route constants rather than string literals.

### Authentication and Role Constraints

The geographic hierarchy is mandatory in all future authorization logic:

1. Super Admin
2. Country Admin
3. State Admin
4. District Admin
5. User

No export action, report visibility rule, or admin page may bypass this hierarchy.

### Key Rules Summary

| Rule                                                | Why                                        |
| --------------------------------------------------- | ------------------------------------------ |
| Do not set `standalone: true`                       | Angular 20+ standalone is the default      |
| Do not inject `HttpClient` in normal feature code   | Use `ApiService` for consistency           |
| Do not mutate signal state directly                 | Use `patchState`, `.set()`, or `.update()` |
| Do not hardcode route strings                       | Use route constants                        |
| Do not use `ngClass` or `ngStyle`                   | Use class/style bindings                   |
| Do not use `@HostBinding` or `@HostListener`        | Use `host` metadata                        |
| Always use `ChangeDetectionStrategy.OnPush`         | Required across components and pages       |
| Always use lazy loading for pages                   | Keeps routing architecture consistent      |
| Always use SignalStore for new shared state         | Avoids mixed state-management patterns     |
| Always centralize export logic in the export system | Prevents duplicate file-generation code    |
| Always meet WCAG AA                                 | Required for production readiness          |

### Migration Direction For This Repository

Because the current repository already contains `core/`, `features/`, and `store/` structures, agents should follow these migration rules:

- Do not perform disruptive folder moves unless explicitly requested.
- New features should prefer the target architecture and avoid introducing more legacy-style patterns.
- If a feature must live in an existing folder temporarily, its internal design must still follow SignalStore, OnPush, lazy loading, route constants, and service separation.
- The export / extraction system must be treated as a first-class Angular feature area, not as ad hoc button logic inside unrelated components.
