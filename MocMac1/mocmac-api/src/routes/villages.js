import { Router } from 'express';
import { getVillages } from '../controllers/villageController.js';

const router = Router();

router.get('/', getVillages);

export default router;
