import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { AuthService } from './auth.service';
import { SessionNotificationService } from './session-notification.service';

describe('SessionNotificationService', () => {
  it('keeps a public book open until the user chooses to sign in', () => {
    const action = new Subject<void>();
    const auth = { logout: jasmine.createSpy('logout') };
    const router = { navigate: jasmine.createSpy('navigate').and.resolveTo(true) };
    const snackbar = { open: jasmine.createSpy('open').and.returnValue({ onAction: () => action }) };
    const service = new SessionNotificationService(auth as any, router as any, snackbar as any);
    service.handleExpiredSession('/app/catalog/abc123');
    expect(auth.logout).toHaveBeenCalledTimes(1);
    expect(router.navigate).not.toHaveBeenCalled();
    action.next();
    expect(router.navigate).toHaveBeenCalledOnceWith(['/auth/login'], { queryParams: { returnUrl: '/app/catalog/abc123' } });
  });
  it('coordinates concurrent expiration notifications only once', () => {
    const logout = jasmine.createSpy('logout');
    const navigate = jasmine.createSpy('navigate').and.returnValue(new Promise<boolean>(() => undefined));
    const open = jasmine.createSpy('open');
    TestBed.configureTestingModule({ providers: [
      SessionNotificationService,
      { provide: AuthService, useValue: { logout } },
      { provide: Router, useValue: { navigate } },
      { provide: MatSnackBar, useValue: { open } }
    ] });

    const service = TestBed.inject(SessionNotificationService);
    service.handleExpiredSession('/app/my-library');
    service.handleExpiredSession('/app/my-library');

    expect(logout).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledTimes(1);
  });
});
