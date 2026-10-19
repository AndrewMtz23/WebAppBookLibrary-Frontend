import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NotificationsPageComponent } from './notifications-page.component';
import { AuthService } from '../../core/services/auth.service';
import { SessionScopeService } from '../../core/auth/session-scope.service';

describe('NotificationsPageComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [NotificationsPageComponent], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: AuthService, useValue: { sessionSnapshot: { user: { id: 'a' } } } }] }));
  it('links support notices to private tickets', () => {
    const fixture = TestBed.createComponent(NotificationsPageComponent); const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/notifications/my?pageSize=20').flush({ items: [], nextCursor: null, readThrough: 0, unreadCount: 0 });
    http.expectOne('/api/notifications/my/preferences').flush({ reminders: true, email: false, emailVerified: false });
    expect(fixture.componentInstance.target({ targetType: 'support_ticket', targetId: '507f1f77bcf86cd799439011' } as any)).toEqual(['/app/support', '507f1f77bcf86cd799439011']);
    expect(fixture.componentInstance.target({ targetType: 'support_ticket', targetId: '../admin' } as any)).toBeNull(); http.verify();
    fixture.componentInstance.state.items.set([{ id: 'notice', type: 'support_update', title: 'Actualización de soporte', body: 'Consulta tu solicitud.', targetType: 'support_ticket', targetId: '507f1f77bcf86cd799439011', createdAt: '2026-10-18T12:00:00Z', readAt: null, dueAt: null }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('a[href="/app/support/507f1f77bcf86cd799439011"]').textContent).toContain('Ver solicitud');
  });
  it('can disable optional mail after an address change resets verification', () => {
    const fixture = TestBed.createComponent(NotificationsPageComponent); const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/notifications/my?pageSize=20').flush({ items: [], nextCursor: null, readThrough: 0, unreadCount: 0 });
    http.expectOne('/api/notifications/my/preferences').flush({ reminders: true, email: true, emailVerified: false });
    fixture.detectChanges();
    const boxes = fixture.nativeElement.querySelectorAll('input'); boxes[0].checked = false;
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    const save = http.expectOne('/api/notifications/my/preferences'); expect(save.request.body).toEqual({ reminders: false, email: false });
    save.flush({ reminders: false, email: false, emailVerified: false }); http.verify();
  });
  it('reloads both private resources after a cross-tab account change', () => {
    const fixture = TestBed.createComponent(NotificationsPageComponent); const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/notifications/my?pageSize=20').flush({ items: [], nextCursor: null, readThrough: 0, unreadCount: 0 });
    http.expectOne('/api/notifications/my/preferences').flush({ reminders: true, email: true, emailVerified: true });
    TestBed.inject(SessionScopeService).invalidate();
    expect(fixture.componentInstance.state.preferences()).toBeNull();
    http.expectOne('/api/notifications/my?pageSize=20').flush({ items: [], nextCursor: null, readThrough: 0, unreadCount: 0 });
    http.expectOne('/api/notifications/my/preferences').flush({ reminders: false, email: false, emailVerified: false });
    expect(fixture.componentInstance.state.preferences()?.reminders).toBeFalse(); http.verify();
  });
});
