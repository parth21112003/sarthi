/**
 * ==============================================================================
 * AUTHENTICATION ROUTES (src/routes/auth.routes.js)
 * ==============================================================================
 * Route Base Prefix: `/api/auth`
 * 
 * ENDPOINTS:
 * - POST /api/auth/register : Register new student or counselor account
 * - POST /api/auth/login    : Login and receive access token + refresh cookie
 * - POST /api/auth/refresh  : Issue new access token using refresh cookie
 * - POST /api/auth/logout   : Clear session cookie and erase DB refresh token
 * - GET  /api/auth/me       : Get current authenticated user profile
 * ==============================================================================
 */

import express from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, refresh, logout, getMe } from '../controllers/auth.controller.js';
import { registerValidation, loginValidation } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: { error: 'Too many attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = express.Router();

// Public: Account registration with input validation middleware
router.post('/register', authLimiter, registerValidation, register);

// Public: Account login with validation middleware
router.post('/login', authLimiter, loginValidation, login);

// Public: Session token refresh using httpOnly cookie
router.post('/refresh', refresh);

// Public: Logout session and clear refresh cookie
router.post('/logout', logout);

// Protected: Get current authenticated user profile (requires valid Access Token)
router.get('/me', authenticate, getMe);

export default router;
