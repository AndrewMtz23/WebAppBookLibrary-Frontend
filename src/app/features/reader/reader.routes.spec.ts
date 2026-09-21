import { READER_ROUTES } from './reader.routes';
import { AuthGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';

describe('READER_ROUTES', () => {
  it('keeps the complete reader journey lazy and available to authenticated roles', () => {
    const root = READER_ROUTES[0];
    expect(root.canActivate).toBeUndefined();
    const expected = ['discover', 'catalog/:bookId', 'catalog', 'my-library', 'favorites', 'profile'];
    expect(root.children?.filter(route => expected.includes(route.path ?? '')).map(route => route.path)).toEqual(expected);
    root.children?.filter(route => expected.includes(route.path ?? '')).forEach(route => expect(route.loadComponent).toBeDefined());
  });

  it('shares profile with all authenticated roles', () => {
    const profile = READER_ROUTES[0].children?.find(route => route.path === 'profile');
    expect(profile?.canActivate).toEqual([AuthGuard, RoleGuard]);
    expect(profile?.data?.['roles']).toEqual(['user', 'librarian', 'admin']);
  });

  it('reserves personal reader routes for user accounts', () => {
    const personal = READER_ROUTES[0].children?.filter(route => ['my-library', 'favorites'].includes(route.path ?? '')) ?? [];

    expect(personal.length).toBe(2);
    personal.forEach(route => {
      expect(route.canActivate).toEqual([AuthGuard, RoleGuard]);
      expect(route.data?.['roles']).toEqual(['user']);
    });
  });
});
