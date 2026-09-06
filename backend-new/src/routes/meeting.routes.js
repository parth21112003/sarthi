/**
 * ==============================================================================
 * MEETING / COUNSELING SESSION ROUTES (src/routes/meeting.routes.js)
 * ==============================================================================
 * Route Base Prefix: `/api/meetings`
 * 
 * ENDPOINTS:
 * - GET   /api/meetings           : List user meetings (student or counselor)
 * - GET   /api/meetings/stats     : Get meeting count metrics by status
 * - POST  /api/meetings           : Request/Book a new counseling session
 * - PATCH /api/meetings/:id/status: Update status (accepted, rejected, completed, cancelled)
 * ==============================================================================
 */

import express from 'express';
import {
  createMeeting,
  getMeetingStats,
  listMyMeetings,
  updateMeetingStatus,
  getMeetingRoom,
} from '../controllers/meeting.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Protected: List meetings for current user
router.get('/', authenticate, listMyMeetings);

// Protected: Get meeting summary counts
router.get('/stats', authenticate, getMeetingStats);

// Protected: Get video call room details for a meeting
router.get('/:id/room', authenticate, getMeetingRoom);

// Protected: Request a new meeting (Student only)
router.post('/', authenticate, createMeeting);

// Protected: Update meeting status (accepted, rejected, completed, cancelled)
router.patch('/:id/status', authenticate, updateMeetingStatus);

export default router;
