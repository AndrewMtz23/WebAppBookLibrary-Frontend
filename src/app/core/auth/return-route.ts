import { UserRole } from './auth-session.model';
import { landingRouteForRole } from './role-landing';

export function returnRouteForRole(value: string | null, role: UserRole): string {
  const fallback = landingRouteForRole(role);
  if (!value || /[\\\u0000-\u001f\u007f]/.test(value)) return fallback;
  const path = value.split(/[?#]/, 1)[0];
  const catalog = /^\/app\/(discover|catalog(?:\/[a-zA-Z0-9_-]+)?)$/.test(path);
  const reader = /^\/app\/(my-library|favorites)$/.test(path);
  const admin = /^\/admin\/(dashboard|users|books|loans|logs|security)$/.test(path);
  const librarian = /^\/librarian\/(dashboard|books|loans)$/.test(path);
  return path === '/app/profile' || catalog || (role === 'user' && reader) || (role === 'admin' && admin) || (role === 'librarian' && librarian)
    ? value : fallback;
}
