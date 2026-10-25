import { Router } from 'express';
import { getAllProvinces, syncProvinces } from '../controllers/provinceController.js';

const router = Router();

router.get('/', getAllProvinces);
router.get('/sync', syncProvinces);

export default router;
