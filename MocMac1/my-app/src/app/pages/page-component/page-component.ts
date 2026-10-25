import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-page-component',
  standalone: false,
  templateUrl: './page-component.html',
  styleUrl: './page-component.css',
})
export class PageComponent {
  private route = inject(ActivatedRoute);
  data = toSignal(this.route.data);
}
