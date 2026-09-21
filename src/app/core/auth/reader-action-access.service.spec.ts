import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ReaderActionAccessService } from './reader-action-access.service';

describe('ReaderActionAccessService', () => {
  it('opens one prompt for a visitor and permits only authenticated readers', () => {
    const closed = new Subject<void>();
    const open = jasmine.createSpy('open').and.returnValue({ afterClosed: () => closed });
    const auth = { isLoggedIn: jasmine.createSpy().and.returnValue(false), sessionSnapshot: { user: { role: 'user' } } };
    const notice = jasmine.createSpy('open');
    TestBed.configureTestingModule({ providers: [
      { provide: AuthService, useValue: auth }, { provide: MatDialog, useValue: { open } },
      { provide: MatSnackBar, useValue: { open: notice } }
    ] });
    const service = TestBed.inject(ReaderActionAccessService);
    expect(service.ensureReader('favorite', 'book')).toBeFalse();
    expect(service.ensureReader('reserve', 'book')).toBeFalse();
    expect(open).toHaveBeenCalledTimes(1);
    closed.next();
    auth.isLoggedIn.and.returnValue(true);
    expect(service.ensureReader('reserve', 'book')).toBeTrue();
    auth.sessionSnapshot.user.role = 'admin';
    expect(service.ensureReader('reserve', 'book')).toBeFalse();
    expect(notice).toHaveBeenCalled();
    expect(open).toHaveBeenCalledTimes(1);
  });
});
