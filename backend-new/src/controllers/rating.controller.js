/**
 * ==============================================================================
 * RATING & REVIEWS CONTROLLER (src/controllers/rating.controller.js)
 * ==============================================================================
 * Manages student ratings (1-5 score & text review) for counselors per meeting.
 * ==============================================================================
 */

import prisma from '../config/prisma.js';
import { createNotification } from '../services/notification.service.js';

// Projection fields for rating queries
const ratingInclude = {
  student: {
    select: {
      id: true,
      name: true,
      avatar: true,
    },
  },
  counselor: {
    select: {
      id: true,
      name: true,
      rating: true,
      totalRatings: true,
    },
  },
  meeting: {
    select: {
      id: true,
      date: true,
      topic: true,
    },
  },
};

/**
 * Helper: Recalculates average rating and total ratings for a counselor
 * using Prisma Aggregation (_avg & _count).
 */
const recalculateCounselorRating = async (counselorId) => {
  const aggregate = await prisma.rating.aggregate({
    where: { counselorId },
    _avg: { score: true },
    _count: { score: true },
  });

  return prisma.user.update({
    where: { id: counselorId },
    data: {
      rating: aggregate._avg.score ? Math.round(aggregate._avg.score * 10) / 10 : 0,
      totalRatings: aggregate._count.score || 0,
    },
  });
};

/**
 * Rate Counselor Endpoint (POST /api/ratings)
 * Protected route (Student only).
 * Per-meeting rating: links directly to completed meeting.
 */
export const rateCounselor = async (req, res, next) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can rate counselors' });
    }

    const counselorId = Number(req.body.counselorId);
    const meetingId = req.body.meetingId ? Number(req.body.meetingId) : null;
    const score = Number(req.body.score);
    const review = typeof req.body.review === 'string' ? req.body.review.trim() : '';

    if (!counselorId || !Number.isInteger(score) || score < 1 || score > 5) {
      return res.status(400).json({ error: 'Counselor and a score from 1 to 5 are required' });
    }

    // If meetingId provided, verify that meeting is completed and owned by student
    if (meetingId) {
      const meeting = await prisma.meeting.findUnique({
        where: { id: meetingId },
        include: { rating: true },
      });

      if (!meeting) {
        return res.status(404).json({ error: 'Meeting not found' });
      }

      if (meeting.studentId !== req.user.id || meeting.counselorId !== counselorId) {
        return res.status(403).json({ error: 'Not authorized to rate this meeting' });
      }

      if (meeting.status !== 'completed') {
        return res.status(400).json({ error: 'You can only rate a session after it is marked completed' });
      }

      if (meeting.rating) {
        // Update existing rating for this meeting
        const updated = await prisma.rating.update({
          where: { id: meeting.rating.id },
          data: { score, review: review || null },
          include: ratingInclude,
        });

        const counselor = await recalculateCounselorRating(counselorId);

        return res.json({
          rating: updated,
          counselor: {
            id: counselor.id,
            rating: counselor.rating,
            totalRatings: counselor.totalRatings,
          },
        });
      }
    } else {
      // Fallback: verify student has completed at least one meeting with this counselor
      const completedMeeting = await prisma.meeting.findFirst({
        where: {
          studentId: req.user.id,
          counselorId,
          status: 'completed',
        },
      });

      if (!completedMeeting) {
        return res.status(403).json({ error: 'You can rate after completing a meeting with this counselor' });
      }
    }

    // Create new rating record
    const rating = await prisma.rating.create({
      data: {
        counselorId,
        studentId: req.user.id,
        meetingId: meetingId || undefined,
        score,
        review: review || null,
      },
      include: ratingInclude,
    });

    // Recalculate counselor average rating
    const counselor = await recalculateCounselorRating(counselorId);

    // Notify counselor of review
    await createNotification({
      userId: counselorId,
      title: 'New review received',
      message: `${rating.student.name} rated your counselling session ${score}/5.`,
      type: 'rating',
      link: '/counselor/dashboard',
    });

    res.status(201).json({
      rating,
      counselor: {
        id: counselor.id,
        rating: counselor.rating,
        totalRatings: counselor.totalRatings,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List Counselor Reviews (GET /api/ratings/counselor/:counselorId)
 * Fetches ratings, reviews, and rating breakdown histogram.
 */
export const listCounselorRatings = async (req, res, next) => {
  try {
    const counselorId = Number(req.params.counselorId);
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [ratings, totalCount, scoreCounts] = await Promise.all([
      prisma.rating.findMany({
        where: { counselorId },
        include: ratingInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.rating.count({ where: { counselorId } }),
      prisma.rating.groupBy({
        by: ['score'],
        where: { counselorId },
        _count: { score: true },
      }),
    ]);

    // Build 1-5 star breakdown object
    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    scoreCounts.forEach((sc) => {
      breakdown[sc.score] = sc._count.score;
    });

    res.json({
      ratings,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      breakdown,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List Current Student's Given Reviews (GET /api/ratings/mine)
 */
export const getMyReviews = async (req, res, next) => {
  try {
    const ratings = await prisma.rating.findMany({
      where: { studentId: req.user.id },
      include: {
        counselor: {
          select: { id: true, name: true, avatar: true, specialization: true },
        },
        meeting: {
          select: { id: true, date: true, topic: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ ratings });
  } catch (error) {
    next(error);
  }
};
