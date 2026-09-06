/**
 * ==============================================================================
 * COUNSELOR CONTROLLER (src/controllers/counselor.controller.js)
 * ==============================================================================
 * Manages counselor directory browsing, detailed profile inspection with reviews,
 * and counselor schedule availability management.
 * ==============================================================================
 */

import prisma from '../config/prisma.js';
import { getRecommendedCounselors, computeCompatibility } from '../services/matching.service.js';

// Standard field selection for counselor public listings
const counselorSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  bio: true,
  stream: true,
  gender: true,
  experience: true,
  specialization: true,
  rating: true,
  totalRatings: true,
  createdAt: true,
};

// Utility to check non-empty string input
const hasText = (value) => typeof value === 'string' && value.trim().length > 0;

/**
 * List / Search Counselors (`GET /api/counselors`)
 * Supports query parameters:
 * - `stream`: Filter by stream or specialization
 * - `search`: Fuzzy search across name, email, bio, or specialization
 * - `minRating`: Minimum rating filter (e.g. 4)
 * - `minExperience`: Minimum years of experience (e.g. 5)
 * - `sortBy`: 'rating' | 'experience' | 'reviews' | 'name'
 */
export const listCounselors = async (req, res, next) => {
  try {
    const { search, stream, minRating, minExperience, sortBy } = req.query;
    const filters = [{ role: 'counselor' }];

    // Filter by academic stream or specialization
    if (hasText(stream)) {
      const value = stream.trim();
      filters.push({
        OR: [
          { stream: { contains: value, mode: 'insensitive' } },
          { specialization: { contains: value, mode: 'insensitive' } },
        ],
      });
    }

    // Filter by general search string
    if (hasText(search)) {
      const value = search.trim();
      filters.push({
        OR: [
          { name: { contains: value, mode: 'insensitive' } },
          { email: { contains: value, mode: 'insensitive' } },
          { bio: { contains: value, mode: 'insensitive' } },
          { specialization: { contains: value, mode: 'insensitive' } },
        ],
      });
    }

    if (minRating && !isNaN(minRating)) {
      filters.push({ rating: { gte: Number(minRating) } });
    }

    if (minExperience && !isNaN(minExperience)) {
      filters.push({ experience: { gte: Number(minExperience) } });
    }

    let orderBy = [{ rating: 'desc' }, { totalRatings: 'desc' }, { name: 'asc' }];
    if (sortBy === 'experience') {
      orderBy = [{ experience: 'desc' }, { rating: 'desc' }];
    } else if (sortBy === 'reviews') {
      orderBy = [{ totalRatings: 'desc' }, { rating: 'desc' }];
    } else if (sortBy === 'name') {
      orderBy = [{ name: 'asc' }];
    }

    // Execute query with combined AND filters
    const counselors = await prisma.user.findMany({
      where: { AND: filters },
      select: counselorSelect,
      orderBy,
    });

    res.json({ counselors });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Recommended Counselors for Student (GET /api/counselors/recommended)
 */
export const getRecommended = async (req, res, next) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students receive personalized recommendations' });
    }

    const limit = Number(req.query.limit) || 6;
    const recommended = await getRecommendedCounselors(req.user.id, limit);

    res.json({ counselors: recommended });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Detailed Counselor Profile (`GET /api/counselors/:id`)
 * Fetches counselor details along with:
 * 1. Active weekly availability schedule slots.
 * 2. Top 5 most recent student ratings & reviews.
 */
export const getCounselor = async (req, res, next) => {
  try {
    const counselorId = Number(req.params.id);
    const counselor = await prisma.user.findFirst({
      where: { id: counselorId, role: 'counselor' },
      select: {
        ...counselorSelect,
        // Include active availability schedule slots
        availabilitySlots: {
          where: { isActive: true },
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
        // Include top 5 recent student reviews
        ratingsReceived: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            score: true,
            review: true,
            createdAt: true,
            student: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
      },
    });

    if (!counselor) {
      return res.status(404).json({ error: 'Counselor not found' });
    }

    res.json({ counselor });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Counselor Schedule Slots (`GET /api/counselors/:id/availability`)
 * Returns active availability slots for a specific counselor.
 */
export const getAvailability = async (req, res, next) => {
  try {
    const counselorId = Number(req.params.id);
    const slots = await prisma.availabilitySlot.findMany({
      where: { counselorId, isActive: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    res.json({ slots });
  } catch (error) {
    next(error);
  }
};

/**
 * Save Counselor Availability Slots (`PUT /api/counselors/me/availability`)
 * Protected route (Counselor only).
 * Replaces existing schedule slots with new active time slots using a Prisma Transaction (`$transaction`).
 */
export const saveAvailability = async (req, res, next) => {
  try {
    if (req.user.role !== 'counselor') {
      return res.status(403).json({ error: 'Only counselors can update availability' });
    }

    const slots = Array.isArray(req.body.slots) ? req.body.slots : [];
    const validTime = /^([01]\d|2[0-3]):[0-5]\d$/; // Format "HH:MM"

    // Filter and sanitize incoming slot array
    const normalizedSlots = slots
      .filter((slot) => {
        return Number.isInteger(Number(slot.dayOfWeek))
          && Number(slot.dayOfWeek) >= 0
          && Number(slot.dayOfWeek) <= 6
          && validTime.test(slot.startTime)
          && validTime.test(slot.endTime)
          && slot.startTime < slot.endTime;
      })
      .map((slot) => ({
        counselorId: req.user.id,
        dayOfWeek: Number(slot.dayOfWeek),
        startTime: slot.startTime,
        endTime: slot.endTime,
        isActive: true,
      }));

    // Atomic Transaction: Wipe old slots and bulk-insert new valid slots
    await prisma.$transaction([
      prisma.availabilitySlot.deleteMany({ where: { counselorId: req.user.id } }),
      ...(normalizedSlots.length
        ? [prisma.availabilitySlot.createMany({ data: normalizedSlots })]
        : []),
    ]);

    // Return updated availability slots
    const savedSlots = await prisma.availabilitySlot.findMany({
      where: { counselorId: req.user.id, isActive: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    res.json({ slots: savedSlots });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Counselor Booked Slots (`GET /api/counselors/:id/booked-slots`)
 * Returns booked slots for a specific counselor on a given date.
 */
export const getBookedSlots = async (req, res, next) => {
  try {
    const counselorId = Number(req.params.id);
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Date query parameter is required' });
    }

    const bookedSlots = await prisma.meeting.findMany({
      where: {
        counselorId,
        date,
        status: { in: ['pending', 'accepted'] },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    res.json({ bookedSlots });
  } catch (error) {
    next(error);
  }
};
