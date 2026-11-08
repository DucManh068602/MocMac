import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getSiteContent, upsertSiteContent } from '../controllers/siteContentController.js';

const router = Router();

router.get('/:key', getSiteContent);
router.put('/:key', requireAuth, requireRole('admin', 'staff'), upsertSiteContent);

export default router;
