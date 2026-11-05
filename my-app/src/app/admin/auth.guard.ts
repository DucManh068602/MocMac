import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../auth.service';

const ADMIN_DOMAIN = '.mocmac.vn';
const ALLOWED_ADMIN_ROLES = ['admin', 'staff', 'collaborator', 'cooperative'];

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/dang-nhap']);
  }

  const user = auth.user();
  if (!user) {
    return router.createUrlTree(['/']);
  }

  if (user.role === 'customer') {
    return router.createUrlTree(['/']);
  }

  if (!ALLOWED_ADMIN_ROLES.includes(user.role)) {
    return router.createUrlTree(['/']);
  }

  const isAdminDomain = user.email?.toLowerCase().endsWith(ADMIN_DOMAIN);
  if (user.role === 'admin' || user.role === 'staff') {
    if (!isAdminDomain) {
      return router.createUrlTree(['/']);
    }
  }

  return true;
};
