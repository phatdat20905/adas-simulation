import { Server } from 'socket.io';

let io;

/**
 * Khởi tạo socket.io
 */
const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    socket.on('join', (userId) => {
      socket.join(userId);
      socket.userId = userId;
      console.log(`📡 User ${userId} joined with socket ${socket.id}`);
    });

    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id, socket.userId || '');
    });
  });

  return io;
};

/**
 * Lấy instance io để dùng trong controller/service
 */
export const getIo = () => {
  if (!io) throw new Error('❌ Socket.io chưa được khởi tạo');
  return io;
};

/**
 * Emit alert realtime tới client
 */
export const emitAlert = (userId, alert) => {
  if (io) {
    io.to(userId).emit('newAlert', alert);
    console.log(`🚨 Gửi alert tới user ${userId}:`, alert);
  }
};

export default initSocket;
