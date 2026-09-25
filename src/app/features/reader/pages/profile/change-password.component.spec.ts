import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { OperationNotificationService } from '../../../../core/services/operation-notification.service';
import { ChangePasswordComponent } from './change-password.component';

describe('ChangePasswordComponent', () => {
  let http: HttpTestingController;
  let logout: jasmine.Spy;
  beforeEach(() => {
    logout = jasmine.createSpy('logout');
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(),
      { provide: AuthService, useValue: { logout } }, { provide: Router, useValue: { navigate: jasmine.createSpy().and.resolveTo(true) } },
      { provide: OperationNotificationService, useValue: { success: jasmine.createSpy() } }] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('prevents duplicates and signs out only after the server confirms the change', () => {
    const component = TestBed.createComponent(ChangePasswordComponent).componentInstance;
    component.currentPassword = 'Previous1'; component.newPassword = component.confirmPassword = 'Changed1';
    component.submit(); component.submit();
    const request = http.expectOne('/api/profile/me/password');
    expect(request.request.method).toBe('PUT'); expect(logout).not.toHaveBeenCalled();
    request.flush(null, { status: 204, statusText: 'No Content' });
    expect(logout).toHaveBeenCalledTimes(1);
    expect(component.currentPassword).toBe(''); expect(component.newPassword).toBe('');
  });
  it('rejects mismatched confirmation and lets the user retry a wrong current password', () => {
    const component = TestBed.createComponent(ChangePasswordComponent).componentInstance;
    component.currentPassword = 'Wrong1'; component.newPassword = 'Changed1'; component.confirmPassword = 'Other1';
    component.submit(); http.expectNone('/api/profile/me/password');
    component.confirmPassword = 'Changed1'; component.submit();
    http.expectOne('/api/profile/me/password').flush({ code: 'current_password_invalid' }, { status: 400, statusText: 'Bad Request' });
    expect(component.error()).toContain('actual'); expect(component.busy()).toBeFalse(); expect(logout).not.toHaveBeenCalled();
  });
});
