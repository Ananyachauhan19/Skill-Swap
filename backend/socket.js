const User = require('./models/User');

module.exports = (io) => {
  // Store session rooms
  const sessionRooms = new Map();

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // Register user with their socket ID
    socket.on('register', async (userId) => {
      console.log('[Socket Register] Received register for userId:', userId);
      if (userId) {
        const user = await User.findByIdAndUpdate(userId, { socketId: socket.id }, { new: true });
        if (user) {
          console.log(`[Socket Register] Registered socket ${socket.id} for user ${userId}`, user);
        } else {
          console.log(`[Socket Register] No user found for userId: ${userId}`);
        }
      }
    });

    // Join session room for video calling
    socket.on('join-session', ({ sessionId, userRole }) => {
      console.log(`[Join Session] Socket ${socket.id} joining session ${sessionId} as ${userRole}`);
      
      // Join the session room
      socket.join(sessionId);
      
      // Store session info
      if (!sessionRooms.has(sessionId)) {
        sessionRooms.set(sessionId, new Set());
      }
      sessionRooms.get(sessionId).add(socket.id);
      
      // Notify other users in the session that someone joined
      socket.to(sessionId).emit('user-joined', { sessionId, userRole });
      
      console.log(`[Join Session] Users in session ${sessionId}:`, sessionRooms.get(sessionId).size);
    });

    // Leave session room
    socket.on('leave-session', ({ sessionId }) => {
      console.log(`[Leave Session] Socket ${socket.id} leaving session ${sessionId}`);
      
      socket.leave(sessionId);
      
      if (sessionRooms.has(sessionId)) {
        sessionRooms.get(sessionId).delete(socket.id);
        if (sessionRooms.get(sessionId).size === 0) {
          sessionRooms.delete(sessionId);
        }
      }
      
      // Notify other users that someone left
      socket.to(sessionId).emit('user-left', { sessionId });
    });

    // WebRTC Signaling for session-based calls
    socket.on('offer', ({ sessionId, offer }) => {
      console.log(`[Offer] Forwarding offer in session ${sessionId}`);
      socket.to(sessionId).emit('offer', { sessionId, offer });
    });

    socket.on('answer', ({ sessionId, answer }) => {
      console.log(`[Answer] Forwarding answer in session ${sessionId}`);
      socket.to(sessionId).emit('answer', { sessionId, answer });
    });

    socket.on('ice-candidate', ({ sessionId, candidate }) => {
      console.log(`[ICE Candidate] Forwarding ICE candidate in session ${sessionId}`);
      socket.to(sessionId).emit('ice-candidate', { sessionId, candidate });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
      
      // Remove socket from all session rooms
      for (const [sessionId, sockets] of sessionRooms.entries()) {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            sessionRooms.delete(sessionId);
          } else {
            // Notify other users that someone left
            socket.to(sessionId).emit('user-left', { sessionId });
          }
        }
      }
      
      // Optionally: clear socketId from user here
    });

    // Legacy signaling (keeping for backward compatibility)
    socket.on('start-call', ({ to }) => {
      io.to(to).emit('call-started');
    });
  });
};
