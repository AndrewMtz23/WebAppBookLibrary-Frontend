import { DOCUMENT } from '@angular/common';
import { Component, Inject } from '@angular/core';

@Component({ selector: 'app-root', templateUrl: './app.component.html', styleUrls: ['./app.scss'], standalone: false })
export class AppComponent {
  constructor(@Inject(DOCUMENT) private readonly document: Document) {}

  skipToContent(event: Event): void {
    event.preventDefault();
    this.document.getElementById('main-content')?.focus();
  }
}
