import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  submitRoleRequest,
  getMyRoleRequests,
  getAllRoleRequests,
  updateRoleRequest,
} from '../controllers/roleRequestController.js';

const router = Router();

router.post('/', requireAuth, submitRoleRequest);
router.get('/mine', requireAuth, getMyRoleRequests);
router.get('/', requireAuth, requireRole('admin', 'staff'), getAllRoleRequests);
router.patch('/:id', requireAuth, requireRole('admin'), updateRoleRequest);

export default router;
