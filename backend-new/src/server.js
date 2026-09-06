/**
 * ==============================================================================
 * SARTHI BACKEND API - MAIN SERVER ENTRY POINT (server.js)
 * ==============================================================================
 * This is the root file that bootstraps the entire backend application.
 * 
 * WHAT THIS FILE DOES:
 * 1. Loads environment variables from `.env` via `dotenv`.
 * 2. Initializes Express application (`app`) and wraps it in a Node HTTP server (`server`).
 * 3. Configures global application middleware:
 *    - CORS (Cross-Origin Resource Sharing) to allow requests from the React frontend.
 *    - JSON body parser to read `req.body` from incoming JSON payloads.
 *    - Cookie parser to read HTTP cookies like `refreshToken` from `req.cookies`.
 * 4. Initializes Socket.IO for real-time WebSocket communication.
 * 5. Mounts feature-specific API route modules under `/api/*`.
 * 6. Adds a 404 Fallback Handler for unhandled endpoints.
 * 7. Adds a Global Error Handler middleware to catch runtime exceptions.
 * 8. Starts listening on the configured port (default: 5000).
 * ==============================================================================
 */

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import http from 'http';
import dotenv from 'dotenv';
import { corsOptions } from './config/corsOptions.js';

// Import WebSocket setup
import { setupSocket } from './socket/index.js';

// Import Central Error Handler Middleware
import { errorHandler } from './middleware/errorHandler.js';

// Import Route Handlers
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import counselorRoutes from './routes/counselor.routes.js';
import meetingRoutes from './routes/meeting.routes.js';
import chatRoutes from './routes/chat.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import communityRoutes from './routes/community.routes.js';
import aptitudeRoutes from './routes/aptitude.routes.js';
import ratingRoutes from './routes/rating.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import sessionNoteRoutes from './routes/session-note.routes.js';
import aiRoutes from './routes/ai.routes.js';

// Load environment variables from .env file into process.env
dotenv.config();

// Create Express Application Instance
const app = express();

// Wrap Express app in Node's native HTTP server (required to share the port with Socket.IO)
const server = http.createServer(app);

// ------------------------------------------------------------------------------
// 1. GLOBAL MIDDLEWARE PIPELINE
// ------------------------------------------------------------------------------

/**
 * CORS Middleware Configuration:
 * - Allows cross-origin requests from the React frontend (e.g., http://localhost:5173).
 * - `credentials: true` enables passing cookies (like httpOnly refresh token) across origins.
 */
app.use(cors(corsOptions));

/**
 * Body Parser Middleware:
 * Parses incoming requests with JSON payloads and makes data available under `req.body`.
 */
app.use(express.json());

/**
 * Cookie Parser Middleware:
 * Parses Cookie header and populates `req.cookies` object (used for JWT refresh tokens).
 */
app.use(cookieParser());

// ------------------------------------------------------------------------------
// 2. SOCKET.IO WEBSOCKET INITIALIZATION
// ------------------------------------------------------------------------------
// Attaches Socket.IO engine to the HTTP server for real-time chat & notifications
setupSocket(server);

// ------------------------------------------------------------------------------
// 3. REST API ROUTES
// ------------------------------------------------------------------------------

/**
 * Health Check Endpoint:
 * Simple route to verify server status without requiring authentication.
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'sarthi-api',
    version: '2.0.0',
  });
});

// Feature Route Mounts
app.use('/api/auth', authRoutes);                  // Registration, Login, Refresh, Logout, /me
app.use('/api/users', userRoutes);                // Profile viewing & updates
app.use('/api/counselors', counselorRoutes);      // Counselor search, details, availability
app.use('/api/meetings', meetingRoutes);          // Session booking, status updates, stats
app.use('/api/chats', chatRoutes);                // 1-on-1 messaging threads & message history
app.use('/api/notifications', notificationRoutes);// User notifications list & mark-read
app.use('/api/community', communityRoutes);        // Forum posts, comments, likes
app.use('/api/aptitude', aptitudeRoutes);        // Assessment test questions & submission
app.use('/api/ratings', ratingRoutes);            // Counselor rating & reviews
app.use('/api/dashboard', dashboardRoutes);        // Role-based dashboard summary counts
app.use('/api/session-notes', sessionNoteRoutes);  // Session notes for completed meetings
app.use('/api/ai', aiRoutes);                      // AI Companion & Assessment Roadmap generator

// ------------------------------------------------------------------------------
// 4. FALLBACK & ERROR HANDLING MIDDLEWARE
// ------------------------------------------------------------------------------

/**
 * 404 Route Not Found Handler:
 * Reached only if no previous route matched the incoming request URL.
 */
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

/**
 * Global Error Handler:
 * Must be registered LAST in the pipeline. Intercepts errors passed via `next(error)`.
 */
app.use(errorHandler);

// ------------------------------------------------------------------------------
// 5. START SERVER LISTENER
// ------------------------------------------------------------------------------
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
