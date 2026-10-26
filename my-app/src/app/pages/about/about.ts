import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-about',
  standalone: false,
  templateUrl: './about.html',
  styleUrl: './about.css',
})
export class AboutComponent {
  readonly mission = signal<string>(
    'Mộc Mạc tin rằng mỗi sản phẩm đều mang trong mình một câu chuyện văn hoá, mang hơi thở bản địa và tinh túy của những làng nghề Việt.',
  );
}
