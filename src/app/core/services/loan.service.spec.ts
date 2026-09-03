import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { LoanService } from './loan.service';
describe('LoanService', () => {
  it('is created with its HTTP dependency', () => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    expect(TestBed.inject(LoanService)).toBeTruthy();
  });
});
