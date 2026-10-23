import { Router } from 'express';
import { getAllRegions, getRegionBySlug } from '../controllers/regionController.js';

const router = Router();

router.get('/', getAllRegions);
router.get('/:slug', getRegionBySlug);

export default router;
