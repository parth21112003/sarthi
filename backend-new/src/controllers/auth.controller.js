/**
 * ==============================================================================
 * AUTHENTICATION CONTROLLER (src/controllers/auth.controller.js)
 * ==============================================================================
 * Manages user accounts, credentials, and token-based sessions.
 * 
 * ENDPOINTS MANAGED:
 * - POST /api/auth/register : Register student or counselor account
 * - POST /api/auth/login    : Authenticate user & issue tokens
 * - POST /api/auth/refresh  : Issue new Access Token via httpOnly Refresh Cookie
 * - POST /api/auth/logout   : Clear session cookie & erase DB refresh token
 * - GET  /api/auth/me       : Return current authenticated user profile
 * ==============================================================================
 */

import bcrypt from 'bcrypt';
import prisma from '../config/prisma.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';

const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';

const getRefreshTokenCookieOptions = () => ({
  httpOnly: true,
  sameSite: isProduction ? 'none' : 'lax',
  secure: isProduction,
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

/**
 * Register User Endpoint Controller
 * 
 * FLOW:
 * 1. Checks if email is already taken. Returns 400 Bad Request if so.
 * 2. Hashes plain password using bcrypt (12 cost factor rounds).
 * 3. Normalizes role ('counselor' vs 'student').
 * 4. Inserts new User record into PostgreSQL database via Prisma.
 * 5. Generates short-lived Access Token (15m) and long-lived Refresh Token (7d).
 * 6. Stores Refresh Token in database for session rotation/invalidation.
 * 7. Sets Refresh Token as `httpOnly`, `sameSite: lax` cookie on response.
 * 8. Returns HTTP 201 Created with `{ accessToken, user }` (stripping out password).
 */
export const register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role,
      mobile,
      gender,
      stream,
      bio,
      specialization,
      experience,
    } = req.body;

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Check for existing user with same email
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // 2. Hash raw password with salt rounds = 12
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Normalize role spelling variant
    const normalizedRole = role === 'counsellor' ? 'counselor' : role;

    // 3. Insert user record into DB
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: normalizedRole,
        mobile: mobile || null,
        gender: gender || null,
        stream: stream || null,
        bio: bio || null,
        specialization: normalizedRole === 'counselor' ? specialization || null : null,
        experience: normalizedRole === 'counselor' && experience ? Number(experience) : 0,
      },
    });

    // 4. Generate JWT token pair
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // 5. Store refresh token in user record
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    // 6. Deliver refresh token in httpOnly cookie
    res.cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions());

    // 7. Sanitize output object (omit password & refresh token)
    const { password: _, refreshToken: __, ...userData } = user;
    res.status(201).json({ accessToken, user: userData });
  } catch (error) {
    next(error);
  }
};

/**
 * Login Endpoint Controller
 * 
 * FLOW:
 * 1. Finds user by email in database.
 * 2. Compares plain password with hashed password via `bcrypt.compare()`.
 * 3. Returns HTTP 401 Unauthorized if email not found or password fails match.
 * 4. Generates new Access & Refresh tokens.
 * 5. Updates stored refresh token in DB and sets HTTP cookie.
 * 6. Returns HTTP 200 OK with `{ accessToken, user }`.
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Fetch user by email
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 2. Validate password match
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 3. Issue new tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // 4. Update session token in DB
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    // 5. Set refresh cookie
    res.cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions());

    // 6. Respond with sanitized user data & access token
    const { password: _, refreshToken: __, ...userData } = user;
    res.json({ accessToken, user: userData });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh Token Endpoint Controller
 * 
 * FLOW:
 * 1. Reads `refreshToken` cookie from `req.cookies`.
 * 2. Verifies token validity via `verifyRefreshToken()`.
 * 3. Checks if database record matches cookie token (token rotation check).
 * 4. Issues a fresh short-lived Access Token (15m).
 * 5. Returns HTTP 200 OK with `{ accessToken, user }`.
 */
export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token provided' });
    }

    // Decode & verify cookie token
    const decoded = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    // Verify user exists and DB token matches cookie
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Issue new access token
    const accessToken = generateAccessToken(user);
    const { password: _, refreshToken: __, ...userData } = user;
    res.json({ accessToken, user: userData });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout Endpoint Controller
 * 
 * FLOW:
 * 1. Reads refresh cookie.
 * 2. Clears stored `refreshToken` in DB (sets to null).
 * 3. Clears httpOnly cookie on response client (`res.clearCookie`).
 * 4. Returns HTTP 200 OK message.
 */
export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      let decoded = null;
      try {
        decoded = verifyRefreshToken(refreshToken);
      } catch {
        decoded = null;
      }

      if (decoded) {
        // Invalidate DB token
        await prisma.user.update({
          where: { id: decoded.id },
          data: { refreshToken: null },
        });
      }
    }

    // Remove HTTP cookie from client
    res.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: isProduction ? 'none' : 'lax',
      secure: isProduction,
    });
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Current User Profile Controller (`GET /api/auth/me`)
 * Protected route (requires `authenticate` middleware).
 * Returns fresh authenticated user object based on `req.user.id`.
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, name: true, email: true, role: true, avatar: true,
        bio: true, stream: true, experience: true, specialization: true,
        rating: true, totalRatings: true, createdAt: true
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
