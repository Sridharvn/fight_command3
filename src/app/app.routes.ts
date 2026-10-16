import { Routes } from '@angular/router';
import { APP_ROUTES, toSegment } from './constants/app-routes';
import { guestGuard } from './guards/guest.guard';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
  },
  {
    path: toSegment(APP_ROUTES.login),
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login').then((m) => m.LoginPage),
  },
  {
    path: toSegment(APP_ROUTES.users),
    canActivate: [authGuard],
    loadComponent: () => import('./pages/users/users').then((m) => m.UsersPage),
  },
  {
    path: toSegment(APP_ROUTES.roles),
    canActivate: [authGuard],
    loadComponent: () => import('./pages/roles/roles').then((m) => m.RolesPage),
  },
  {
    path: toSegment(APP_ROUTES.ruleManagement),
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/rule-management/rule-management').then((m) => m.RuleManagementPage),
  },
  {
    path: toSegment(APP_ROUTES.formTemplates),
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/form-templates/form-templates').then((m) => m.FormTemplatesPage),
  },
  {
    path: toSegment(APP_ROUTES.formDefinitions),
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/form-definitions/form-definitions').then((m) => m.FormDefinitionsPage),
  },
  {
    path: toSegment(APP_ROUTES.formBuilder),
    redirectTo: toSegment(APP_ROUTES.formTemplates),
    pathMatch: 'full',
  },
  {
    path: toSegment(APP_ROUTES.formBuilder) + '/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/form-builder/form-builder').then((m) => m.FormBuilderPage),
  },
  {
    path: toSegment(APP_ROUTES.events),
    canActivate: [authGuard],
    loadComponent: () => import('./pages/events/events').then((m) => m.EventsPage),
  },
  {
    path: 'events/:eventId/roster',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/event-roster/event-roster').then((m) => m.EventRosterPage),
  },
  {
    path: 'events/:eventId/register',
    loadComponent: () =>
      import('./pages/public-registration/public-registration').then(
        (m) => m.PublicRegistrationPage,
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
