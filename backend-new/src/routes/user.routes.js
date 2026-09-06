/**
 * ==============================================================================
 * USER PROFILE ROUTES (src/routes/user.routes.js)
 * ==============================================================================
 * Route Base Prefix: `/api/users`
 * 
 * ENDPOINTS:
 * - GET /api/users/profile/:id : Fetch public user profile by ID
 * - PUT /api/users/profile     : Update own profile details
 * ==============================================================================
 */

import express from 'express';
import { getProfile, updateProfile } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Protected: Get user profile by ID
router.get('/profile/:id', authenticate, getProfile);

// Protected: Update authenticated user's profile
router.put('/profile', authenticate, updateProfile);

export default router;
