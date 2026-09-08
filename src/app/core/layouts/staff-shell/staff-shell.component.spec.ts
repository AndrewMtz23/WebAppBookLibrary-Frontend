import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '../../services/auth.service';
import { StaffShellComponent } from './staff-shell.component';

describe('StaffShellComponent', () => {
  const create = async (role: 'admin' | 'librarian') => {
    await TestBed.configureTestingModule({
      imports: [StaffShellComponent, RouterTestingModule],
      providers: [{ provide: AuthService, useValue: {
        sessionSnapshot: { token: 'token', user: { id: '1', username: 'Marina', email: 'm@x.com', role } },
        logout: jasmine.createSpy('logout')
      }}]
    }).compileComponents();
    const fixture = TestBed.createComponent(StaffShellComponent);
    fixture.detectChanges();
    return fixture.nativeElement.textContent as string;
  };

  it('shows the complete administration navigation to admins', async () => {
    const text = await create('admin');
    expect(text).toContain('Usuarios');
    expect(text).toContain('Seguridad');
    expect(text).toContain('Logs');
  });

  it('limits librarians to operational destinations', async () => {
    const text = await create('librarian');
    expect(text).toContain('Préstamos');
    expect(text).not.toContain('Usuarios');
    expect(text).not.toContain('Seguridad');
  });
});
