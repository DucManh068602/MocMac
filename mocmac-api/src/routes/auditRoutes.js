import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getAllAuditLogs, getAuditStats, clearAuditLogs } from '../controllers/auditController.js';

const router = Router();

router.get('/', requireAuth, requireRole('admin'), getAllAuditLogs);
router.get('/stats', requireAuth, requireRole('admin'), getAuditStats);
router.delete('/', requireAuth, requireRole('admin'), clearAuditLogs);

export default router;
