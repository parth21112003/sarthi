/**
 * ==============================================================================
 * USER PROFILE CONTROLLER (src/controllers/user.controller.js)
 * ==============================================================================
 * Handles public profile viewing and private profile updates.
 * ==============================================================================
 */

import prisma from '../config/prisma.js';

/**
 * Get User Profile (`GET /api/users/profile/:id`)
 * Fetches user profile fields by route parameter ID.
 * Uses Prisma `select` to exclude password and refreshToken from response.
 */
export const getProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find user record by ID with explicit field selection
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true, name: true, email: true, role: true, avatar: true,
        bio: true, stream: true, gender: true, mobile: true,
        experience: true, specialization: true, rating: true,
        totalRatings: true, createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Own Profile (`PUT /api/users/profile`)
 * Protected route (`authenticate` middleware required).
 * Allows authenticated user to update their own profile attributes.
 * Conditionally updates counselor-specific fields (`experience`, `specialization`)
 * only if `req.user.role === 'counselor'`.
 */
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, bio, avatar, stream, gender, mobile, experience, specialization } = req.body;

    // Perform database update for authenticated user ID
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name, bio, avatar, stream, gender, mobile,
        // Include counselor fields conditionally
        ...(req.user.role === 'counselor' && { experience: experience !== undefined ? Number(experience) : undefined, specialization })
      },
      select: {
        id: true, name: true, email: true, role: true, avatar: true,
        bio: true, stream: true, gender: true, mobile: true,
        experience: true, specialization: true, rating: true,
        totalRatings: true, createdAt: true
      }
    });

    res.json({ user: updatedUser });
  } catch (error) {
    next(error);
  }
};
