import { Router } from 'express';
import { requireAuth, requireRole, requirePermission } from '../middleware/auth.js';
import {
  createContact,
  getAllContacts,
  getContactById,
  updateContactStatus,
} from '../controllers/contactController.js';

const router = Router();

router.post('/', createContact);
router.get('/', requireAuth, requireRole('admin', 'staff'), requirePermission('contacts.view'), getAllContacts);
router.get('/:id', requireAuth, requireRole('admin', 'staff'), requirePermission('contacts.view'), getContactById);
router.patch('/:id/status', requireAuth, requireRole('admin', 'staff'), requirePermission('contacts.update'), updateContactStatus);

export default router;