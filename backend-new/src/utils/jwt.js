/**
 * ==============================================================================
 * JWT (JSON WEB TOKEN) UTILITIES (src/utils/jwt.js)
 * ==============================================================================
 * This module provides helper functions to sign (generate) and verify JWTs
 * using the `jsonwebtoken` package for Sarthi's dual-token authentication flow.
 * 
 * TOKEN DUAL-STRATEGY:
 * 1. ACCESS TOKEN:
 *    - Short-lived (15 minutes).
 *    - Contains user identity payload `{ id, email, role }`.
 *    - Passed by frontend in `Authorization: Bearer <token>` header for API requests.
 * 
 * 2. REFRESH TOKEN:
 *    - Long-lived (7 days).
 *    - Contains minimal payload `{ id }`.
 *    - Delivered to frontend via httpOnly cookie.
 *    - Used at `/api/auth/refresh` endpoint to issue a new access token without re-login.
 * ==============================================================================
 */

import jwt from 'jsonwebtoken';

/**
 * Generates a short-lived Access Token (15m validity).
 * @param {Object} user - The user model instance from database
 * @returns {string} Signed JWT Access Token string
 */
export const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

/**
 * Generates a long-lived Refresh Token (7d validity).
 * @param {Object} user - The user model instance from database
 * @returns {string} Signed JWT Refresh Token string
 */
export const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

/**
 * Verifies an Access Token against the JWT secret.
 * Throws an error if expired, tampered with, or invalid.
 * @param {string} token - The access token string
 * @returns {Object} Decoded payload `{ id, email, role, iat, exp }`
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Verifies a Refresh Token against the Refresh JWT secret.
 * Throws an error if expired or invalid.
 * @param {string} token - The refresh token string from cookies
 * @returns {Object} Decoded payload `{ id, iat, exp }`
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};
