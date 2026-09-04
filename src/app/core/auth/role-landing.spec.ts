import { landingRouteForRole } from './role-landing';

describe('role landing routes', () => {
  it('routes readers to discovery', () => {
    expect(landingRouteForRole('user')).toBe('/app/discover');
  });

  it('routes librarians to their dashboard', () => {
    expect(landingRouteForRole('librarian')).toBe('/librarian/dashboard');
  });

  it('routes administrators to their dashboard', () => {
    expect(landingRouteForRole('admin')).toBe('/admin/dashboard');
  });

  it('routes a missing role to login', () => {
    expect(landingRouteForRole(null)).toBe('/auth/login');
  });
});
