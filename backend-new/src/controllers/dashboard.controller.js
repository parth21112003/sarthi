/**
 * ==============================================================================
 * DASHBOARD METRICS CONTROLLER (src/controllers/dashboard.controller.js)
 * ==============================================================================
 * Aggregates role-specific metrics and summary counters for dashboard overview screens.
 * 
 * PERFORMANCE OPTIMIZATION:
 * Uses `Promise.all()` to execute all independent database count & summary queries concurrently,
 * dramatically reducing overall HTTP response latency.
 * ==============================================================================
 */

import prisma from '../config/prisma.js';

/**
 * Get Role-Based Dashboard Summary (`GET /api/dashboard/summary`)
 * 
 * - If Counselor: Returns metrics on total sessions, pending requests, accepted sessions,
 *   completed sessions, unread incoming chat messages, forum posts, distinct student clients served,
 *   and current average rating.
 * 
 * - If Student: Returns metrics on available counselors, booked session counts by status,
 *   unread chat messages, completed aptitude tests, and forum posts.
 */
export const getDashboardSummary = async (req, res, next) => {
  try {
    // --------------------------------------------------------------------------
    // 1. COUNSELOR DASHBOARD METRICS
    // --------------------------------------------------------------------------
    if (req.user.role === 'counselor') {
      const [meetingsTotal, pendingMeetings, acceptedMeetings, completedMeetings, unreadMessages, posts, students, counselor, upcomingMeetings, ratingsBreakdown] = await Promise.all([
        prisma.meeting.count({ where: { counselorId: req.user.id } }),
        prisma.meeting.count({ where: { counselorId: req.user.id, status: 'pending' } }),
        prisma.meeting.count({ where: { counselorId: req.user.id, status: 'accepted' } }),
        prisma.meeting.count({ where: { counselorId: req.user.id, status: 'completed' } }),
        prisma.message.count({
          where: {
            senderId: { not: req.user.id },
            isRead: false,
            chat: { participants: { some: { userId: req.user.id } } },
          },
        }),
        prisma.post.count({ where: { userId: req.user.id } }),
        prisma.meeting.findMany({
          where: { counselorId: req.user.id },
          distinct: ['studentId'],
          select: { studentId: true },
        }),
        prisma.user.findUnique({
          where: { id: req.user.id },
          select: { rating: true, totalRatings: true },
        }),
        prisma.meeting.findMany({
          where: { counselorId: req.user.id, status: 'accepted' },
          orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
          take: 5,
          include: {
            student: { select: { id: true, name: true, avatar: true, stream: true } },
          },
        }),
        prisma.rating.groupBy({
          by: ['score'],
          where: { counselorId: req.user.id },
          _count: { score: true },
        }),
      ]);

      const scoreDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      ratingsBreakdown.forEach((r) => {
        scoreDist[r.score] = r._count.score;
      });

      return res.json({
        summary: {
          meetingsTotal,
          pendingMeetings,
          acceptedMeetings,
          completedMeetings,
          unreadMessages,
          posts,
          uniqueStudents: students.length,
          rating: counselor?.rating || 0,
          totalRatings: counselor?.totalRatings || 0,
          upcomingMeetings,
          scoreDist,
        },
      });
    }

    // --------------------------------------------------------------------------
    // 2. STUDENT DASHBOARD METRICS
    // --------------------------------------------------------------------------
    const [availableCounselors, meetingsTotal, pendingMeetings, acceptedMeetings, completedMeetings, unreadMessages, aptitudeTests, posts, upcomingMeetings, latestAptitude] = await Promise.all([
      prisma.user.count({ where: { role: 'counselor' } }),
      prisma.meeting.count({ where: { studentId: req.user.id } }),
      prisma.meeting.count({ where: { studentId: req.user.id, status: 'pending' } }),
      prisma.meeting.count({ where: { studentId: req.user.id, status: 'accepted' } }),
      prisma.meeting.count({ where: { studentId: req.user.id, status: 'completed' } }),
      prisma.message.count({
        where: {
          senderId: { not: req.user.id },
          isRead: false,
          chat: { participants: { some: { userId: req.user.id } } },
        },
      }),
      prisma.aptitudeResult.count({ where: { userId: req.user.id } }),
      prisma.post.count({ where: { userId: req.user.id } }),
      prisma.meeting.findMany({
        where: { studentId: req.user.id, status: 'accepted' },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        take: 5,
        include: {
          counselor: { select: { id: true, name: true, avatar: true, specialization: true } },
        },
      }),
      prisma.aptitudeResult.findFirst({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    let parsedAptitude = null;
    if (latestAptitude) {
      try {
        parsedAptitude = {
          ...latestAptitude,
          scores: JSON.parse(latestAptitude.scores),
        };
      } catch {
        parsedAptitude = latestAptitude;
      }
    }

    res.json({
      summary: {
        availableCounselors,
        meetingsTotal,
        pendingMeetings,
        acceptedMeetings,
        completedMeetings,
        unreadMessages,
        aptitudeTests,
        posts,
        upcomingMeetings,
        latestAptitude: parsedAptitude,
      },
    });
  } catch (error) {
    next(error);
  }
};
