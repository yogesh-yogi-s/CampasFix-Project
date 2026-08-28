const { getEnv } = require('./env');

let io;

function getAllowedOrigins() {
  const clientOrigin = getEnv('CLIENT_ORIGIN', 'http://localhost:3000');
  return clientOrigin.split(',').map((o) => o.trim()).filter(Boolean);
}

function initSocket(server) {
  const { Server } = require('socket.io');
  const allowedOrigins = getAllowedOrigins();

  io = new Server(server, {
    cors: {
      origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('join', (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined room: ${userId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

function getIO() {
  return io;
}

module.exports = {
  initSocket,
  getIO
};
