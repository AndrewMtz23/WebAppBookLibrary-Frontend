import { ADMIN_ROUTES } from './admin.routes';

describe('admin users route', () => {
  it('loads the independent user management page lazily instead of the placeholder', async () => {
    const users = ADMIN_ROUTES[0].children?.find(route => route.path === 'users');

    expect(users?.component).toBeUndefined();
    expect(users?.loadComponent).toBeDefined();
    const component = await users!.loadComponent!() as unknown as { name: string };
    expect(component.name).toBe('UsersPageComponent');
  });
});
