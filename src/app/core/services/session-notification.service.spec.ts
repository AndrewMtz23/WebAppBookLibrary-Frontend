import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { SessionNotificationService } from './session-notification.service';

describe('SessionNotificationService', () => {
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
    service.handleExpiredSession('/app/catalog');
    service.handleExpiredSession('/app/catalog');

    expect(logout).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledTimes(1);
  });
});
