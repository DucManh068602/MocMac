import { Router } from 'express';
import { requireAuth, requireRole, requirePermission } from '../middleware/auth.js';
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
router.post('/', requireAuth, requireRole('admin', 'staff'), requirePermission('products.create'), createProduct);
router.put('/:slug', requireAuth, requireRole('admin', 'staff'), requirePermission('products.update'), updateProduct);
router.delete('/:slug', requireAuth, requireRole('admin'), requirePermission('products.delete'), deleteProduct);

export default router;