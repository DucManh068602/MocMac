import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

export interface ProductReviewItem {
  id: string;
  name: string;
  rating: number;
  content: string;
  createdAt: string;
}

export interface CreateReviewData {
  userName: string;
  rating: number;
  content: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReviewsService {
  private http = inject(HttpClient);

  getForProduct(productId: number): Observable<ProductReviewItem[]> {
    return this.http
      .get<{ success?: boolean; reviews?: unknown[]; avgRating?: number }>(
        `/api/reviews/product/${productId}`
      )
      .pipe(
        map(response => {
          const reviews = response.reviews ?? (Array.isArray(response) ? response : []);
          return reviews.map(review => this.toProductReviewItem(review));
        })
      );
  }

  createForProduct(productId: number, data: CreateReviewData): Observable<ProductReviewItem> {
    return this.http
      .post<{ success?: boolean; review?: unknown; message?: string }>(
        '/api/reviews',
        { productId, rating: data.rating, comment: data.content }
      )
      .pipe(
        map(response => {
          const review = response.review ?? response;
          return this.toProductReviewItem(review, data.userName);
        })
      );
  }

  private toProductReviewItem(review: unknown, fallbackName = ''): ProductReviewItem {
    const r = (review ?? {}) as {
      _id?: unknown;
      id?: unknown;
      user?: { name?: unknown } | unknown;
      rating?: unknown;
      comment?: unknown;
      content?: unknown;
      createdAt?: unknown;
    };

    const user = r.user;
    const userName = typeof user === 'object' && user !== null && 'name' in user
      ? String((user as { name: unknown }).name ?? '')
      : '';

    return {
      id: String(r._id ?? r.id ?? ''),
      name: userName || fallbackName,
      rating: Number(r.rating) || 0,
      content: String(r.comment ?? r.content ?? ''),
      createdAt: String(r.createdAt ?? new Date().toISOString()),
    };
  }
}
