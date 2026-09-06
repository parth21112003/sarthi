/**
 * ==============================================================================
 * SESSION NOTE CONTROLLER (src/controllers/session-note.controller.js)
 * ==============================================================================
 * Manages counselor documentation, recommendations, and action plans for
 * completed counseling meetings.
 * ==============================================================================
 */

import prisma from '../config/prisma.js';

/**
 * Create or save Session Note (POST /api/session-notes)
 * Counselor-only. Meeting must be completed and owned by the counselor.
 */
export const createNote = async (req, res, next) => {
  try {
    const { meetingId, content } = req.body;

    if (!meetingId || !content?.trim()) {
      return res.status(400).json({ error: 'Meeting ID and note content are required' });
    }

    const meeting = await prisma.meeting.findUnique({
      where: { id: Number(meetingId) },
      include: { counselor: true, student: true, sessionNote: true },
    });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    if (meeting.counselorId !== req.user.id) {
      return res.status(403).json({ error: 'Only the assigned counselor can add session notes' });
    }

    if (meeting.status !== 'completed') {
      return res.status(400).json({ error: 'Session notes can only be added to completed meetings' });
    }

    if (meeting.sessionNote) {
      return res.status(409).json({ error: 'Session note already exists for this meeting. Please update it instead.' });
    }

    const note = await prisma.sessionNote.create({
      data: {
        meetingId: Number(meetingId),
        authorId: req.user.id,
        content: content.trim(),
      },
      include: {
        meeting: {
          select: {
            id: true,
            date: true,
            startTime: true,
            endTime: true,
            topic: true,
            student: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
      },
    });

    res.status(201).json({ note });
  } catch (error) {
    next(error);
  }
};

/**
 * Get note by Meeting ID (GET /api/session-notes/meeting/:meetingId)
 * Accessible by both the participating counselor and student.
 */
export const getNoteByMeeting = async (req, res, next) => {
  try {
    const meetingId = Number(req.params.meetingId);

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        sessionNote: {
          include: {
            author: { select: { id: true, name: true, avatar: true, specialization: true } },
          },
        },
      },
    });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    if (meeting.counselorId !== req.user.id && meeting.studentId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view notes for this session' });
    }

    res.json({ note: meeting.sessionNote || null });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Session Note (PUT /api/session-notes/:id)
 * Counselor author only.
 */
export const updateNote = async (req, res, next) => {
  try {
    const noteId = Number(req.params.id);
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ error: 'Note content cannot be empty' });
    }

    const note = await prisma.sessionNote.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      return res.status(404).json({ error: 'Session note not found' });
    }

    if (note.authorId !== req.user.id) {
      return res.status(403).json({ error: 'Only the author can edit this note' });
    }

    const updated = await prisma.sessionNote.update({
      where: { id: noteId },
      data: { content: content.trim() },
      include: {
        meeting: {
          select: {
            id: true,
            date: true,
            startTime: true,
            endTime: true,
            topic: true,
            student: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
      },
    });

    res.json({ note: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * List Counselor's Session Notes (GET /api/session-notes/mine)
 * Counselor-only.
 */
export const listMyNotes = async (req, res, next) => {
  try {
    const notes = await prisma.sessionNote.findMany({
      where: { authorId: req.user.id },
      include: {
        meeting: {
          select: {
            id: true,
            date: true,
            startTime: true,
            endTime: true,
            topic: true,
            student: { select: { id: true, name: true, email: true, avatar: true, stream: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ notes });
  } catch (error) {
    next(error);
  }
};

/**
 * List Student's Session Notes (GET /api/session-notes/student)
 * Student-only.
 */
export const listStudentNotes = async (req, res, next) => {
  try {
    const notes = await prisma.sessionNote.findMany({
      where: {
        meeting: {
          studentId: req.user.id,
        },
      },
      include: {
        author: { select: { id: true, name: true, avatar: true, specialization: true } },
        meeting: {
          select: {
            id: true,
            date: true,
            startTime: true,
            endTime: true,
            topic: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ notes });
  } catch (error) {
    next(error);
  }
};
