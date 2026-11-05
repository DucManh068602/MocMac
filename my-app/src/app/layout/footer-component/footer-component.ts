import { Component, inject } from '@angular/core';
import { I18nService } from '../../i18n.service';

@Component({
  selector: 'app-footer-component',
  standalone: false,
  templateUrl: './footer-component.html',
  styleUrl: './footer-component.css',
})
export class FooterComponent {
  readonly i18n = inject(I18nService);
  t(vi: string, en: string): string { return this.i18n.lang() === 'en' ? en : vi; }
}
