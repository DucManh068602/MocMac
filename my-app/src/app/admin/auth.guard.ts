import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/dang-nhap']);
  }

  const user = auth.user();
  if (user?.role !== 'admin') {
    return router.createUrlTree(['/']);
  }

  return true;
};
