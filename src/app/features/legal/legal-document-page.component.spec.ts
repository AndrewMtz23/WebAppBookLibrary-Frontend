import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { AuthSession } from '../../core/auth/auth-session.model';
import { AuthService } from '../../core/services/auth.service';
import { LegalDocumentPageComponent } from './legal-document-page.component';

describe('LegalDocumentPageComponent', () => {
  for (const [document, heading] of [['privacy', 'Política de privacidad'], ['legal', 'Aviso legal']] as const) {
    it(`renders the ${document} document with a single primary heading`, () => {
      TestBed.configureTestingModule({
        imports: [LegalDocumentPageComponent],
        providers: [
          provideRouter([]),
          { provide: ActivatedRoute, useValue: { snapshot: { data: { document } } } },
          { provide: AuthService, useValue: { sessionSnapshot: null, session$: new BehaviorSubject<AuthSession | null>(null), logout: jasmine.createSpy('logout') } }
        ]
      });

      const fixture = TestBed.createComponent(LegalDocumentPageComponent);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelectorAll('h1').length).toBe(1);
      expect(fixture.nativeElement.querySelector('h1').textContent).toContain(heading);
      expect(fixture.nativeElement.querySelector('footer.site-footer')).not.toBeNull();
      TestBed.resetTestingModule();
    });
  }

  it('renders the authenticated account control instead of a login prompt', () => {
    const session: AuthSession = { token: 'token', user: { id: '1', username: 'Lilith', email: 'lilith@example.com', role: 'admin' } };
    TestBed.configureTestingModule({
      imports: [LegalDocumentPageComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { data: { document: 'privacy' } } } },
        { provide: AuthService, useValue: { sessionSnapshot: session, session$: new BehaviorSubject(session), logout: jasmine.createSpy('logout') } }
      ]
    });
    const fixture = TestBed.createComponent(LegalDocumentPageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.account-menu__trigger')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('a[href="/auth/login"]')).toBeNull();
  });
});
