import { Router } from 'express';
import { requireAuth, requireRole, requirePermission } from '../middleware/auth.js';
import {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  getCouponByCode,
} from '../controllers/couponController.js';

const router = Router();

// Public (checkout)
router.get('/validate/:code', validateCoupon);
router.get('/code/:code', getCouponByCode);

router.get('/', requireAuth, requireRole('admin', 'staff'), requirePermission('coupons.view'), getAllCoupons);
router.post('/', requireAuth, requireRole('admin', 'staff'), requirePermission('coupons.create'), createCoupon);
router.patch('/:id', requireAuth, requireRole('admin', 'staff'), requirePermission('coupons.update'), updateCoupon);
router.delete('/:id', requireAuth, requireRole('admin'), requirePermission('coupons.delete'), deleteCoupon);

export default router;