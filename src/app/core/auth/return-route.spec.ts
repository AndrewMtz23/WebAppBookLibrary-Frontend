import { returnRouteForRole } from './return-route';

describe('returnRouteForRole', () => {
  it('preserves authorized paths, filters and fragments', () => {
    expect(returnRouteForRole('/app/catalog?query=historia#results', 'user')).toBe('/app/catalog?query=historia#results');
    expect(returnRouteForRole('/admin/loans?status=overdue', 'admin')).toBe('/admin/loans?status=overdue');
    expect(returnRouteForRole('/librarian/books', 'librarian')).toBe('/librarian/books');
  });
  it('rejects external, malformed, authentication and unknown destinations', () => {
    for (const path of [null, '//evil.test', 'https://evil.test', '/\\evil.test', '/auth/login', '/app/catalog/../../admin/users', '/app/catalog/%2fadmin', '/app/discover\n', '/unknown']) {
      expect(returnRouteForRole(path, 'user')).toBe('/app/discover');
    }
  });
  it('requires the new session role to authorize the requested destination', () => {
    expect(returnRouteForRole('/admin/users', 'user')).toBe('/app/discover');
    expect(returnRouteForRole('/app/my-library', 'admin')).toBe('/admin/dashboard');
    expect(returnRouteForRole('/admin/security', 'librarian')).toBe('/librarian/dashboard');
  });
});
