import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReaderNavbarComponent } from '../../shared/ui/reader-navbar/reader-navbar.component';
import { SiteFooterComponent } from '../../shared/ui/site-footer/site-footer.component';

type LegalDocument = 'privacy' | 'legal';

@Component({
  selector: 'app-legal-document-page',
  standalone: true,
  imports: [ReaderNavbarComponent, RouterLink, SiteFooterComponent],
  templateUrl: './legal-document-page.component.html',
  styleUrl: './legal-document-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LegalDocumentPageComponent {
  readonly document = inject(ActivatedRoute).snapshot.data['document'] as LegalDocument;
}
