import { HTTP_INTERCEPTORS, HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BranchInterceptor } from './branch.interceptor';
import { BranchContextService } from './branch-context.service';

describe('BranchInterceptor', () => {
  it('cancels stale context responses and never sends the branch to external resources', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting(), { provide: HTTP_INTERCEPTORS, useClass: BranchInterceptor, multi: true }] });
    const context = TestBed.inject(BranchContextService), http = TestBed.inject(HttpClient), mock = TestBed.inject(HttpTestingController);
    context.setBranches([{id:'a',code:'A',name:'A',timeZone:'UTC'},{id:'b',code:'B',name:'B',timeZone:'UTC'}], true);
    context.select('a');
    const next = jasmine.createSpy('next');
    http.get('/api/books').subscribe(next);
    const prior = mock.expectOne('/api/books');
    expect(prior.request.headers.get('X-Branch-Id')).toBe('a');
    context.select('b');
    expect(prior.cancelled).toBeTrue(); expect(next).not.toHaveBeenCalled();
    http.get('https://example.org/api/books').subscribe();
    const external = mock.expectOne('https://example.org/api/books');
    expect(external.request.headers.has('X-Branch-Id')).toBeFalse(); external.flush({}); mock.verify();
  });
});
