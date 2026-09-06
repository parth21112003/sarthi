/**
 * ==============================================================================
 * COUNSELOR DIRECTORY & SCHEDULE ROUTES (src/routes/counselor.routes.js)
 * ==============================================================================
 * Route Base Prefix: `/api/counselors`
 * 
 * ENDPOINTS:
 * - GET /api/counselors                : Search/list counselors
 * - GET /api/counselors/:id            : Get detailed counselor profile with reviews & slots
 * - GET /api/counselors/:id/booked-slots: Get booked slots for a counselor on a given date
 * - GET /api/counselors/:id/availability: Get availability slots for counselor
 * - PUT /api/counselors/me/availability: Update counselor availability slots
 * ==============================================================================
 */

import express from 'express';
import {
  getAvailability,
  getBookedSlots,
  getCounselor,
  listCounselors,
  getRecommended,
  saveAvailability,
} from '../controllers/counselor.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Protected: List/Search counselor directory
router.get('/', authenticate, listCounselors);

// Protected: Get smart personalized counselor recommendations for student
router.get('/recommended', authenticate, getRecommended);

// Protected: Get booked slots for a specific counselor on a specific date
router.get('/:id/booked-slots', authenticate, getBookedSlots);

// Protected: Get detailed counselor profile with schedule slots & top reviews
router.get('/:id', authenticate, getCounselor);

// Protected: Get schedule availability slots for a specific counselor
router.get('/:id/availability', authenticate, getAvailability);

// Protected: Save/Replace counselor schedule availability slots
router.put('/me/availability', authenticate, saveAvailability);

export default router;
