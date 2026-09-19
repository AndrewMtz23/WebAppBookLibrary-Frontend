import { Injectable, signal } from '@angular/core';

type Theme = 'light' | 'dark';
const STORAGE_KEY = 'booklibrary_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _theme = signal<Theme>(this.resolveInitial());
  readonly isDark = this._theme.asReadonly();

  private resolveInitial(): Theme {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  constructor() {
    this.applyTheme(this._theme());
  }

  toggle(): void {
    const next: Theme = this._theme() === 'dark' ? 'light' : 'dark';
    this._theme.set(next);
    localStorage.setItem(STORAGE_KEY, next);
    this.applyTheme(next);
  }

  private applyTheme(theme: Theme): void {
    document.documentElement.setAttribute('data-theme', theme);
  }
}
