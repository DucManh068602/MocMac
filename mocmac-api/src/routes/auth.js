import { Router } from 'express';
import {
  login,
  register,
  verifyRegisterOtp,
  resendRegisterOtp,
  forgotPassword,
  resetPassword,
  adminResetPassword,
  googleConfig,
  googleLogin,
  refreshSession,
} from '../controllers/authController.js';

const router = Router();

router.post('/login', login);
router.get('/google/config', googleConfig);
router.post('/google', googleLogin);
router.post('/refresh', refreshSession);
router.post('/register', register);
router.post('/verify-register', verifyRegisterOtp);
router.post('/resend-register-otp', resendRegisterOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/admin/reset', adminResetPassword);

export default router;
