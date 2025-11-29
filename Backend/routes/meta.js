// routes/metaRoutes.js
import express from 'express';
import { getSizes, getColors, getStandardColors, syncStandardColors } from '../controllers/metaController.js';

const router = express.Router();

router.get('/sizes', getSizes);
router.get('/colors', getColors);
router.get('/standard-colors', getStandardColors);
router.post('/sync-standard-colors', syncStandardColors);

export default router;
