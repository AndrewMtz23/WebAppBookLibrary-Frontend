import { ParamMap } from '@angular/router';
import { UserRole } from '../../../../core/auth/auth-session.model';

export interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl?: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

export interface UpdateAdminUserRequest {
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  role: UserRole;
  isActive: boolean;
  expectedUpdatedAt: string;
}

export interface AdminUserQuery {
  query: string;
  role: string;
  isActive: string;
  createdFrom: string;
  createdTo: string;
  lastLoginFrom: string;
  lastLoginTo: string;
  sort: 'createdAt' | 'lastLoginAt' | 'username' | 'role';
  direction: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export const DEFAULT_ADMIN_USER_QUERY: AdminUserQuery = {
  query: '', role: '', isActive: '', createdFrom: '', createdTo: '', lastLoginFrom: '', lastLoginTo: '',
  sort: 'username', direction: 'asc', page: 1, pageSize: 20
};

export type UserMutation =
  | { type: 'role'; user: AdminUser; nextRole: UserRole }
  | { type: 'status'; user: AdminUser; nextActive: boolean }
  | { type: 'permanent'; user: AdminUser };

export function parseAdminUserQuery(params: ParamMap): AdminUserQuery {
  const result = { ...DEFAULT_ADMIN_USER_QUERY };
  result.query = (params.get('query') ?? '').trim().slice(0, 200);
  const role = params.get('role');
  if (role && ['user', 'librarian', 'admin'].includes(role)) result.role = role;
  const active = params.get('isActive');
  if (active === 'true' || active === 'false') result.isActive = active;
  for (const key of ['createdFrom', 'createdTo', 'lastLoginFrom', 'lastLoginTo'] as const) {
    const value = params.get(key);
    if (value && !Number.isNaN(Date.parse(value))) result[key] = new Date(value).toISOString();
  }
  const sort = params.get('sort');
  if (sort && ['createdAt', 'lastLoginAt', 'username', 'role'].includes(sort)) result.sort = sort as AdminUserQuery['sort'];
  if (params.get('direction') === 'desc') result.direction = 'desc';
  const page = Number(params.get('page'));
  if (Number.isSafeInteger(page) && page > 0) result.page = page;
  const pageSize = Number(params.get('pageSize'));
  if (Number.isInteger(pageSize) && pageSize > 0) result.pageSize = Math.min(pageSize, 100);
  return result;
}

export const ROLE_LABELS: Record<UserRole, string> = { user: 'Lector', librarian: 'Bibliotecario', admin: 'Administrador' };

export function roleConsequence(previous: UserRole, next: UserRole): string {
  const access: Record<UserRole, string> = {
    user: 'podrá usar el catálogo, favoritos y préstamos personales',
    librarian: 'podrá gestionar catálogo y circulación',
    admin: 'podrá administrar cuentas, catálogo, circulación, logs y seguridad'
  };
  return `${ROLE_LABELS[next]}: ${access[next]}. Se retirará el acceso propio del rol ${ROLE_LABELS[previous].toLowerCase()}.`;
}
