import { convertToParamMap } from '@angular/router';
import { parseAdminUserQuery, roleConsequence } from './admin-users.models';

describe('admin user query contract', () => {
  it('restores bounded server filters, dates, sort and page from the URL', () => {
    const query = parseAdminUserQuery(convertToParamMap({ query: `  ${'a'.repeat(220)}  `, role: 'admin', isActive: 'false', createdFrom: '2026-01-01T00:00:00Z', lastLoginTo: '2026-02-01T00:00:00Z', sort: 'lastLoginAt', direction: 'desc', page: '4', pageSize: '50' }));

    expect(query.query.length).toBe(200);
    expect(query).toEqual(jasmine.objectContaining({ role: 'admin', isActive: 'false', sort: 'lastLoginAt', direction: 'desc', page: 4, pageSize: 50 }));
    expect(query.createdFrom).toBe('2026-01-01T00:00:00.000Z');
    expect(query.lastLoginTo).toBe('2026-02-01T00:00:00.000Z');
  });

  it('describes the access granted and removed by the exact role choice', () => {
    expect(roleConsequence('admin', 'librarian')).toContain('gestionar catálogo y circulación');
    expect(roleConsequence('admin', 'librarian')).toContain('Se retirará');
    expect(roleConsequence('user', 'admin')).toContain('administrar cuentas');
  });
});
