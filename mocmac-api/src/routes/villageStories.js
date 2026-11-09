import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { listVillageStories, getVillageStoryById, createVillageStory, updateVillageStory, deleteVillageStory } from '../controllers/villageStoryController.js';

const router = Router();

router.get('/', listVillageStories);
router.get('/:id', getVillageStoryById);
router.post('/', requireAuth, requireRole('admin', 'staff'), createVillageStory);
router.patch('/:id', requireAuth, requireRole('admin', 'staff'), updateVillageStory);
router.delete('/:id', requireAuth, requireRole('admin', 'staff'), deleteVillageStory);

export default router;
