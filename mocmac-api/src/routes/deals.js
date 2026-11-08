import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { listDeals, createDeal, updateDeal, deleteDeal } from '../controllers/dealController.js';
const router = Router();
router.get('/', requireAuth, requireRole('admin', 'staff'), listDeals);
router.post('/', requireAuth, requireRole('admin', 'staff'), createDeal);
router.patch('/:id', requireAuth, requireRole('admin', 'staff'), updateDeal);
router.delete('/:id', requireAuth, requireRole('admin'), deleteDeal);
export default router;
