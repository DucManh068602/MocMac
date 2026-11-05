import { Router } from 'express';
import { requireAuth, requireRole, requirePermission } from '../middleware/auth.js';
import {
  getAllNotifications,
  getUserNotifications,
  markAllNotificationsRead,
  markAllNotificationsReadAll,
  getNotificationById,
  createNotification,
  sendNotification,
  markAsRead,
  deleteNotification,
} from '../controllers/notificationController.js';

const router = Router();

router.get('/', requireAuth, requireRole('admin', 'staff'), requirePermission('notifications.view'), getAllNotifications);
router.get('/mine', requireAuth, getUserNotifications);
router.patch('/mine/read-all', requireAuth, markAllNotificationsRead);
router.patch('/read-all', requireAuth, requireRole('admin', 'staff'), requirePermission('notifications.update'), markAllNotificationsReadAll);
router.get('/:id', requireAuth, requireRole('admin', 'staff'), requirePermission('notifications.view'), getNotificationById);
router.post('/', requireAuth, requireRole('admin', 'staff'), requirePermission('notifications.create'), createNotification);
router.post('/send', requireAuth, requireRole('admin', 'staff'), requirePermission('notifications.create'), sendNotification);
router.patch('/:id/read', requireAuth, requireRole('admin', 'staff'), requirePermission('notifications.update'), markAsRead);
router.delete('/:id', requireAuth, requireRole('admin'), requirePermission('notifications.delete'), deleteNotification);

export default router;