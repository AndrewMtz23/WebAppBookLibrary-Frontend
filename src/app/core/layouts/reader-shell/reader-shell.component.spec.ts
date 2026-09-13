import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '../../services/auth.service';
import { ReaderShellComponent } from './reader-shell.component';

describe('ReaderShellComponent', () => {
  async function render(role: 'user' | 'admin' | 'librarian' = 'user') {
    await TestBed.configureTestingModule({
      imports: [ReaderShellComponent, RouterTestingModule],
      providers: [{ provide: AuthService, useValue: {
        sessionSnapshot: { token: 'token', user: { id: '1', username: 'Elena', email: 'e@x.com', role } },
        logout: jasmine.createSpy('logout')
      }}]
    }).compileComponents();

    const fixture = TestBed.createComponent(ReaderShellComponent);
    fixture.detectChanges();
    return fixture.nativeElement.textContent as string;
  }

  it('shows reader destinations and no staff links', async () => {
    const text = await render();

    expect(text).toContain('Descubrir');
    expect(text).toContain('Mi biblioteca');
    expect(text).not.toContain('Usuarios');
    expect(text).toContain('Elena');
  });

  it('shows staff only the public destinations and a return to their panel', async () => {
    const text = await render('admin');

    expect(text).toContain('Descubrir');
    expect(text).toContain('Catálogo');
    expect(text).toContain('Panel');
    expect(text).not.toContain('Mi biblioteca');
    expect(text).not.toContain('Favoritos');
  });
});
