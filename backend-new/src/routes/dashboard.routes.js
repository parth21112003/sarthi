/**
 * ==============================================================================
 * DASHBOARD METRICS ROUTES (src/routes/dashboard.routes.js)
 * ==============================================================================
 * Route Base Prefix: `/api/dashboard`
 * 
 * ENDPOINTS:
 * - GET /api/dashboard/summary : Get role-based summary metrics & counters
 * ==============================================================================
 */

import express from 'express';
import { getDashboardSummary } from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Protected: Get role-based dashboard summary metrics
router.get('/summary', authenticate, getDashboardSummary);

export default router;
