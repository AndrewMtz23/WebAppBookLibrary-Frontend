import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { of } from 'rxjs';
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

    await TestBed.configureTestingModule({
      declarations: [LoginComponent],
      imports: [FormsModule, MaterialModule, NoopAnimationsModule],
      providers: [
        { provide: AuthService, useValue: { login } },
        { provide: Router, useValue: { navigate } },
        { provide: MatSnackBar, useValue: { open: jasmine.createSpy('open') } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
  });

  it('navigates to the authenticated role landing after login', () => {
    component.username = 'Ada';
    component.password = 'valid-password';

    component.login();

    expect(navigate).toHaveBeenCalledWith(['/admin/dashboard']);
  });
});
