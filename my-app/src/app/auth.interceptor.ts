import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token =
    localStorage.getItem('mocmac-auth-token') ??
    sessionStorage.getItem('mocmac-auth-token');

  if (token) {
    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
    return next(authReq).pipe(catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || req.url.includes('/api/auth/refresh') || !auth.user() || !((auth.user()?.role === 'admin') || (auth.user()?.role === 'staff'))) return throwError(() => error);
      return auth.refresh().pipe(switchMap((response) => { auth.replaceSession(response); return next(req.clone({ setHeaders: { Authorization: `Bearer ${response.token}` } })); }), catchError((refreshError) => { auth.logout(); return throwError(() => refreshError); }));
    }));
  }
  return next(req);
};
