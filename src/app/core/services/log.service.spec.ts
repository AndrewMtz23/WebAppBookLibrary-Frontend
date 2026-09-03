import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { LogService } from './log.service';
describe('LogService', () => {
  it('is created with its HTTP dependency', () => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    expect(TestBed.inject(LogService)).toBeTruthy();
  });
});
