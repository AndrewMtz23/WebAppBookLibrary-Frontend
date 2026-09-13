import { UserRole } from '../auth/auth-session.model';
import { NavigationGroup, NavigationItem } from './navigation.model';

export const READER_NAVIGATION_ITEMS: readonly NavigationItem[] = [
  { label: 'Descubrir', icon: 'explore', route: ['/app/discover'], exact: true, roles: ['user'] },
  { label: 'Catálogo', icon: 'auto_stories', route: ['/app/catalog'], roles: ['user'] },
  { label: 'Mi biblioteca', icon: 'bookmarks', route: ['/app/my-library'], roles: ['user'] },
  { label: 'Favoritos', icon: 'favorite_border', route: ['/app/favorites'], roles: ['user'] },
  { label: 'Perfil', icon: 'person_outline', route: ['/app/profile'], roles: ['user'] },
];

const NAVIGATION_ITEMS: readonly NavigationItem[] = [
  ...READER_NAVIGATION_ITEMS,
  { label: 'Dashboard', icon: 'space_dashboard', route: ['/librarian/dashboard'], exact: true, roles: ['librarian'] },
  { label: 'Libros', icon: 'library_books', route: ['/librarian/books'], roles: ['librarian'] },
  { label: 'Préstamos', icon: 'assignment_return', route: ['/librarian/loans'], roles: ['librarian'] },
  { label: 'Dashboard', icon: 'space_dashboard', route: ['/admin/dashboard'], exact: true, roles: ['admin'] },
  { label: 'Usuarios', icon: 'group', route: ['/admin/users'], roles: ['admin'] },
  { label: 'Libros', icon: 'library_books', route: ['/admin/books'], roles: ['admin'] },
  { label: 'Préstamos', icon: 'assignment_return', route: ['/admin/loans'], roles: ['admin'] },
  { label: 'Logs', icon: 'receipt_long', route: ['/admin/logs'], roles: ['admin'] },
  { label: 'Seguridad', icon: 'shield', route: ['/admin/security'], roles: ['admin'] },
  { label: 'Sitio público', icon: 'public', route: ['/app/discover'], exact: true, roles: ['librarian', 'admin'] }
];

export const navigationForRole = (role: UserRole): readonly NavigationItem[] =>
  NAVIGATION_ITEMS.filter(item => item.roles.includes(role));

export const readerNavigationForRole = (role: UserRole): readonly NavigationItem[] =>
  role === 'user'
    ? [...READER_NAVIGATION_ITEMS]
    : READER_NAVIGATION_ITEMS.filter(item => item.label === 'Descubrir' || item.label === 'Catálogo');

const group = (label: string, icon: string, items: readonly NavigationItem[]): NavigationGroup =>
  ({ label, icon, items });

export const navigationGroupsForRole = (role: UserRole): readonly NavigationGroup[] => {
  const items = navigationForRole(role);
  const select = (...labels: readonly string[]) => items.filter(item => labels.includes(item.label));

  if (role === 'admin') {
    return [
      group('Gestión', 'dashboard_customize', select('Dashboard', 'Usuarios')),
      group('Biblioteca', 'local_library', select('Libros', 'Préstamos')),
      group('Control', 'admin_panel_settings', select('Logs', 'Seguridad', 'Sitio público'))
    ];
  }

  if (role === 'librarian') {
    return [
      group('Operación', 'space_dashboard', select('Dashboard', 'Préstamos')),
      group('Biblioteca', 'local_library', select('Libros', 'Sitio público'))
    ];
  }

  return [];
};
