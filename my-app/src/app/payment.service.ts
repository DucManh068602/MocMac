import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface CheckoutPayload {
  items: { productId: number; name: string; price: number; quantity: number }[];
  subtotal: number;
  discount?: number;
  shipping?: number;
  total: number;
  paymentMethod: 'cod' | 'momo';
  customerInfo?: { name: string; phone: string; address: string };
  note?: string;
  couponCode?: string;
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  order: any;
  payment: any;
  payUrl?: string;
}

export interface PaymentHistory {
  success: boolean;
  total: number;
  payments: any[];
}

export interface CouponValidation {
  success: boolean;
  message: string;
  code: string;
  discountType: string;
  discountValue: number;
  discountAmount: number;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);

  checkout(payload: CheckoutPayload): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>('/api/payments', payload);
  }

  getMyPayments(): Observable<PaymentHistory> {
    return this.http.get<PaymentHistory>('/api/payments/my-payments');
  }

  getPaymentStatus(id: string): Observable<any> {
    return this.http.get<any>(`/api/payments/${id}/status`);
  }

  validateCoupon(code: string, orderTotal: number): Observable<CouponValidation> {
    return this.http.get<CouponValidation>('/api/coupons/validate/' + code, {
      params: { orderTotal: String(orderTotal) },
    });
  }
}
