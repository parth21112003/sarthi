/**
 * ==============================================================================
 * SESSION NOTE ROUTES (src/routes/session-note.routes.js)
 * ==============================================================================
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createNote,
  getNoteByMeeting,
  updateNote,
  listMyNotes,
  listStudentNotes,
} from '../controllers/session-note.controller.js';

const router = express.Router();

router.use(authenticate);

router.post('/', createNote);
router.get('/meeting/:meetingId', getNoteByMeeting);
router.put('/:id', updateNote);
router.get('/mine', listMyNotes);
router.get('/student', listStudentNotes);

export default router;
