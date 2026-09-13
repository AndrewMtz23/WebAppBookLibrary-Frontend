import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AppBrandComponent } from '../../shared/ui/app-brand/app-brand.component';
import { SiteFooterComponent } from '../../shared/ui/site-footer/site-footer.component';
import { AccountMenuComponent } from '../../shared/ui/account-menu/account-menu.component';

type LegalDocument = 'privacy' | 'legal';

@Component({
  selector: 'app-legal-document-page',
  standalone: true,
  imports: [AccountMenuComponent, AppBrandComponent, RouterLink, SiteFooterComponent],
  templateUrl: './legal-document-page.component.html',
  styleUrl: './legal-document-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LegalDocumentPageComponent {
  readonly document = inject(ActivatedRoute).snapshot.data['document'] as LegalDocument;
}
