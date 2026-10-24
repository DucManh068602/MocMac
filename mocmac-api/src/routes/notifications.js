import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  getAllNotifications,
  getUserNotifications,
  markAllNotificationsRead,
  getNotificationById,
  createNotification,
  sendNotification,
  markAsRead,
  deleteNotification,
} from '../controllers/notificationController.js';

const router = Router();

router.get('/', requireAuth, requireRole('admin', 'staff'), getAllNotifications);
router.get('/mine', requireAuth, getUserNotifications);
router.patch('/mine/read-all', requireAuth, markAllNotificationsRead);
router.get('/:id', requireAuth, requireRole('admin', 'staff'), getNotificationById);
router.post('/', requireAuth, requireRole('admin', 'staff'), createNotification);
router.post('/send', requireAuth, requireRole('admin', 'staff'), sendNotification);
router.patch('/:id/read', requireAuth, requireRole('admin', 'staff'), markAsRead);
router.delete('/:id', requireAuth, requireRole('admin', 'staff'), deleteNotification);

export default router;
