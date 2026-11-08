import { Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.initialTheme());

  constructor() { this.apply(this.theme()); }

  toggle(): void { this.apply(this.theme() === 'light' ? 'dark' : 'light'); }

  private initialTheme(): Theme {
    const saved = localStorage.getItem('mocmac-theme');
    return saved === 'dark' || saved === 'light'
      ? saved
      : (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }

  private apply(theme: Theme): void {
    this.theme.set(theme);
    document.documentElement.dataset['theme'] = theme;
    localStorage.setItem('mocmac-theme', theme);
  }
}
