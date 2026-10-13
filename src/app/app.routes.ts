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
    path: toSegment(APP_ROUTES.formDefinitions),
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/form-definitions/form-definitions').then((m) => m.FormDefinitionsPage),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
