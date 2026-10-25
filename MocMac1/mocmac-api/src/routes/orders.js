import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  createOrder,
  getMyOrders,
  getMyOrderById,
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus,
  trackOrder,
  checkCanReview,
} from '../controllers/orderController.js';

const router = Router();

router.post('/', createOrder);
router.get('/track/:orderId', trackOrder);
router.get('/mine', requireAuth, getMyOrders);
router.get('/mine/:id', requireAuth, getMyOrderById);
router.get('/can-review/:productId', requireAuth, checkCanReview);
router.get('/', requireAuth, requireRole('admin', 'staff'), getAllOrders);
router.patch('/:id/status', requireAuth, requireRole('admin', 'staff'), updateOrderStatus);
router.patch('/:id/payment', requireAuth, requireRole('admin', 'staff'), updatePaymentStatus);

export default router;
