import { Router } from 'express';
import { getProvinces, getDistricts, getWards } from '../controllers/locationController.js';

const router = Router();

router.get('/provinces', getProvinces);
router.get('/provinces/:code/districts', getDistricts);
router.get('/districts/:code/wards', getWards);

export default router;
