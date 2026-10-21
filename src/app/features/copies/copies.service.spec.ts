import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CopiesService } from './copies.service';

describe('CopiesService', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] }));
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it('sends versions and inspection explicitly and encodes lookup input', () => {
    const api = TestBed.inject(CopiesService); const http = TestBed.inject(HttpTestingController);
    api.inspect('copy', { expectedVersion: 3, inspection: { condition: 'damaged', location: 'Repair', notes: null } }).subscribe();
    const update = http.expectOne('/api/copies/copy/inspection');
    expect(update.request.method).toBe('PUT'); expect(update.request.body.inspection.condition).toBe('damaged');
    expect(update.request.body.expectedVersion).toBe(3); update.flush({});
    api.lookup('A&B').subscribe(); const lookup = http.expectOne(r => r.url === '/api/copies/lookup');
    expect(lookup.request.params.get('code')).toBe('A&B'); lookup.flush({});
  });
});
