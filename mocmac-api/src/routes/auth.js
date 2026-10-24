import { Router } from 'express';
import {
  login,
  register,
  forgotPassword,
  resetPassword,
  adminResetPassword,
} from '../controllers/authController.js';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/admin/reset', adminResetPassword);

export default router;
