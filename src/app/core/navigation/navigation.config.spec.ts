import { navigationForRole } from './navigation.config';

describe('role navigation configuration', () => {
  it('shows reader destinations without staff tools', () => {
    const labels = navigationForRole('user').map(item => item.label);

    expect(labels).toEqual(['Descubrir', 'Catálogo', 'Mi biblioteca', 'Favoritos', 'Perfil']);
    expect(labels).not.toContain('Usuarios');
  });

  it('shows operational destinations to librarians', () => {
    const labels = navigationForRole('librarian').map(item => item.label);

    expect(labels).toEqual(['Dashboard', 'Libros', 'Préstamos']);
    expect(labels).not.toContain('Usuarios');
    expect(labels).not.toContain('Seguridad');
  });

  it('shows administrative destinations to administrators', () => {
    const labels = navigationForRole('admin').map(item => item.label);

    expect(labels).toEqual(['Dashboard', 'Usuarios', 'Libros', 'Préstamos', 'Logs', 'Seguridad']);
  });

  it('returns a new immutable view without mutating configuration', () => {
    const first = navigationForRole('admin');
    const second = navigationForRole('admin');

    expect(first).not.toBe(second);
    expect(first).toEqual(second);
  });
});
