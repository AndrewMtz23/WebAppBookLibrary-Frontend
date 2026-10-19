import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SupportDetailComponent } from './support-detail.component';
describe('SupportDetailComponent', () => {
  it('uses the server reopening deadline rather than a hardcoded seven days', () => {
    TestBed.configureTestingModule({ imports: [SupportDetailComponent], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    const fixture = TestBed.createComponent(SupportDetailComponent);
    fixture.componentInstance.ticket.set({ status: 'resolved', resolvedAt: new Date(Date.now() - 10 * 86400000).toISOString(), reopenUntil: new Date(Date.now() + 86400000).toISOString() } as any);
    expect(fixture.componentInstance.canReopen).toBeTrue();
  });
  it('keeps a reply after a version conflict and renders user HTML as plain text', () => {
    TestBed.configureTestingModule({ imports: [SupportDetailComponent], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    const fixture = TestBed.createComponent(SupportDetailComponent); fixture.componentRef.setInput('ticketId', 'ticket'); fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/support/tickets/ticket?page=1&pageSize=20').flush({ id: 'ticket', subject: '<img src=x onerror=alert(1)>', description: 'Private', category: 'loan', status: 'open', version: 3, replies: { items: [], totalPages: 0 } });
    fixture.detectChanges(); expect(fixture.nativeElement.querySelector('img')).toBeNull(); expect(fixture.nativeElement.textContent).toContain('<img src=x');
    fixture.componentInstance.text = 'My reply'; fixture.componentInstance.send();
    http.expectOne('/api/support/tickets/ticket/replies').flush({}, { status: 409, statusText: 'Conflict' });
    expect(fixture.componentInstance.text).toBe('My reply'); expect(fixture.componentInstance.error()).toContain('cambió'); http.verify();
  });
});
