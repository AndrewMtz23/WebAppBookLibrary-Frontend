import { DOCUMENT } from '@angular/common';
import { Component, Inject, inject } from '@angular/core';
import { ThemeService } from './core/services/theme.service';

@Component({ selector: 'app-root', templateUrl: './app.component.html', styleUrls: ['./app.scss'], standalone: false })
export class AppComponent {
  private readonly theme = inject(ThemeService);
  constructor(@Inject(DOCUMENT) private readonly document: Document) {}

  skipToContent(event: Event): void {
    event.preventDefault();
    this.document.getElementById('main-content')?.focus();
  }
}
