import { Router } from 'express';
import { requireAuth, requireRole, requirePermission } from '../middleware/auth.js';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserRole,
  activateUser,
  deactivateUser,
  deleteUser,
} from '../controllers/userController.js';

const router = Router();

router.get('/', requireAuth, requireRole('admin', 'staff'), requirePermission('users.view'), getAllUsers);
router.post('/', requireAuth, requireRole('admin'), requirePermission('users.create'), createUser);
router.get('/:id', requireAuth, requireRole('admin', 'staff'), requirePermission('users.view'), getUserById);
router.put('/:id', requireAuth, requireRole('admin', 'staff'), requirePermission('users.update'), updateUser);
router.patch('/:id/role', requireAuth, requireRole('admin'), requirePermission('users.update'), updateUserRole);
router.patch('/:id/activate', requireAuth, requireRole('admin'), requirePermission('users.update'), activateUser);
router.patch('/:id/deactivate', requireAuth, requireRole('admin'), requirePermission('users.update'), deactivateUser);
router.delete('/:id', requireAuth, requireRole('admin'), requirePermission('users.delete'), deleteUser);

export default router;