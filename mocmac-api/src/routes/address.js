import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../controllers/addressController.js';

const router = Router();

router.get('/', requireAuth, listAddresses);
router.post('/', requireAuth, createAddress);
router.put('/:id', requireAuth, updateAddress);
router.delete('/:id', requireAuth, deleteAddress);
router.patch('/:id/default', requireAuth, setDefaultAddress);

export default router;
