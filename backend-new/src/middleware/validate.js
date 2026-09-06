/**
 * ==============================================================================
 * INPUT VALIDATION MIDDLEWARE (src/middleware/validate.js)
 * ==============================================================================
 * Uses `express-validator` to inspect incoming `req.body` data before it reaches
 * controller logic.
 * 
 * WHY VALIDATE INPUTS?
 * 1. Security: Prevents malformed or malicious data from entering the database.
 * 2. User Experience: Returns clear, actionable error messages (HTTP 400 Bad Request)
 *    when required fields are missing or incorrectly formatted.
 * ==============================================================================
 */

import { body, validationResult } from 'express-validator';

/**
 * Interceptor Middleware:
 * Evaluates validation results from express-validator chains.
 * If validation errors exist, halts execution and responds with 400 Bad Request.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * Registration Input Validation Chain:
 * - Email: Must be valid email address format.
 * - Password: Minimum 6 characters.
 * - Name: Cannot be empty.
 * - Role: Must be either 'student' or 'counselor'.
 * - Mobile: Optional, but if provided must be a valid phone number.
 * - Experience: Optional, but if provided must be an integer >= 0.
 */
export const registerValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('name').notEmpty().withMessage('Name is required'),
  body('role').isIn(['student', 'counselor', 'counsellor']).withMessage('Invalid role'),
  body('mobile').optional({ checkFalsy: true }).isMobilePhone('any').withMessage('Valid mobile number is required'),
  body('experience').optional({ checkFalsy: true }).isInt({ min: 0 }).withMessage('Experience must be a positive number'),
  handleValidationErrors,
];

/**
 * Login Input Validation Chain:
 * - Email: Must be valid email address format.
 * - Password: Required field.
 */
export const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];
