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
  return path === '/app/profile' || isPublicBrowseRoute(value) || catalog || (role === 'user' && reader) || (role === 'admin' && admin) || (role === 'librarian' && librarian)
    ? value : fallback;
}

export function isPublicBrowseRoute(value: string): boolean {
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return false;
  const path = value.split(/[?#]/, 1)[0];
  return /^\/(?:app\/(?:discover|catalog(?:\/[a-zA-Z0-9_-]+)?)|privacy|legal)$/.test(path) || path === '/' || path === '/app';
}

export function safeAuthReturnUrl(value: string | null): string | null {
  if (!value || /[\\\u0000-\u001f\u007f]/.test(value)) return null;
  const path = value.split(/[?#]/, 1)[0];
  return isPublicBrowseRoute(value) || /^\/app\/(?:profile|my-library|favorites)$/.test(path) || /^\/admin\/(?:dashboard|users|books|loans|logs|security)$/.test(path) || /^\/librarian\/(?:dashboard|books|loans)$/.test(path) ? value : null;
}
