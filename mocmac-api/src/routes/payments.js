import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  createPayment,
  momoCallback,
  momoIpn,
  getMyPayments,
  getPaymentStatus,
} from '../controllers/paymentController.js';

const router = Router();

router.post('/', requireAuth, createPayment);
router.get('/my-payments', requireAuth, getMyPayments);
router.get('/:id/status', requireAuth, getPaymentStatus);
router.post('/momo/callback', momoCallback);
router.post('/momo/ipn', momoIpn);

export default router;
