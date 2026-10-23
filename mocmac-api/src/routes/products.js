import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  getAllProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';

const router = Router();

router.get('/', getAllProducts);
router.get('/:slug', getProductBySlug);
router.post('/', requireAuth, requireRole('admin'), createProduct);
router.put('/:slug', requireAuth, requireRole('admin'), updateProduct);
router.delete('/:slug', requireAuth, requireRole('admin'), deleteProduct);

export default router;
