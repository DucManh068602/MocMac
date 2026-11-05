import { Router } from 'express';
import { getQr } from '../controllers/qrController.js';

const router = Router();

router.get('/:type/:id', getQr);

export default router;
