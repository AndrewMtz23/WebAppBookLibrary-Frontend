import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { Location } from '@angular/common';
import { AccountRecoveryComponent } from './account-recovery.component';

describe('AccountRecoveryComponent', () => {
  let http: HttpTestingController;
  let location: jasmine.SpyObj<Location>;
  const token = 'a'.repeat(43);
  function setup(mode: string) {
    location = jasmine.createSpyObj('Location', ['replaceState']);
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
      { provide: Location, useValue: location },
      { provide: ActivatedRoute, useValue: { snapshot: { data: { mode }, fragment: 'token=' + token } } }] });
    http = TestBed.inject(HttpTestingController);
    return TestBed.createComponent(AccountRecoveryComponent).componentInstance;
  }
  afterEach(() => http.verify());
  it('removes the token from the URL without consuming it until explicit confirmation', () => {
    const c = setup('verify');
    expect(location.replaceState).toHaveBeenCalled();
    http.expectNone('/api/auth/email-verification/confirm');
    c.submit(); c.submit();
    const req = http.expectOne('/api/auth/email-verification/confirm');
    expect(req.request.method).toBe('POST'); expect(req.request.body).toEqual({ token });
    req.flush(null); expect(c.success()).toBeTrue();
  });
  it('validates matching passwords and clears them after reset', () => {
    const c = setup('reset'); c.newPassword = 'Changed1'; c.confirmPassword = 'Different1';
    c.submit(); http.expectNone('/api/auth/password-reset/confirm');
    c.confirmPassword = 'Changed1'; c.submit();
    http.expectOne('/api/auth/password-reset/confirm').flush(null);
    expect(c.newPassword).toBe(''); expect(c.success()).toBeTrue();
  });
  it('uses a generic recovery result and allows retry after a delivery outage', () => {
    const c = setup('forgot'); c.email = 'qa@example.invalid'; c.submit();
    http.expectOne('/api/auth/password-reset/request').flush({}, { status: 503, statusText: 'Unavailable' });
    expect(c.busy()).toBeFalse(); expect(c.success()).toBeFalse();
    c.submit(); http.expectOne('/api/auth/password-reset/request').flush({});
    expect(c.success()).toBeTrue();
  });
});
