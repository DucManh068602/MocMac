import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  getProductReviews,
  createReview,
  getAllReviews,
  updateReviewStatus,
  deleteReview,
} from '../controllers/reviewController.js';

const router = Router();

router.get('/product/:id', getProductReviews);
router.post('/', requireAuth, createReview);
router.get('/', requireAuth, requireRole('admin', 'staff'), getAllReviews);
router.patch('/:id/status', requireAuth, requireRole('admin', 'staff'), updateReviewStatus);
router.delete('/:id', requireAuth, requireRole('admin'), deleteReview);

export default router;
