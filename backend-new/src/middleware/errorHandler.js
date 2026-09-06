/**
 * ==============================================================================
 * GLOBAL ERROR HANDLING MIDDLEWARE (src/middleware/errorHandler.js)
 * ==============================================================================
 * Centralized Express error handler middleware.
 * 
 * HOW IT WORKS:
 * In Express, error handling middleware MUST take 4 arguments: `(err, req, res, next)`.
 * Whenever a controller or middleware calls `next(error)` or throws an uncaught async error,
 * Express skips all remaining routes and passes execution directly to this function.
 * 
 * SPECIAL ERROR MAPPINGS:
 * - `ValidationError` -> 400 Bad Request
 * - Prisma `P2002` (Unique Constraint Collision) -> 409 Conflict (e.g. duplicate email/rating)
 * - JWT Errors (`JsonWebTokenError` / `TokenExpiredError`) -> 401 Unauthorized
 * - Uncaught Server Errors -> 500 Internal Server Error (hides stack trace in production)
 * ==============================================================================
 */

export const errorHandler = (err, req, res, next) => {
  // Log error stack trace to server console for debugging
  console.error(err);

  // 1. Input / Form Validation Errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  // 2. Prisma Database Unique Constraint Violation (Code P2002)
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Resource already exists' });
  }

  // 3. JWT Verification or Expiration Errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // 4. Default Fallback HTTP Status & Message
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Send structured JSON error response (include stack trace only in development)
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
