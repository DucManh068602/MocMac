import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  getAllCoupons,
  getCouponByCode,
  validateCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from '../controllers/couponController.js';

const router = Router();

router.get('/', getAllCoupons);
router.get('/code/:code', getCouponByCode);
router.get('/validate/:code', validateCoupon);
router.post('/', requireAuth, requireRole('admin', 'staff'), createCoupon);
router.patch('/:id', requireAuth, requireRole('admin', 'staff'), updateCoupon);
router.delete('/:id', requireAuth, requireRole('admin', 'staff'), deleteCoupon);

export default router;
