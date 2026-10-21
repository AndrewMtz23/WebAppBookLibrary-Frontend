import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { CopyDetailComponent } from './copy-detail.component';
import { SessionScopeService } from '../../core/auth/session-scope.service';
describe('CopyDetailComponent', () => {
  it('keeps inspection text after conflict and clears private state on session change', () => {
    TestBed.configureTestingModule({ imports: [CopyDetailComponent], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: 'copy' })) } }] });
    const fixture = TestBed.createComponent(CopyDetailComponent); fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController); const component = fixture.componentInstance;
    http.expectOne('/api/copies/copy').flush({ id: 'copy', bookId: 'book', inventoryCode: 'CP-001', status: 'maintenance', version: 2, inspectionPending: true });
    http.expectOne('/api/copies/copy/history?page=1&pageSize=20').flush({ items: [], totalCount: 0 });
    http.expectOne('/api/books/book').flush({ title: 'A book', coverUrl: null });
    component.condition = 'good'; component.notes = 'Inspected'; component.inspect();
    const request = http.expectOne('/api/copies/copy/inspection'); expect(request.request.body.expectedVersion).toBe(2);
    request.flush({}, { status: 409, statusText: 'Conflict' });
    expect(component.notes).toBe('Inspected'); expect(component.conflict()).toBeTrue();
    TestBed.inject(SessionScopeService).invalidate(); expect(component.copy()).toBeNull(); expect(component.notes).toBe('');
    http.verify();
  });
});
