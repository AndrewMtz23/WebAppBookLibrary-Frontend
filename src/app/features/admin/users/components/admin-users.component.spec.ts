import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { OverlayContainer } from '@angular/cdk/overlay';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { AdminUsersFacade } from '../data-access/admin-users.facade';
import { AdminUsersComponent } from './admin-users.component';

describe('AdminUsersComponent', () => {
  const target = { id: 'target', username: 'ana', displayName: 'Ana Reader', email: 'ana@example.test', avatarUrl: 'https://images.example.test/ana.jpg', role: 'user', isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', lastLoginAt: null };
  beforeEach(() => TestBed.configureTestingModule({ imports: [AdminUsersComponent], providers: [AdminUsersFacade, provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: AuthService, useValue: { getUserId: () => 'self' } }] }));
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('opens a centered editor with identity, avatar URL, role and status fields', async () => {
    const fixture = TestBed.createComponent(AdminUsersComponent); fixture.detectChanges(); const http = TestBed.inject(HttpTestingController);
    http.expectOne(request => request.url === '/api/admin/users').flush({ items: [target], page: 1, pageSize: 20, totalItems: 1, totalPages: 1, hasPreviousPage: false, hasNextPage: false }); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('table caption').textContent).toContain('Cuentas administrables');
    const openers = Array.from(fixture.nativeElement.querySelectorAll('[data-user-id]')) as HTMLButtonElement[];
    const opener = openers.find(button => button.getClientRects().length > 0)!; opener.focus(); opener.click();
    http.expectOne('/api/admin/users/target').flush(target); fixture.detectChanges(); await fixture.whenStable();
    const dialog = fixture.nativeElement.querySelector('.user-editor-modal');
    expect(dialog).not.toBeNull();
    expect(dialog.querySelector('input[name="displayName"]').value).toBe('Ana Reader');
    expect(dialog.querySelector('input[name="username"]').value).toBe('ana');
    expect(dialog.querySelector('input[name="email"]').value).toBe('ana@example.test');
    expect(dialog.querySelector('input[name="avatarUrl"]').value).toBe('https://images.example.test/ana.jpg');
    expect(dialog.querySelector('select[name="role"]')).not.toBeNull();
    expect(dialog.querySelector('input[name="isActive"]')).not.toBeNull();
    expect(dialog.querySelector('img.user-avatar')?.getAttribute('src')).toBe('https://images.example.test/ana.jpg');
    (fixture.nativeElement.querySelector('[aria-label="Cerrar detalle"]') as HTMLButtonElement).click(); fixture.detectChanges(); await fixture.whenStable();
    expect(document.activeElement).toBe(opener);
  });

  it('submits all editable fields in one update and refreshes the visible user', async () => {
    const fixture = TestBed.createComponent(AdminUsersComponent); fixture.detectChanges(); const http = TestBed.inject(HttpTestingController);
    http.expectOne(request => request.url === '/api/admin/users').flush({ items: [target], page: 1, pageSize: 20, totalItems: 1, totalPages: 1, hasPreviousPage: false, hasNextPage: false }); fixture.detectChanges();
    (fixture.nativeElement.querySelector('[data-user-id]') as HTMLButtonElement).click();
    http.expectOne('/api/admin/users/target').flush(target); fixture.detectChanges(); await fixture.whenStable();
    const name = fixture.nativeElement.querySelector('input[name="displayName"]') as HTMLInputElement;
    name.value = 'Ana Actualizada'; name.dispatchEvent(new Event('input'));
    fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    (fixture.nativeElement.querySelector('[data-save-user]') as HTMLButtonElement).click();
    const update = http.expectOne('/api/admin/users/target');
    expect(update.request.method).toBe('PUT');
    expect(update.request.body).toEqual(jasmine.objectContaining({
      displayName: 'Ana Actualizada',
      username: 'ana',
      email: 'ana@example.test',
      avatarUrl: 'https://images.example.test/ana.jpg',
      role: 'user',
      isActive: true,
      expectedUpdatedAt: target.updatedAt
    }));
    update.flush({ ...target, displayName: 'Ana Actualizada', updatedAt: '2026-01-02T00:00:00Z' });
    http.expectOne(request => request.url === '/api/admin/users').flush({ items: [{ ...target, displayName: 'Ana Actualizada' }], page: 1, pageSize: 20, totalItems: 1, totalPages: 1, hasPreviousPage: false, hasNextPage: false });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Usuario actualizado');
    expect(fixture.nativeElement.querySelector('.user-editor-modal')).toBeNull();
    const toast = TestBed.inject(OverlayContainer).getContainerElement().querySelector('mat-snack-bar-container');
    expect(toast?.textContent).toContain('Usuario actualizado');
    expect(toast?.textContent).toContain('Cerrar');
  });

  it('shows a visible reason and disables self access removal', () => {
    const self = { ...target, id: 'self', username: 'root', role: 'admin' };
    const fixture = TestBed.createComponent(AdminUsersComponent); fixture.detectChanges(); const http = TestBed.inject(HttpTestingController);
    http.expectOne(request => request.url === '/api/admin/users').flush({ items: [self], page: 1, pageSize: 20, totalItems: 1, totalPages: 1, hasPreviousPage: false, hasNextPage: false }); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.self-note').textContent).toContain('no puedes quitarte acceso');
    expect(fixture.nativeElement.querySelector('[data-user-status]')?.disabled).toBeTrue();
    expect(fixture.nativeElement.querySelector('[data-user-delete]')?.disabled).toBeTrue();
  });

  it('renders icon actions and confirms logical deletion without removing the account', () => {
    const fixture = TestBed.createComponent(AdminUsersComponent); fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    const page = { items: [target], page: 1, pageSize: 20, totalItems: 1, totalPages: 1, hasPreviousPage: false, hasNextPage: false };
    http.expectOne(request => request.url === '/api/admin/users').flush(page); fixture.detectChanges();
    const edit = fixture.nativeElement.querySelector('[data-user-id]') as HTMLButtonElement;
    expect(edit.textContent?.trim()).toBe('edit');
    expect(edit.getAttribute('aria-label')).toContain('Editar');
    const deactivate = fixture.nativeElement.querySelector('[data-user-status]') as HTMLButtonElement;
    expect(deactivate).not.toBeNull();
    if (!deactivate) return;
    deactivate.click(); fixture.detectChanges();
    http.expectNone(request => request.method === 'PUT');
    (fixture.nativeElement.querySelector('[data-confirm]') as HTMLButtonElement).click();
    const update = http.expectOne('/api/admin/users/target/status');
    expect(update.request.body).toEqual({ isActive: false }); update.flush(null);
    http.expectOne(request => request.url === '/api/admin/users').flush({ ...page, items: [{ ...target, isActive: false }] });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alertdialog"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-user-delete]').disabled).toBeFalse();
  });

  it('confirms physical deletion of an inactive account and refreshes the list', () => {
    const fixture = TestBed.createComponent(AdminUsersComponent); fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(request => request.url === '/api/admin/users').flush({ items: [{ ...target, isActive: false }], page: 1, pageSize: 20, totalItems: 1, totalPages: 1 }); fixture.detectChanges();
    const remove = fixture.nativeElement.querySelector('[data-user-delete]') as HTMLButtonElement;
    expect(remove).not.toBeNull(); if (!remove) return;
    remove.click(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alertdialog"]').textContent).toContain('no se puede deshacer');
    http.expectNone(request => request.method === 'DELETE');
    (fixture.nativeElement.querySelector('[data-confirm]') as HTMLButtonElement).click();
    const deletion = http.expectOne('/api/admin/users/target/permanent');
    expect(deletion.request.method).toBe('DELETE'); deletion.flush(null);
    http.expectOne(request => request.url === '/api/admin/users').flush({ items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 0 }); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alertdialog"]')).toBeNull();
    expect(TestBed.inject(OverlayContainer).getContainerElement().textContent).toContain('Usuario eliminado definitivamente');
  });

  it('shows forbidden inline without rendering an empty result', () => {
    const fixture = TestBed.createComponent(AdminUsersComponent); fixture.detectChanges();
    TestBed.inject(HttpTestingController).expectOne(request => request.url === '/api/admin/users').flush({}, { status: 403, statusText: 'Forbidden' }); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('permiso');
    expect(fixture.nativeElement.querySelector('.empty')).toBeNull();
  });
});
