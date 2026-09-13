import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ReaderShellComponent } from './reader-shell.component';

describe('ReaderShellComponent', () => {
  async function render(role: 'user' | 'admin' | 'librarian' = 'user') {
    const session = { token: 'token', user: { id: '1', username: 'Elena', email: 'e@x.com', role } };
    await TestBed.configureTestingModule({
      imports: [ReaderShellComponent, RouterTestingModule],
      providers: [{ provide: AuthService, useValue: {
        sessionSnapshot: session,
        session$: new BehaviorSubject(session),
        logout: jasmine.createSpy('logout')
      }}]
    }).compileComponents();

    const fixture = TestBed.createComponent(ReaderShellComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('shows reader destinations and no staff links', async () => {
    const fixture = await render();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Descubrir');
    expect(text).toContain('Mi biblioteca');
    expect(text).not.toContain('Usuarios');
    expect(text).toContain('Elena');
  });

  it('shows staff only the public destinations and a return to their panel', async () => {
    const fixture = await render('admin');
    (fixture.nativeElement.querySelector('.account-menu__trigger') as HTMLButtonElement).click();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Descubrir');
    expect(text).toContain('Catálogo');
    expect(text).toContain('Panel');
    expect(text).not.toContain('Mi biblioteca');
    expect(text).not.toContain('Favoritos');
  });
});
