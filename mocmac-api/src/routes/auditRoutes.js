import { Router } from 'express';
import { requireAuth, requireRole, requirePermission } from '../middleware/auth.js';
import { getAllAuditLogs, getAuditStats, clearAuditLogs } from '../controllers/auditController.js';

const router = Router();

router.get('/', requireAuth, requireRole('admin'), requirePermission('audit.view'), getAllAuditLogs);
router.get('/stats', requireAuth, requireRole('admin'), requirePermission('audit.view'), getAuditStats);
router.delete('/', requireAuth, requireRole('admin'), requirePermission('audit.delete'), clearAuditLogs);

export default router;