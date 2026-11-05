import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  getAllPermissions,
  assignRolePermission,
  revokeRolePermission,
} from '../controllers/permissionController.js';

const router = Router();

router.get('/', requireAuth, requireRole('admin'), getAllPermissions);
router.post('/assign', requireAuth, requireRole('admin'), assignRolePermission);
router.post('/revoke', requireAuth, requireRole('admin'), revokeRolePermission);

export default router;