/**
 * ==============================================================================
 * AUTHENTICATION & AUTHORIZATION MIDDLEWARE (src/middleware/auth.js)
 * ==============================================================================
 * This module provides route guards to protect API endpoints:
 * 1. `authenticate`: Checks for a valid JWT Access Token in the Authorization header.
 * 2. `authorize`: Enforces Role-Based Access Control (RBAC) (e.g. 'student' or 'counselor').
 * ==============================================================================
 */

import { verifyAccessToken } from '../utils/jwt.js';

/**
 * Authentication Middleware:
 * - Reads `Authorization` HTTP header (`Bearer <token>`).
 * - Verifies the token using `verifyAccessToken()`.
 * - Attaches decoded user payload `{ id, email, role }` to `req.user`.
 * - Calls `next()` to proceed to controller if valid, or returns 401 Unauthorized if invalid.
 */
export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    // Check if header exists and starts with 'Bearer '
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    // Extract raw token string after 'Bearer '
    const token = authHeader.split(' ')[1];
    
    // Verify token validity & expiration
    const decoded = verifyAccessToken(token);
    
    // Attach decoded user info to request object for downstream controllers
    req.user = decoded;
    
    // Pass control to next middleware or controller
    next();
  } catch (error) {
    // If token verification fails (expired or tampered)
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

/**
 * Authorization Middleware (Role-Based Access Control):
 * Returns a middleware function that checks if `req.user.role` is included in allowed roles.
 * 
 * @param {string[]} roles - Array of allowed roles, e.g. ['counselor'] or ['student']
 * @returns {Function} Express middleware function
 */
export const authorize = (roles = []) => {
  return (req, res, next) => {
    // Ensure req.user exists (set by authenticate) and has permitted role
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};
