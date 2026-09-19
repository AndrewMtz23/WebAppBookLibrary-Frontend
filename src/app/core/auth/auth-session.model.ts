export type UserRole = 'user' | 'librarian' | 'admin';

export interface AuthenticatedUser {
  readonly id: string;
  readonly username: string;
  readonly displayName?: string;
  readonly email: string;
  readonly avatarUrl?: string | null;
  readonly role: UserRole;
}

export interface AuthSession {
  readonly token: string;
  readonly user: AuthenticatedUser;
}

export const isUserRole = (value: unknown): value is UserRole =>
  value === 'user' || value === 'librarian' || value === 'admin';

export const isAuthSession = (value: unknown): value is AuthSession => {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Partial<AuthSession>;
  const user = candidate.user as Partial<AuthenticatedUser> | undefined;

  return typeof candidate.token === 'string' && candidate.token.length > 0 &&
    !!user &&
    typeof user.id === 'string' && user.id.length > 0 &&
    typeof user.username === 'string' && user.username.length > 0 &&
    typeof user.email === 'string' && user.email.length > 0 &&
    (user.avatarUrl === undefined || user.avatarUrl === null || typeof user.avatarUrl === 'string') &&
    (user.displayName === undefined || typeof user.displayName === 'string') &&
    isUserRole(user.role);
};
