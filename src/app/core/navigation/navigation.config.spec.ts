import { navigationForRole, navigationGroupsForRole } from './navigation.config';

describe('role navigation configuration', () => {
  it('shows reader destinations without staff tools', () => {
    const labels = navigationForRole('user').map(item => item.label);

    expect(labels).toEqual(['Descubrir', 'Catálogo', 'Mi biblioteca', 'Favoritos', 'Perfil']);
    expect(labels).not.toContain('Usuarios');
  });

  it('shows operational destinations to librarians', () => {
    const labels = navigationForRole('librarian').map(item => item.label);

    expect(labels).toEqual(['Dashboard', 'Libros', 'Préstamos', 'Sitio público']);
    expect(labels).not.toContain('Usuarios');
    expect(labels).not.toContain('Seguridad');
  });

  it('shows administrative destinations to administrators', () => {
    const labels = navigationForRole('admin').map(item => item.label);

    expect(labels).toEqual(['Dashboard', 'Usuarios', 'Libros', 'Préstamos', 'Logs', 'Seguridad', 'Sitio público']);
  });

  it('organizes staff navigation into role-specific tree areas', () => {
    const adminGroups = navigationGroupsForRole('admin');
    const librarianGroups = navigationGroupsForRole('librarian');

    expect(adminGroups.map(group => group.label)).toEqual(['Gestión', 'Biblioteca', 'Control']);
    expect(adminGroups.find(group => group.label === 'Control')?.items.map(item => item.label))
      .toEqual(['Logs', 'Seguridad', 'Sitio público']);
    expect(librarianGroups.map(group => group.label)).toEqual(['Operación', 'Biblioteca']);
    expect(librarianGroups.flatMap(group => group.items).map(item => item.label)).toContain('Sitio público');
  });

  it('returns a new immutable view without mutating configuration', () => {
    const first = navigationForRole('admin');
    const second = navigationForRole('admin');

    expect(first).not.toBe(second);
    expect(first).toEqual(second);
  });
});
