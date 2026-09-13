import { UserRole } from '../auth/auth-session.model';

export interface NavigationItem {
  readonly label: string;
  readonly icon: string;
  readonly route: readonly string[];
  readonly exact?: boolean;
  readonly roles: readonly UserRole[];
}

export interface NavigationGroup {
  readonly label: string;
  readonly icon: string;
  readonly items: readonly NavigationItem[];
}
