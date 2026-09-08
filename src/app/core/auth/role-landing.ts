import { UserRole } from './auth-session.model';

const ROLE_LANDING_ROUTES: Readonly<Record<UserRole, string>> = {
  user: '/app/discover',
  librarian: '/librarian/dashboard',
  admin: '/admin/dashboard'
};

export const landingRouteForRole = (role: UserRole | null): string =>
  role ? ROLE_LANDING_ROUTES[role] : '/auth/login';
