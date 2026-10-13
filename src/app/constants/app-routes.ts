export const APP_ROUTES = {
  root: '/',
  login: '/login',
  users: '/users',
  roles: '/roles',
  events: '/events',
} as const;

export function toSegment(path: string): string {
  return path.startsWith('/') ? path.slice(1) : path;
}

export function withIdParam(path: string): string {
  return `${toSegment(path)}/:id`;
}
