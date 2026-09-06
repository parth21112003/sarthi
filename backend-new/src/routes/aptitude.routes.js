/**
 * ==============================================================================
 * APTITUDE TEST ROUTES (src/routes/aptitude.routes.js)
 * ==============================================================================
 * Route Base Prefix: `/api/aptitude`
 * 
 * ENDPOINTS:
 * - GET  /api/aptitude/questions: Get aptitude test questions (scores omitted)
 * - GET  /api/aptitude/results  : Get past aptitude evaluation results
 * - POST /api/aptitude/submit   : Submit completed aptitude test for scoring
 * ==============================================================================
 */

import express from 'express';
import { getQuestions, listResults, submitAptitude } from '../controllers/aptitude.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Protected: Get aptitude questions (scores hidden)
router.get('/questions', authenticate, getQuestions);

// Protected: Get past test results history
router.get('/results', authenticate, listResults);

// Protected: Submit completed test for evaluation & recommendation
router.post('/submit', authenticate, submitAptitude);

export default router;
