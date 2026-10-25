import { Component, Input, Output, EventEmitter, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (totalPages > 1) {
      <nav class="pagination" role="navigation">
        <button
          type="button"
          class="page-btn"
          [disabled]="currentPage <= 1"
          (click)="onPrev()"
        >⟨</button>

        @for (item of pages(); track item.value) {
          <button
            type="button"
            class="page-btn"
            [class.active]="item.value === currentPage"
            [disabled]="item.type === 'ellipsis'"
            (click)="onPage(item.value)"
          >
            @if (item.type === 'ellipsis') { … } @else { {{ item.value }} }
          </button>
        }

        <button
          type="button"
          class="page-btn"
          [disabled]="currentPage >= totalPages"
          (click)="onNext()"
        >⟩</button>
      </nav>
    }
  `,
  styles: [`
    .pagination { display: flex; justify-content: center; gap: 4px; margin: 20px 0; flex-wrap: wrap; }
    .page-btn { padding: 6px 12px; border: 1px solid #d6ceb9; border-radius: 4px; background: #fff; cursor: pointer; font-size: 13px; }
    .page-btn:hover:not(:disabled) { background: #f4f3ec; }
    .page-btn.active { background: #435731; color: #fff; }
    .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  `]
})
export class PaginationComponent {
  @Input() currentPage: number = 1;
  @Input() totalPages: number = 1;
  @Output() pageChange = new EventEmitter<number>();

  private pagesSig = signal<{ value: number; type: 'page' | 'ellipsis' }[]>([]);

  pages = computed(() => {
    const total = this.totalPages;
    const current = this.currentPage;
    if (total <= 1) return [];

    const delta = 1;
    const range = [];
    const left = Math.max(2, current - delta);
    const right = Math.min(total - 1, current + delta);

    range.push({ value: 1, type: 'page' });

    if (left > 2) {
      range.push({ value: -1, type: 'ellipsis' });
    }

    for (let i = left; i <= right; i++) {
      range.push({ value: i, type: 'page' });
    }

    if (right < total - 1) {
      range.push({ value: -1, type: 'ellipsis' });
    }

    if (total > 1) {
      range.push({ value: total, type: 'page' });
    }

    return range;
  });

  onPage(page: number): void {
    if (page > 0 && page <= this.totalPages) {
      this.pageChange.emit(page);
    }
  }

  onPrev(): void {
    if (this.currentPage > 1) this.pageChange.emit(this.currentPage - 1);
  }

  onNext(): void {
    if (this.currentPage < this.totalPages) this.pageChange.emit(this.currentPage + 1);
  }
}
