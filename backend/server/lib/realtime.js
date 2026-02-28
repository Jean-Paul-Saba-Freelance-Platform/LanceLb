import { Server } from 'socket.io';
import http from 'http';
import express from 'express';

const app = express();
const server = http.createServer(app);
const userSocketMap = {};

const io = new Server(server, {
  cors: {
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

export const getReceiverSocketId = (userId) => userSocketMap[String(userId)];

io.on('connection', (socket) => {
  const userId = socket.handshake.auth?.userId;
  if (userId) {
    userSocketMap[String(userId)] = socket.id;
    io.emit('onlineUsers', Object.keys(userSocketMap));
  }

  socket.on('disconnect', () => {
    if (userId) {
      delete userSocketMap[String(userId)];
      io.emit('onlineUsers', Object.keys(userSocketMap));
    }
  });
});

export { app, server, io };
