import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { listRegionStories, getRegionStoryById, createRegionStory, updateRegionStory, deleteRegionStory } from '../controllers/regionStoryController.js';

const router = Router();

router.get('/', listRegionStories);
router.get('/:id', getRegionStoryById);
router.post('/', requireAuth, requireRole('admin', 'staff'), createRegionStory);
router.patch('/:id', requireAuth, requireRole('admin', 'staff'), updateRegionStory);
router.delete('/:id', requireAuth, requireRole('admin', 'staff'), deleteRegionStory);

export default router;
