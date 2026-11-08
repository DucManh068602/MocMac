import { Router } from 'express';
import { requireAuth, requireRole, requirePermission } from '../middleware/auth.js';
import {
  getProductReviews,
  createReview,
  getAllReviews,
  updateReviewStatus,
  deleteReview,
  adminReplyReview,
} from '../controllers/reviewController.js';

const router = Router();

router.get('/product/:id', getProductReviews);
router.post('/', requireAuth, requirePermission('reviews.create'), createReview);
router.get('/', requireAuth, requireRole('admin', 'staff'), requirePermission('reviews.view'), getAllReviews);
router.patch('/:id/status', requireAuth, requireRole('admin', 'staff'), requirePermission('reviews.update'), updateReviewStatus);
router.patch('/:id/reply', requireAuth, requireRole('admin', 'staff'), requirePermission('reviews.update'), adminReplyReview);
router.delete('/:id', requireAuth, requireRole('admin'), requirePermission('reviews.delete'), deleteReview);

export default router;