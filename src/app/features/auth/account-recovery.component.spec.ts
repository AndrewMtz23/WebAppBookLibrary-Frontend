import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { Location } from '@angular/common';
import { AccountRecoveryComponent } from './account-recovery.component';

describe('AccountRecoveryComponent', () => {
  let http: HttpTestingController;
  let location: jasmine.SpyObj<Location>;
  let fixture: ComponentFixture<AccountRecoveryComponent>;
  const token = 'a'.repeat(43);
  function setup(mode: string) {
    location = jasmine.createSpyObj('Location', ['replaceState']);
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
      { provide: Location, useValue: location },
      { provide: ActivatedRoute, useValue: { snapshot: { data: { mode }, fragment: 'token=' + token } } }] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AccountRecoveryComponent);
    return fixture.componentInstance;
  }
  afterEach(() => http.verify());
  it('focuses the error summary and associates it with the password fields', () => {
    const c = setup('reset'); fixture.detectChanges();
    c.newPassword = 'Changed1'; c.confirmPassword = 'Different1'; c.submit(); fixture.detectChanges();
    const alert = fixture.nativeElement.querySelector('[role="alert"]');
    expect(document.activeElement).toBe(alert);
    expect(fixture.nativeElement.querySelector('#recovery-confirm').getAttribute('aria-describedby')).toContain(alert.id);
  });
  for (const status of [500, 502, 504]) {
    it(`keeps confirmation retryable during HTTP ${status}`, () => {
      const c = setup('verify'); c.submit();
      http.expectOne('/api/auth/email-verification/confirm').flush({}, { status, statusText: 'Server failure' });
      expect(c.error()).toContain('no está disponible');
      expect(c.error()).not.toContain('venció');
      c.submit();
      http.expectOne('/api/auth/email-verification/confirm').flush(null);
      expect(c.success()).toBeTrue();
    });
  }
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
