const User = require('./models/User');

// Export onlineUsers at module level so it can be imported by other modules
const onlineUsers = new Map();

module.exports = (io) => {
  // Store session rooms
  const sessionRooms = new Map();

  io.on('connection', (socket) => {
    // Register user with their socket ID
    socket.on('register', async (userId) => {
      if (userId) {
        const user = await User.findByIdAndUpdate(userId, { socketId: socket.id }, { new: true });
        if (user) {
          console.log(`[Socket Register] Registered socket ${socket.id} for user ${userId}`, {
            userId: user._id,
            socketId: user.socketId,
            firstName: user.firstName
          });
        } else {
          console.log(`[Socket Register] No user found for userId: ${userId}`);
        }
      }
    });

    // When a user registers their userId after login
    socket.on('register', (userId) => {
      onlineUsers.set(userId, socket.id);
      io.emit('online-users', Array.from(onlineUsers.keys())); // broadcast online users
    });

    // Join session room for video calling
    socket.on('join-session', ({ sessionId, userRole }) => {
      // Join the session room
      socket.join(sessionId);
      
      // Store session info
      if (!sessionRooms.has(sessionId)) {
        sessionRooms.set(sessionId, new Set());
      }
      sessionRooms.get(sessionId).add(socket.id);
      
      // Notify other users in the session that someone joined
      socket.to(sessionId).emit('user-joined', { sessionId, userRole });
      
    });

    // Leave session room
    socket.on('leave-session', ({ sessionId }) => {
      
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
      socket.to(sessionId).emit('offer', { sessionId, offer });
    });

    socket.on('answer', ({ sessionId, answer }) => {
      socket.to(sessionId).emit('answer', { sessionId, answer });
    });

    socket.on('ice-candidate', ({ sessionId, candidate }) => {
      socket.to(sessionId).emit('ice-candidate', { sessionId, candidate });
    });

    socket.on('disconnect', () => {
      // Remove user from onlineUsers map
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
      // Broadcast updated online users list
      io.emit('online-users', Array.from(onlineUsers.keys()));
      
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

    // Handle request sending
    socket.on('send-session-request', ({ toUserId, fromUser }) => {
      const targetSocketId = onlineUsers.get(toUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('receive-session-request', { fromUser });
      }
    });
  });

  return { onlineUsers };
};

// Export onlineUsers for use in other modules
module.exports.onlineUsers = onlineUsers;
