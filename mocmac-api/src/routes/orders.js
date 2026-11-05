import { Router } from 'express';
import { requireAuth, requireRole, requirePermission } from '../middleware/auth.js';
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

router.post('/', requireAuth, requirePermission('orders.create'), createOrder);
router.get('/track/:orderId', trackOrder);
router.get('/mine', requireAuth, getMyOrders);
router.get('/mine/:id', requireAuth, getMyOrderById);
router.get('/can-review/:productId', requireAuth, checkCanReview);
router.get('/', requireAuth, requireRole('admin', 'staff'), requirePermission('orders.view'), getAllOrders);
router.patch('/:id/status', requireAuth, requireRole('admin', 'staff'), requirePermission('orders.update'), updateOrderStatus);
router.patch('/:id/payment', requireAuth, requireRole('admin', 'staff'), requirePermission('orders.update'), updatePaymentStatus);

export default router;