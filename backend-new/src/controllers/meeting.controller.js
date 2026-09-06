/**
 * ==============================================================================
 * MEETING / SESSION CONTROLLER (src/controllers/meeting.controller.js)
 * ==============================================================================
 * Manages career counseling session requests, status updates (pending, accepted,
 * rejected, completed, cancelled), conflict checking, and session metrics.
 * ==============================================================================
 */

import prisma from '../config/prisma.js';
import { createNotification } from '../services/notification.service.js';

// Summary fields for embedded user queries
const userSummary = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  stream: true,
  specialization: true,
};

// Include student and counselor details in meeting queries
const meetingInclude = {
  student: { select: userSummary },
  counselor: { select: userSummary },
};

// Status definitions
const activeStatuses = ['pending', 'accepted'];
const counselorStatuses = ['accepted', 'rejected', 'completed', 'cancelled'];

/**
 * List User Meetings (`GET /api/meetings`)
 * Returns meetings for the current user.
 * - If counselor: filters by `counselorId = req.user.id`
 * - If student: filters by `studentId = req.user.id`
 */
export const listMyMeetings = async (req, res, next) => {
  try {
    const where = req.user.role === 'counselor'
      ? { counselorId: req.user.id }
      : { studentId: req.user.id };

    const meetings = await prisma.meeting.findMany({
      where,
      include: meetingInclude,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    res.json({ meetings });
  } catch (error) {
    next(error);
  }
};

/**
 * Book a New Meeting Session (`POST /api/meetings`)
 * Protected route (Student only).
 * 
 * FLOW:
 * 1. Verifies `req.user.role === 'student'`.
 * 2. Checks required fields (counselorId, date, startTime, endTime).
 * 3. Verifies counselor exists in database.
 * 4. Checks for schedule conflicts (existing active meeting for counselor at same time).
 * 5. Inserts new Meeting record with status `'pending'`.
 * 6. Triggers notification to counselor via `createNotification()`.
 */
export const createMeeting = async (req, res, next) => {
  try {
    // 1. Role Authorization
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can book meetings' });
    }

    const { counselorId, date, startTime, endTime, topic, notes } = req.body;

    // 2. Input validation
    if (!counselorId || !date || !startTime || !endTime) {
      return res.status(400).json({ error: 'Counselor, date, start time, and end time are required' });
    }

    if (startTime >= endTime) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    // 2. Validate date is not in the past
    const [year, month, day] = date.split('-').map(Number);
    const [startH, startM] = startTime.split(':').map(Number);
    const meetingDateTime = new Date(year, month - 1, day, startH, startM);
    if (meetingDateTime < new Date()) {
      return res.status(400).json({ error: 'Cannot book meetings in the past' });
    }

    // 3. Verify counselor existence
    const counselor = await prisma.user.findFirst({
      where: { id: Number(counselorId), role: 'counselor' },
      select: { id: true, name: true },
    });

    if (!counselor) {
      return res.status(404).json({ error: 'Counselor not found' });
    }

    // 4. Strict Availability Slot Validation
    const requestedDay = new Date(year, month - 1, day).getDay();
    const matchingSlot = await prisma.availabilitySlot.findFirst({
      where: {
        counselorId: Number(counselorId),
        dayOfWeek: requestedDay,
        startTime,
        endTime,
        isActive: true,
      },
    });

    if (!matchingSlot) {
      return res.status(400).json({
        error: 'The counselor is not available during the selected slot. Please pick an open slot from their schedule.',
      });
    }

    // 5. Check if Student already has another active meeting at this time
    const studentConflict = await prisma.meeting.findFirst({
      where: {
        studentId: req.user.id,
        date,
        status: { in: activeStatuses },
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } },
        ],
      },
    });

    if (studentConflict) {
      return res.status(409).json({ error: 'You already have another meeting scheduled at this time' });
    }

    // 6. Schedule Conflict Check for counselor
    const conflict = await prisma.meeting.findFirst({
      where: {
        counselorId: Number(counselorId),
        date,
        status: { in: activeStatuses },
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } },
        ],
      },
    });

    if (conflict) {
      return res.status(409).json({ error: 'Counselor already has a booked session at this time' });
    }

    // 7. Generate a secure meetingLink room ID
    const meetingRoomId = `room-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // 8. Create Meeting Record
    const meeting = await prisma.meeting.create({
      data: {
        studentId: req.user.id,
        counselorId: Number(counselorId),
        date,
        startTime,
        endTime,
        topic: topic || null,
        notes: notes || null,
        status: 'pending',
        meetingLink: meetingRoomId,
      },
      include: meetingInclude,
    });

    // 9. Push Notification to Counselor
    await createNotification({
      userId: Number(counselorId),
      title: 'New meeting request',
      message: `${meeting.student.name} requested a session on ${date} at ${startTime}.`,
      type: 'meeting_request',
      link: '/counselor/meetings',
    });

    res.status(201).json({ meeting });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Meeting Status (`PATCH /api/meetings/:id/status`)
 * Allows status transitions: 'accepted', 'rejected', 'completed', 'cancelled'.
 * - Counselors can transition to any status.
 * - Students can only set status to 'cancelled' for their own meetings.
 * Sends notification to the opposing party.
 */
export const updateMeetingStatus = async (req, res, next) => {
  try {
    const meetingId = Number(req.params.id);
    const { status } = req.body;

    if (!counselorStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid meeting status' });
    }

    // Fetch existing meeting
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: meetingInclude,
    });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Ownership & permission validation
    const isCounselorOwner = req.user.role === 'counselor' && meeting.counselorId === req.user.id;
    const isStudentOwnerCancelling = req.user.role === 'student'
      && meeting.studentId === req.user.id
      && status === 'cancelled';

    if (!isCounselorOwner && !isStudentOwnerCancelling) {
      return res.status(403).json({ error: 'You cannot update this meeting' });
    }

    // State transition validation
    const allowedTransitions = {
      pending: ['accepted', 'rejected', 'cancelled'],
      accepted: ['completed', 'cancelled'],
      rejected: [],
      completed: [],
      cancelled: [],
    };

    const allowed = allowedTransitions[meeting.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Cannot change status from '${meeting.status}' to '${status}'` });
    }

    // Perform database status update
    const updatedMeeting = await prisma.meeting.update({
      where: { id: meetingId },
      data: { status },
      include: meetingInclude,
    });

    // Determine target recipient for notification
    const targetUserId = req.user.role === 'counselor'
      ? meeting.studentId
      : meeting.counselorId;

    // Send push notification to target user
    await createNotification({
      userId: targetUserId,
      title: 'Meeting updated',
      message: `Your meeting with ${req.user.role === 'counselor' ? meeting.counselor.name : meeting.student.name} is now ${status}.`,
      type: 'meeting_response',
      link: req.user.role === 'counselor' ? '/student/meetings' : '/counselor/meetings',
    });

    res.json({ meeting: updatedMeeting });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Meeting Summary Statistics (`GET /api/meetings/stats`)
 * Computes counts for total, pending, accepted, and completed sessions
 * in parallel using `Promise.all()`.
 */
export const getMeetingStats = async (req, res, next) => {
  try {
    const where = req.user.role === 'counselor'
      ? { counselorId: req.user.id }
      : { studentId: req.user.id };

    // Execute 4 database count queries in parallel
    const [total, pending, accepted, completed] = await Promise.all([
      prisma.meeting.count({ where }),
      prisma.meeting.count({ where: { ...where, status: 'pending' } }),
      prisma.meeting.count({ where: { ...where, status: 'accepted' } }),
      prisma.meeting.count({ where: { ...where, status: 'completed' } }),
    ]);

    res.json({
      stats: {
        total,
        pending,
        accepted,
        completed,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Video Call Room Details (GET /api/meetings/:id/room)
 * Verifies caller is student or counselor of this meeting and meeting is accepted/completed.
 */
export const getMeetingRoom = async (req, res, next) => {
  try {
    const meetingId = Number(req.params.id);
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: meetingInclude,
    });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    if (meeting.studentId !== req.user.id && meeting.counselorId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to join this meeting room' });
    }

    if (!['accepted', 'completed'].includes(meeting.status)) {
      return res.status(400).json({ error: `Cannot join video call for a meeting with status '${meeting.status}'` });
    }

    // If meetingLink is missing, generate one
    let roomId = meeting.meetingLink;
    if (!roomId) {
      roomId = `room-${meeting.id}-${Math.random().toString(36).substring(2, 9)}`;
      await prisma.meeting.update({
        where: { id: meeting.id },
        data: { meetingLink: roomId },
      });
    }

    res.json({
      roomId,
      meeting: {
        id: meeting.id,
        date: meeting.date,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        topic: meeting.topic,
        student: meeting.student,
        counselor: meeting.counselor,
      },
    });
  } catch (error) {
    next(error);
  }
};

