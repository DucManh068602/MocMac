import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  getRoutePermissions,
  setRoutePermission,
  deleteRoutePermission,
} from '../controllers/routePermissionController.js';

const router = Router();

router.get('/', requireAuth, requireRole('admin'), getRoutePermissions);
router.post('/', requireAuth, requireRole('admin'), setRoutePermission);
router.delete('/:id', requireAuth, requireRole('admin'), deleteRoutePermission);

export default router;
