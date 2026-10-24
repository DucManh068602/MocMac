import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  getAllNotifications,
  getNotificationById,
  createNotification,
  markAsRead,
  deleteNotification,
} from '../controllers/notificationController.js';

const router = Router();

router.get('/', requireAuth, requireRole('admin', 'staff'), getAllNotifications);
router.get('/:id', requireAuth, requireRole('admin', 'staff'), getNotificationById);
router.post('/', requireAuth, requireRole('admin', 'staff'), createNotification);
router.patch('/:id/read', requireAuth, requireRole('admin', 'staff'), markAsRead);
router.delete('/:id', requireAuth, requireRole('admin', 'staff'), deleteNotification);

export default router;
