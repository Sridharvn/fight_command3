export const APP_ROUTES = {
  root: '/',
  login: '/login',
  users: '/users',
  roles: '/roles',
  ruleManagement: '/rule-management',
  formTemplates: '/form-templates',
  formDefinitions: '/form-definitions',
  formBuilder: '/form-builder',
  events: '/events',
  eventRoster: '/events/:eventId/roster',
  publicRegistration: '/events/:eventId/register',
} as const;

export function toSegment(path: string): string {
  return path.startsWith('/') ? path.slice(1) : path;
}

export function withIdParam(path: string): string {
  return `${toSegment(path)}/:id`;
}

export function eventRosterRoute(eventId: number | string): string {
  return `/events/${eventId}/roster`;
}

export function publicRegistrationRoute(eventId: number | string): string {
  return `/events/${eventId}/register`;
}
