
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

export interface Product {
  id: number;
  name: string;
  place: string;
  price: string;
  cat: string;
  rate: number;
  reviews: number;
  icon: string;
  images: string[];
}

export interface Dataset {
  home: {
    products: Product[];
  };
}

interface SourceProduct {
  id: number;
  name: string;
  province?: string;
  region?: string;
  price: number;
  cat: string;
  rate: number;
  reviews: number;
  icon?: string;
  images?: string[];
}

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private http = inject(HttpClient);

  dataset = toSignal(
    this.http
      .get<SourceProduct[] | { products: SourceProduct[] }>(
        '/api/products'
      )
      .pipe(
        map((data) => {
          const products = Array.isArray(data)
            ? data
            : data.products ?? [];

          return {
            home: {
              products: products.slice(0, 8).map((p) => ({
                id: p.id,
                name: p.name,
                place: [p.province, p.region]
                  .filter(Boolean)
                  .join(' · '),
                price:
                  Number(p.price).toLocaleString('vi-VN') + 'đ',
                cat: p.cat,
                rate: p.rate,
                reviews: p.reviews,
                icon: p.icon || '🌿',
                images: p.images ?? [],
              })),
            },
          };
        })
      ),
    {
      initialValue: {
        home: {
          products: [],
        },
      },
    }
  );
}
