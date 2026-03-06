import { Server } from 'socket.io';
import http from 'http';
import express from 'express';

// ---------------------------------------------------------------------------
// Express app + HTTP server
// ---------------------------------------------------------------------------

// The Express app and HTTP server are created HERE (not in server.js) so that
// Socket.IO can be attached to the same HTTP server that Express uses.
// Both are exported and consumed by server.js.
const app = express();
const server = http.createServer(app);

// ---------------------------------------------------------------------------
// Online users map
// ---------------------------------------------------------------------------

/**
 * userSocketMap — In-memory registry mapping each online user's ID (string)
 * to their Socket.IO socket ID.
 *
 * Structure: { [userId: string]: socketId: string }
 *
 * Limitations:
 *   - Not shared across processes: only works with a single Node.js instance.
 *     For horizontal scaling, replace with a Redis-backed adapter.
 *   - Not persisted: restarting the server clears all online state.
 *   - One socket per user: if a user has multiple browser tabs open, the
 *     latest connection overwrites the previous one.
 */
const userSocketMap = {};

// ---------------------------------------------------------------------------
// Socket.IO server
// ---------------------------------------------------------------------------

const io = new Server(server, {
    cors: {
        // Mirror the same CORS policy used by the Express app in server.js:
        //   - Production: allow only the configured FRONTEND_URL
        //   - Development: allow any localhost origin so Vite dev server works
        origin: (origin, callback) => {
            if (process.env.NODE_ENV === 'production') {
                callback(null, process.env.FRONTEND_URL || false);
                return;
            }
            if (!origin || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
                callback(null, true);
                return;
            }
            callback(null, false);
        },
        credentials: true,
    },
});

// ---------------------------------------------------------------------------
// Exported helper — look up a user's active socket ID
// ---------------------------------------------------------------------------

/**
 * getReceiverSocketId — Returns the socket ID for the given userId, or
 * undefined if the user is not currently connected.
 *
 * Used by controllers to push real-time events to a specific user without
 * broadcasting to everyone.
 */
export const getReceiverSocketId = (userId) => userSocketMap[String(userId)];

// ---------------------------------------------------------------------------
// Connection lifecycle
// ---------------------------------------------------------------------------

io.on('connection', (socket) => {
    const userId = socket.handshake.auth?.userId;

    if (userId) {
        // Register the user as online and join their personal room.
        // The personal room (`user:<id>`) allows other parts of the system to
        // target this user by ID rather than by socket ID (more stable across
        // reconnects, though we also keep the socket ID map for direct lookups).
        userSocketMap[String(userId)] = socket.id;
        socket.join(`user:${String(userId)}`);

        // Broadcast the updated online users list to ALL connected clients
        // so the frontend can show accurate presence indicators
        io.emit('onlineUsers', Object.keys(userSocketMap));
    }

    // ── Crew room management ────────────────────────────────────────────────
    //
    // Crew chats use Socket.IO rooms so a single emit reaches all viewers of
    // that crew without iterating over individual socket IDs.
    //
    // The frontend calls joinCrew when the user opens a crew chat and
    // leaveCrew when they switch away. This keeps the room membership tight
    // and avoids delivering messages to users who aren't actively viewing.

    socket.on('joinCrew', ({ crewId }) => {
        if (!crewId) return;
        socket.join(`crew:${String(crewId)}`);
    });

    socket.on('leaveCrew', ({ crewId }) => {
        if (!crewId) return;
        socket.leave(`crew:${String(crewId)}`);
    });

    // ── Disconnect cleanup ──────────────────────────────────────────────────

    socket.on('disconnect', () => {
        if (userId) {
            // Remove the user from the online map and notify all clients
            delete userSocketMap[String(userId)];
            io.emit('onlineUsers', Object.keys(userSocketMap));
        }
        // Socket.IO automatically removes the socket from all rooms on disconnect,
        // so no manual leaveCrew cleanup is needed here.
    });
});

export { app, server, io };
