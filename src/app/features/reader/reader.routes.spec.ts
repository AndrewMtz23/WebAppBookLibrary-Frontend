import { READER_ROUTES } from './reader.routes';
import { AuthGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';

describe('READER_ROUTES', () => {
  it('keeps the complete reader journey lazy and available to authenticated roles', () => {
    const root = READER_ROUTES[0];
    expect(root.canActivate).toEqual([AuthGuard, RoleGuard]);
    expect(root.data?.['roles']).toEqual(['user', 'librarian', 'admin']);
    const expected = ['discover', 'catalog/:bookId', 'catalog', 'my-library', 'favorites', 'profile'];
    expect(root.children?.filter(route => expected.includes(route.path ?? '')).map(route => route.path)).toEqual(expected);
    root.children?.filter(route => expected.includes(route.path ?? '')).forEach(route => expect(route.loadComponent).toBeDefined());
  });

  it('reserves personal reader routes for user accounts', () => {
    const personal = READER_ROUTES[0].children?.filter(route => ['my-library', 'favorites', 'profile'].includes(route.path ?? '')) ?? [];

    expect(personal.length).toBe(3);
    personal.forEach(route => {
      expect(route.canActivate).toEqual([RoleGuard]);
      expect(route.data?.['roles']).toEqual(['user']);
    });
  });
});
