import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Component } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { provideRouter, Router } from '@angular/router';
import { AuthSession } from '../../../core/auth/auth-session.model';
import { AuthService } from '../../../core/services/auth.service';
import { AccountMenuComponent } from './account-menu.component';

@Component({ standalone: true, template: '' })
class LoginStubComponent {}

describe('AccountMenuComponent', () => {
  const adminSession: AuthSession = {
    token: 'token',
    user: { id: '1', username: 'Lilith Argueta Najera', email: 'lilithargueta@gmail.com', role: 'admin' }
  };

  const setup = (session: AuthSession | null) => {
    const sessionSubject = new BehaviorSubject<AuthSession | null>(session);
    const auth = {
      sessionSnapshot: session,
      session$: sessionSubject.asObservable(),
      logout: jasmine.createSpy('logout').and.callFake(() => sessionSubject.next(null))
    };
    TestBed.configureTestingModule({
      imports: [AccountMenuComponent],
      providers: [provideRouter([{ path: 'auth/login', component: LoginStubComponent }]), { provide: AuthService, useValue: auth }]
    });
    const fixture = TestBed.createComponent(AccountMenuComponent);
    fixture.detectChanges();
    return { fixture, auth };
  };

  it('shows a sign-in action for visitors', () => {
    const { fixture } = setup(null);
    expect(fixture.nativeElement.querySelector('a[href^="/auth/login"]')?.textContent).toContain('Iniciar sesi' + String.fromCharCode(243) + 'n');
    expect(fixture.nativeElement.querySelector('.account-menu__trigger')).toBeNull();
  });

  it('opens an authenticated admin menu with identity and dashboard destination', () => {
    const { fixture } = setup(adminSession);
    (fixture.nativeElement.querySelector('.account-menu__trigger') as HTMLButtonElement).click();
    fixture.detectChanges();

    const menu = fixture.nativeElement.querySelector('.account-menu__panel[role="menu"]') as HTMLElement;
    expect(menu.textContent).toContain('Lilith Argueta Najera');
    expect(menu.textContent).toContain('lilithargueta@gmail.com');
    expect(menu.textContent).toContain('ADMIN');
    expect(menu.querySelector('a[href="/admin/dashboard"]')?.textContent).toContain('Panel administrativo');
  });

  it('keeps the logout overlay viewport-sized inside the reader navbar', () => {
    const { fixture } = setup(adminSession);
    const navbar = document.createElement('header');
    navbar.className = 'reader-navbar';
    // The navbar is desktop-only; keep it visible at Karma's default viewport.
    navbar.style.display = 'block';
    navbar.style.height = '72px';
    document.body.appendChild(navbar);
    navbar.appendChild(fixture.nativeElement);
    try {
      (fixture.nativeElement.querySelector('.account-menu__trigger') as HTMLButtonElement).click();
      fixture.detectChanges();
      (fixture.nativeElement.querySelector('.account-menu__logout') as HTMLButtonElement).click();
      fixture.detectChanges();
      const overlay = fixture.nativeElement.querySelector('.account-logout-overlay') as HTMLElement;
      const dialog = fixture.nativeElement.querySelector('.account-logout-dialog') as HTMLElement;
      overlay.style.animation = 'none';
      dialog.style.animation = 'none';
      const bounds = overlay.getBoundingClientRect();
      expect(Math.abs(bounds.top)).toBeLessThan(1);
      expect(Math.abs(bounds.height - window.innerHeight)).toBeLessThan(1);
      const card = dialog.getBoundingClientRect();
      expect(card.top).toBeGreaterThanOrEqual(0);
      expect(card.bottom).toBeLessThanOrEqual(window.innerHeight);
      expect(Math.abs(card.top + card.height / 2 - window.innerHeight / 2)).toBeLessThan(1);
    } finally {
      fixture.destroy();
      navbar.remove();
    }
  });

  it('confirms logout and shows its progress before clearing the session', fakeAsync(() => {
    const { fixture, auth } = setup(adminSession);
    (fixture.nativeElement.querySelector('.account-menu__trigger') as HTMLButtonElement).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.account-menu__logout') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.account-logout-dialog').textContent).toContain('¿Seguro que deseas cerrar sesión?');

    (fixture.nativeElement.querySelector('.account-logout-dialog__confirm') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.account-logout-progress').textContent).toContain('Cerrando sesión…');
    expect(auth.logout).not.toHaveBeenCalled();

    tick(650);
    expect(auth.logout).toHaveBeenCalledTimes(1);
    TestBed.inject(Router).dispose();
  }));
});
