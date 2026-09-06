/**
 * ==============================================================================
 * AI ROUTES (src/routes/ai.routes.js)
 * ==============================================================================
 */

import express from 'express';
import { chat, roadmap } from '../controllers/ai.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// POST /api/ai/chat - Chat with 24/7 AI Career Companion
router.post('/chat', chat);

// POST /api/ai/roadmap - Generate personalized career blueprint from aptitude results
router.post('/roadmap', roadmap);

export default router;
