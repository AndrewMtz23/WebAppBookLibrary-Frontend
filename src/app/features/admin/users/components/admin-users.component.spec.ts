import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { AdminUsersFacade } from '../data-access/admin-users.facade';
import { AdminUsersComponent } from './admin-users.component';

describe('AdminUsersComponent', () => {
  const target = { id: 'target', username: 'ana', displayName: 'Ana Reader', email: 'ana@example.test', role: 'user', isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', lastLoginAt: null };
  beforeEach(() => TestBed.configureTestingModule({ imports: [AdminUsersComponent], providers: [AdminUsersFacade, provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: AuthService, useValue: { getUserId: () => 'self' } }] }));
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('renders semantic table, safe drawer and exact role consequence confirmation', async () => {
    const fixture = TestBed.createComponent(AdminUsersComponent); fixture.detectChanges(); const http = TestBed.inject(HttpTestingController);
    http.expectOne(request => request.url === '/api/admin/users').flush({ items: [target], page: 1, pageSize: 20, totalItems: 1, totalPages: 1, hasPreviousPage: false, hasNextPage: false }); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('table caption').textContent).toContain('Cuentas administrables');
    const openers = Array.from(fixture.nativeElement.querySelectorAll('[data-user-id]')) as HTMLButtonElement[];
    const opener = openers.find(button => button.getClientRects().length > 0)!; opener.focus(); opener.click();
    http.expectOne('/api/admin/users/target').flush(target); fixture.detectChanges(); await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[role="dialog"]').textContent).toContain('ana@example.test');
    const select = fixture.nativeElement.querySelector('.management select') as HTMLSelectElement; select.value = 'librarian'; select.dispatchEvent(new Event('change')); fixture.detectChanges();
    const roleButton = fixture.nativeElement.querySelector('.management button') as HTMLButtonElement; roleButton.focus(); roleButton.click(); fixture.detectChanges(); await fixture.whenStable();
    const confirmation = fixture.nativeElement.querySelector('[role="alertdialog"]');
    expect(confirmation.textContent).toContain('Cambiar rol a Bibliotecario');
    expect(confirmation.textContent).toContain('gestionar catálogo y circulación');
    expect(confirmation.textContent).toContain('Se retirará');
    expect(document.activeElement?.textContent).toContain('Confirmar rol Bibliotecario');
    (confirmation.querySelectorAll('button')[1] as HTMLButtonElement).click(); fixture.detectChanges(); await fixture.whenStable();
    expect(document.activeElement).toBe(roleButton);
    (fixture.nativeElement.querySelector('[aria-label="Cerrar detalle"]') as HTMLButtonElement).click(); fixture.detectChanges(); await fixture.whenStable();
    expect(document.activeElement).toBe(opener);
  });

  it('shows a visible reason and disables self access removal', () => {
    const self = { ...target, id: 'self', username: 'root', role: 'admin' };
    const fixture = TestBed.createComponent(AdminUsersComponent); fixture.detectChanges(); const http = TestBed.inject(HttpTestingController);
    http.expectOne(request => request.url === '/api/admin/users').flush({ items: [self], page: 1, pageSize: 20, totalItems: 1, totalPages: 1, hasPreviousPage: false, hasNextPage: false }); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.self-note').textContent).toContain('no puedes quitarte acceso');
  });

  it('shows forbidden inline without rendering an empty result', () => {
    const fixture = TestBed.createComponent(AdminUsersComponent); fixture.detectChanges();
    TestBed.inject(HttpTestingController).expectOne(request => request.url === '/api/admin/users').flush({}, { status: 403, statusText: 'Forbidden' }); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('permiso');
    expect(fixture.nativeElement.querySelector('.empty')).toBeNull();
  });
});
