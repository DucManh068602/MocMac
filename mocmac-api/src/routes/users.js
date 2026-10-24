import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  getAllUsers,
  getUserById,
  updateUserRole,
  activateUser,
  deactivateUser,
  deleteUser,
} from '../controllers/userController.js';

const router = Router();

router.get('/', requireAuth, requireRole('admin', 'staff'), getAllUsers);
router.get('/:id', requireAuth, requireRole('admin', 'staff'), getUserById);
router.patch('/:id/role', requireAuth, requireRole('admin'), updateUserRole);
router.patch('/:id/activate', requireAuth, requireRole('admin'), activateUser);
router.patch('/:id/deactivate', requireAuth, requireRole('admin'), deactivateUser);
router.delete('/:id', requireAuth, requireRole('admin'), deleteUser);

export default router;
