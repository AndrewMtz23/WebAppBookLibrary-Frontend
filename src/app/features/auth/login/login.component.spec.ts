import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, Subject } from 'rxjs';
import { ApiError } from 'src/app/core/http/api-error';
import { AuthService } from 'src/app/core/services/auth.service';
import { MaterialModule } from 'src/app/shared/material.module';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  const navigate = jasmine.createSpy('navigate');
  const login = jasmine.createSpy('login').and.returnValue(of({
    token: 'token',
    user: { id: '1', username: 'Ada', email: 'ada@example.com', role: 'admin' as const }
  }));

  beforeEach(async () => {
    navigate.calls.reset();
    login.calls.reset();
    login.and.returnValue(of({
      token: 'token',
      user: { id: '1', username: 'Ada', email: 'ada@example.com', role: 'admin' as const }
    }));

    await TestBed.configureTestingModule({
      declarations: [LoginComponent],
      imports: [FormsModule, MaterialModule, NoopAnimationsModule, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: { login } },
        { provide: MatSnackBar, useValue: { open: jasmine.createSpy('open') } }
      ]
    }).compileComponents();

    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.callFake((...args) => { navigate(...args); return Promise.resolve(true); });
    spyOn(router, 'navigateByUrl').and.callFake((...args) => { navigate(...args); return Promise.resolve(true); });
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
  });

  it('navigates to the authenticated role landing after login', () => {
    component.email = ' ada@example.com ';
    component.password = 'valid-password';

    component.login();

    expect(login).toHaveBeenCalledWith({ email: 'ada@example.com', password: 'valid-password' });
    expect(navigate).toHaveBeenCalledWith('/admin/dashboard');
  });

  it('keeps the loading state active while the successful navigation replaces the login page', () => {
    component.email = 'ada@example.com';
    component.password = 'valid-password';

    component.login();

    expect(component.isLoading).toBeTrue();
  });

  it('shows a blocking loading dialog while authentication is pending', () => {
    const pendingLogin = new Subject<never>();
    login.and.returnValue(pendingLogin);
    component.email = 'ada@example.com';
    component.password = 'valid-password';

    component.login();
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('.login-loading[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.textContent).toContain('Iniciando sesión');
    expect(dialog.textContent).toContain('Estamos preparando tu biblioteca');
  });

  it('removes the loading dialog when authentication fails', () => {
    const pendingLogin = new Subject<never>();
    login.and.returnValue(pendingLogin);
    component.email = 'ada@example.com';
    component.password = 'invalid-password';

    component.login();
    fixture.detectChanges();
    pendingLogin.error(new ApiError(401, 'Credenciales incorrectas.'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.login-loading')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Credenciales incorrectas.');
  });
});
