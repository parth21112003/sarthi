/**
 * ==============================================================================
 * RATING & REVIEWS ROUTES (src/routes/rating.routes.js)
 * ==============================================================================
 * Route Base Prefix: `/api/ratings`
 * 
 * ENDPOINTS:
 * - POST /api/ratings                        : Rate a counselor (Student only, after completed session)
 * - GET  /api/ratings/counselor/:counselorId: List all ratings & reviews for a counselor
 * ==============================================================================
 */

import express from 'express';
import { listCounselorRatings, rateCounselor, getMyReviews } from '../controllers/rating.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Protected: Submit or update rating for counselor (Student only)
router.post('/', authenticate, rateCounselor);

// Protected: List all ratings submitted by current student
router.get('/mine', authenticate, getMyReviews);

// Protected: List all ratings and student reviews for a specific counselor
router.get('/counselor/:counselorId', authenticate, listCounselorRatings);

export default router;
