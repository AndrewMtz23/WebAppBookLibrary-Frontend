import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { LoanService } from './loan.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
describe('LoanService', () => {
  it('is created with its HTTP dependency', () => {
    TestBed.configureTestingModule({ imports: [], providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()] });
    expect(TestBed.inject(LoanService)).toBeTruthy();
  });
});
