import { ADMIN_ROUTES } from './admin.routes';

describe('admin users route', () => {
  it('loads the independent user management page lazily instead of the placeholder', async () => {
    const users = ADMIN_ROUTES[0].children?.find(route => route.path === 'users');

    expect(users?.component).toBeUndefined();
    expect(users?.loadComponent).toBeDefined();
    const component = await users!.loadComponent!();
    const { UsersPageComponent } = await import('./users/pages/users-page.component');
    expect(component).toBe(UsersPageComponent);
  });
});
