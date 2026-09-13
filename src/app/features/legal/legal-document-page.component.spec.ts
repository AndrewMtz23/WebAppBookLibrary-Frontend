import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { LegalDocumentPageComponent } from './legal-document-page.component';

describe('LegalDocumentPageComponent', () => {
  for (const [document, heading] of [['privacy', 'Política de privacidad'], ['legal', 'Aviso legal']] as const) {
    it(`renders the ${document} document with a single primary heading`, () => {
      TestBed.configureTestingModule({
        imports: [LegalDocumentPageComponent],
        providers: [provideRouter([]), { provide: ActivatedRoute, useValue: { snapshot: { data: { document } } } }]
      });

      const fixture = TestBed.createComponent(LegalDocumentPageComponent);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelectorAll('h1').length).toBe(1);
      expect(fixture.nativeElement.querySelector('h1').textContent).toContain(heading);
      expect(fixture.nativeElement.querySelector('footer.site-footer')).not.toBeNull();
      TestBed.resetTestingModule();
    });
  }
});
