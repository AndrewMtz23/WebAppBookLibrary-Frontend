import { READER_ROUTES } from './reader.routes';
import { AuthGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';

describe('READER_ROUTES', () => {
  it('keeps the complete reader journey lazy and under user guards', () => {
    const root = READER_ROUTES[0];
    expect(root.canActivate).toEqual([AuthGuard, RoleGuard]);
    expect(root.data?.['roles']).toEqual(['user']);
    const expected = ['discover', 'catalog/:bookId', 'catalog', 'my-library', 'favorites', 'profile'];
    expect(root.children?.filter(route => expected.includes(route.path ?? '')).map(route => route.path)).toEqual(expected);
    root.children?.filter(route => expected.includes(route.path ?? '')).forEach(route => expect(route.loadComponent).toBeDefined());
  });
});
