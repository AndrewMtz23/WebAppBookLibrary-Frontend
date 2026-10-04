import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { CirculationService } from './circulation.service';

describe('CirculationService', () => {
  it('sends separate pickup and waitlist commands with stable request keys and expected versions', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const service = TestBed.inject(CirculationService); const http = TestBed.inject(HttpTestingController);
    service.reserve('book', 'retry-key').subscribe();
    const reserve = http.expectOne('/api/pickup-reservations');
    expect(reserve.request.body).toEqual({ bookId: 'book', idempotencyKey: 'retry-key' }); reserve.flush({ id: 'pickup' });
    service.collect({ id: 'pickup', version: 3 } as any).subscribe();
    const collect = http.expectOne('/api/pickup-reservations/pickup/collect');
    expect(collect.request.body).toEqual({ expectedVersion: 3 }); collect.flush({ loanId: 'loan' });
    service.join('book').subscribe(); const join = http.expectOne('/api/waitlist'); expect(join.request.body.bookId).toBe('book'); join.flush({}); http.verify();
  });
});
