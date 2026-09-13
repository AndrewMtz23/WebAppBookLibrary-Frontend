import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppBrandComponent } from '../app-brand/app-brand.component';

@Component({
  selector: 'app-site-footer',
  standalone: true,
  imports: [AppBrandComponent, RouterLink],
  templateUrl: './site-footer.component.html',
  styleUrl: './site-footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SiteFooterComponent {
  @Input() homeRoute: string | readonly string[] = '/';
  readonly year = new Date().getFullYear();
}
