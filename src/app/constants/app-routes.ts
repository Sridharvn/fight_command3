export const APP_ROUTES = {
  root: '/',
  login: '/login',
  users: '/users',
  roles: '/roles',
  ruleManagement: '/rule-management',
  formDefinitions: '/form-definitions',
  formBuilder: '/form-builder',
  events: '/events',
} as const;

export function toSegment(path: string): string {
  return path.startsWith('/') ? path.slice(1) : path;
}

export function withIdParam(path: string): string {
  return `${toSegment(path)}/:id`;
}
