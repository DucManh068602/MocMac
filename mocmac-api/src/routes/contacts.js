import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  createContact,
  getAllContacts,
  getContactById,
  updateContactStatus,
} from '../controllers/contactController.js';

const router = Router();

router.post('/', createContact);
router.get('/', requireAuth, requireRole('admin', 'staff'), getAllContacts);
router.get('/:id', requireAuth, requireRole('admin', 'staff'), getContactById);
router.patch('/:id/status', requireAuth, requireRole('admin', 'staff'), updateContactStatus);

export default router;
