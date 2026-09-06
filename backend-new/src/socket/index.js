/**
 * ==============================================================================
 * REAL-TIME COMMUNICATION ENGINE (src/socket/index.js)
 * ==============================================================================
 * Manages WebSocket connections via Socket.IO.
 * 
 * CORE FEATURES:
 * 1. SOCKET AUTHENTICATION (`io.use`): Validates incoming WebSocket connections
 *    using the JWT Access Token supplied in `socket.handshake.auth.token`.
 * 2. PERSONAL ROOMS: Automatically adds each connected user to `user:${userId}`
 *    for targeted push notifications.
 * 3. CHAT ROOMS: Enables users to join/leave `chat:${chatId}` rooms for live 1-on-1 messaging.
 * 4. PRESENCE TRACKING: Broadcasts `presence:update` (online/offline) when users connect or disconnect.
 * 5. TYPING INDICATORS: Broadcasts `chat:typing` events to active chat rooms.
 * 6. HELPER DISPATCHERS: Exports `emitToUser()` and `emitToRoom()` for REST controllers to trigger updates.
 * ==============================================================================
 */

import { verifyAccessToken } from '../utils/jwt.js';
import { Server } from 'socket.io';
import prisma from '../config/prisma.js';

// Module-level reference to the initialized Socket.IO Server instance
let ioInstance;

/**
 * Initializes Socket.IO server attached to Node's HTTP server.
 * @param {Object} server - Node HTTP server instance
 * @returns {Server} Configured Socket.IO instance
 */
export const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Map to track active connected users: userId -> socketId
  const onlineUsers = new Map();

  // ----------------------------------------------------------------------------
  // SOCKET AUTHENTICATION MIDDLEWARE
  // ----------------------------------------------------------------------------
  io.use((socket, next) => {
    try {
      // Extract JWT access token passed during socket connection handshake
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }
      
      // Verify token and attach user identity payload to socket instance
      const decoded = verifyAccessToken(token);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  // ----------------------------------------------------------------------------
  // WEBSOCKET CONNECTION LISTENER
  // ----------------------------------------------------------------------------
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.id}`);
    
    // Register user in online status map
    onlineUsers.set(socket.user.id, socket.id);

    // Join personal user notification room (user:123)
    socket.join(`user:${socket.user.id}`);

    // Broadcast online presence to all connected clients
    io.emit('presence:update', {
      userId: socket.user.id,
      status: 'online',
    });

    // Custom room subscription handlers
    socket.on('join-room', (roomId) => {
      socket.join(roomId);
    });

    socket.on('leave-room', (roomId) => {
      socket.leave(roomId);
    });

    // --------------------------------------------------------------------------
    // CHAT ROOM EVENT HANDLERS
    // --------------------------------------------------------------------------

    /**
     * `chat:join` Event:
     * Verifies that the user is a valid participant of `chatId` before allowing them to join `chat:${chatId}`.
     */
    socket.on('chat:join', async (chatId, ack) => {
      try {
        const participant = await prisma.chatParticipant.findUnique({
          where: {
            chatId_userId: {
              chatId: Number(chatId),
              userId: socket.user.id,
            },
          },
        });

        if (!participant) {
          return ack?.({ ok: false, error: 'Not a chat participant' });
        }

        socket.join(`chat:${chatId}`);
        ack?.({ ok: true });
      } catch (error) {
        ack?.({ ok: false, error: 'Could not join chat' });
      }
    });

    /**
     * `chat:leave` Event:
     * Unsubscribes socket from `chat:${chatId}` room.
     */
    socket.on('chat:leave', (chatId) => {
      socket.leave(`chat:${chatId}`);
    });

    /**
     * `chat:typing` Event:
     * Relays typing indicator to other participants in `chat:${chatId}` room.
     */
    socket.on('chat:typing', async ({ chatId, isTyping }) => {
      try {
        const participant = await prisma.chatParticipant.findUnique({
          where: {
            chatId_userId: {
              chatId: Number(chatId),
              userId: socket.user.id,
            },
          },
        });

        if (participant) {
          socket.to(`chat:${chatId}`).emit('chat:typing', {
            chatId: Number(chatId),
            userId: socket.user.id,
            isTyping: Boolean(isTyping),
          });
        }
      } catch (error) {
        console.error('chat:typing error:', error.message);
      }
    });

    // --------------------------------------------------------------------------
    // WEBRTC VIDEO CALLING SIGNALING
    // --------------------------------------------------------------------------

    /**
     * `call:initiate` Event:
     * Caller rings the target user with meetingRoomId and caller credentials.
     */
    socket.on('call:initiate', ({ targetUserId, roomId, callerName }) => {
      io.to(`user:${targetUserId}`).emit('call:incoming', {
        callerId: socket.user.id,
        callerName: callerName || socket.user.email,
        roomId,
      });
    });

    /**
     * `call:accept` Event:
     * Receiver accepts the call and joins the video room.
     */
    socket.on('call:accept', ({ callerId, roomId }) => {
      socket.join(`call:${roomId}`);
      io.to(`user:${callerId}`).emit('call:accepted', {
        receiverId: socket.user.id,
        roomId,
      });
    });

    /**
     * `call:reject` Event:
     * Receiver declines the call.
     */
    socket.on('call:reject', ({ callerId, roomId }) => {
      io.to(`user:${callerId}`).emit('call:rejected', {
        receiverId: socket.user.id,
        roomId,
      });
    });

    /**
     * `call:join-room` Event:
     * Joins WebRTC room and announces presence to existing peer.
     */
    socket.on('call:join-room', ({ roomId }) => {
      socket.join(`call:${roomId}`);
      socket.to(`call:${roomId}`).emit('call:user-joined', {
        userId: socket.user.id,
      });
    });

    /**
     * `call:signal` Event:
     * Relays WebRTC Offer, Answer, and ICE Candidates directly to the peer.
     */
    socket.on('call:signal', ({ roomId, signal }) => {
      socket.to(`call:${roomId}`).emit('call:signal', {
        signal,
        senderId: socket.user.id,
      });
    });

    /**
     * `call:end` Event:
     * Hangs up the call and notifies both parties.
     */
    socket.on('call:end', ({ roomId }) => {
      socket.leave(`call:${roomId}`);
      io.to(`call:${roomId}`).emit('call:ended', {
        userId: socket.user.id,
      });
    });

    /**
     * Disconnect Handler:
     * Removes user from online map and broadcasts offline presence update.
     */
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.id}`);
      onlineUsers.delete(socket.user.id);
      io.emit('presence:update', {
        userId: socket.user.id,
        status: 'offline',
      });
    });
  });

  ioInstance = io;
  return io;
};

// ------------------------------------------------------------------------------
// GLOBAL EMITTER HELPER FUNCTIONS (Used by Controllers & Services)
// ------------------------------------------------------------------------------

/**
 * Emits a real-time event to a specific user's personal room (`user:${userId}`).
 * @param {number} userId - Target user ID
 * @param {string} event - Event name (e.g. 'notification:new')
 * @param {Object} payload - Data object to transmit
 */
export const emitToUser = (userId, event, payload) => {
  if (!ioInstance) return;
  ioInstance.to(`user:${userId}`).emit(event, payload);
};

/**
 * Emits a real-time event to a room (e.g. `chat:${chatId}`).
 * @param {string} roomId - Target room string
 * @param {string} event - Event name (e.g. 'chat:message')
 * @param {Object} payload - Data object to transmit
 */
export const emitToRoom = (roomId, event, payload) => {
  if (!ioInstance) return;
  ioInstance.to(roomId).emit(event, payload);
};

/**
 * Retrieves global Socket.IO server instance.
 * @returns {Server} Socket.IO instance
 */
export const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.io not initialized!');
  }
  return ioInstance;
};
