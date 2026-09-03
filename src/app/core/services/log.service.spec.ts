import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { LogService } from './log.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
describe('LogService', () => {
  it('is created with its HTTP dependency', () => {
    TestBed.configureTestingModule({ imports: [], providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()] });
    expect(TestBed.inject(LogService)).toBeTruthy();
  });
});
