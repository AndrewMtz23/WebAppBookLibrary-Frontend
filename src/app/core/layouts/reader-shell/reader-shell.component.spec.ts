import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '../../services/auth.service';
import { ReaderShellComponent } from './reader-shell.component';

describe('ReaderShellComponent', () => {
  it('shows reader destinations and no staff links', async () => {
    await TestBed.configureTestingModule({
      imports: [ReaderShellComponent, RouterTestingModule],
      providers: [{ provide: AuthService, useValue: {
        sessionSnapshot: { token: 'token', user: { id: '1', username: 'Elena', email: 'e@x.com', role: 'user' } },
        logout: jasmine.createSpy('logout')
      }}]
    }).compileComponents();

    const fixture = TestBed.createComponent(ReaderShellComponent);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Descubrir');
    expect(text).toContain('Mi biblioteca');
    expect(text).not.toContain('Usuarios');
    expect(text).toContain('Elena');
  });
});
