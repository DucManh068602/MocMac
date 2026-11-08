import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getFlashSale, updateFlashSale, deleteFlashSale } from '../controllers/flashSaleController.js';
const router = Router();
router.get('/', getFlashSale);
router.put('/', requireAuth, requireRole('admin', 'staff'), updateFlashSale);
router.delete('/', requireAuth, requireRole('admin', 'staff'), deleteFlashSale);
export default router;
