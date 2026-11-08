import { Router } from 'express';
import { createQuotationRequest, listQuotationRequests, updateQuotationRequest } from '../controllers/quotationRequestController.js';
const router = Router();
router.post('/', createQuotationRequest);
router.get('/', listQuotationRequests);
router.patch('/:id', updateQuotationRequest);
export default router;
