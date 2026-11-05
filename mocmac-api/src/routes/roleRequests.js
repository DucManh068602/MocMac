import { Router } from 'express';
import { requireAuth, requireRole, requirePermission } from '../middleware/auth.js';
import {
  submitRoleRequest,
  getMyRoleRequests,
  getAllRoleRequests,
  updateRoleRequest,
} from '../controllers/roleRequestController.js';

const router = Router();

router.post('/', requireAuth, requirePermission('role-requests.create'), submitRoleRequest);
router.get('/mine', requireAuth, getMyRoleRequests);
router.get('/', requireAuth, requireRole('admin', 'staff'), requirePermission('role-requests.view'), getAllRoleRequests);
router.patch('/:id', requireAuth, requireRole('admin'), requirePermission('role-requests.update'), updateRoleRequest);

export default router;