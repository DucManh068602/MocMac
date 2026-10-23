import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
} from '../controllers/orderController.js';

const router = Router();

router.post('/', createOrder);
router.get('/mine', requireAuth, getMyOrders);
router.get('/', requireAuth, requireRole('admin', 'staff'), getAllOrders);
router.patch('/:id/status', requireAuth, requireRole('admin', 'staff'), updateOrderStatus);

export default router;
