import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SupportPageComponent } from './support-page.component';
import { SessionScopeService } from '../../core/auth/session-scope.service';

describe('SupportPageComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [SupportPageComponent], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] }));
  it('preserves a rejected draft and prevents duplicate submissions', () => {
    const fixture = TestBed.createComponent(SupportPageComponent); fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/support/tickets/my?page=1&pageSize=20').flush({ items: [], totalItems: 0, totalPages: 0 });
    const component = fixture.componentInstance;
    component.subject = 'Help'; component.description = 'Private draft'; component.create(); component.create();
    const request = http.expectOne('/api/support/tickets'); request.flush({ detail: 'Wait' }, { status: 429, statusText: 'Too Many Requests' });
    expect(component.description).toBe('Private draft'); expect(component.saving()).toBeFalse(); expect(component.error()).toContain('Wait'); http.verify();
  });
  it('cancels requests and clears private data when the session changes', () => {
    const fixture = TestBed.createComponent(SupportPageComponent); fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController); const request = http.expectOne('/api/support/tickets/my?page=1&pageSize=20');
    fixture.componentInstance.description = 'Secret draft';
    fixture.componentInstance.total = 7; fixture.componentInstance.totalPages = 2;
    TestBed.inject(SessionScopeService).invalidate();
    expect(request.cancelled).toBeTrue(); expect(fixture.componentInstance.description).toBe(''); expect(fixture.componentInstance.items()).toEqual([]);
    expect(fixture.componentInstance.total).toBe(0); expect(fixture.componentInstance.totalPages).toBe(0);
    http.verify();
  });
});
