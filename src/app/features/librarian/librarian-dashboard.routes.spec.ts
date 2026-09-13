import { ADMIN_ROUTES } from '../admin/admin.routes';
import { LIBRARIAN_ROUTES } from './librarian.routes';
import { navigationForRole } from '../../core/navigation/navigation.config';

describe('role dashboard routes', () => {
  it('uses separate lazy pages and lets an admin open the librarian dashboard without changing the admin sidebar', () => {
    expect(ADMIN_ROUTES[0].children?.find(route => route.path === 'dashboard')?.loadComponent).toBeDefined();
    expect(LIBRARIAN_ROUTES[0].children?.find(route => route.path === 'dashboard')?.loadComponent).toBeDefined();
    expect(LIBRARIAN_ROUTES[0].data?.['roles']).toEqual(['librarian', 'admin']);
    expect(navigationForRole('admin').map(item => item.route.join('/'))).toContain('/admin/dashboard');
    expect(navigationForRole('admin').map(item => item.route.join('/'))).not.toContain('/librarian/dashboard');
  });
});
