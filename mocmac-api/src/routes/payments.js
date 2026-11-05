import { Router } from 'express';
import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  createPayment,
  vnpayReturn,
  vnpayIpn,
  vnpayMockPage,
  vnpayMockPay,
  getMyPayments,
  getPaymentStatus,
} from '../controllers/paymentController.js';

const router = Router();

router.post('/', requireAuth, createPayment);
router.get('/my-payments', requireAuth, getMyPayments);
router.get('/:id/status', requireAuth, getPaymentStatus);
router.get('/vnpay/mock', vnpayMockPage);
router.post('/vnpay/mock/pay', express.urlencoded({ extended: false }), vnpayMockPay);
router.get('/vnpay/return', vnpayReturn);
router.get('/vnpay/ipn', vnpayIpn);

export default router;
