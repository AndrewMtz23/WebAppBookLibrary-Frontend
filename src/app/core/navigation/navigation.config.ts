import { UserRole } from '../auth/auth-session.model';
import { NavigationItem } from './navigation.model';

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
  { label: 'Seguridad', icon: 'shield', route: ['/admin/security'], roles: ['admin'] }
];

export const navigationForRole = (role: UserRole): readonly NavigationItem[] =>
  NAVIGATION_ITEMS.filter(item => item.roles.includes(role));
