const User = require('./models/User');
const SessionRequest = require('./models/SessionRequest');
const Session = require('./models/Session');

module.exports = (io) => {
  // Store session rooms
  const sessionRooms = new Map();
  // Store online users
  const onlineUsers = new Map();
  // Store active session timers
  const sessionTimers = new Map();

  io.on('connection', (socket) => {
    // Register user with their socket ID
    socket.on('register', async (userId) => {
      if (userId) {
        const user = await User.findByIdAndUpdate(userId, { socketId: socket.id }, { new: true });
        if (user) {
          // Store userId on socket for later use
          socket.userId = userId;
          
          // Add user to online users map
          onlineUsers.set(socket.id, {
            userId: user._id,
            socketId: socket.id,
            firstName: user.firstName,
            lastName: user.lastName,
            skillsToTeach: user.skillsToTeach,
            profilePic: user.profilePic,
            rating: user.rating || 4.5, // Default rating
            status: 'Available'
          });
          
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

    // Handle session request
    socket.on('send-session-request', async (data) => {
      try {
        const { tutorId, subject, topic, subtopic, message } = data;
        const requesterId = socket.userId; // We'll need to store this when user registers

        // Find the requester's user data
        let requesterData = null;
        for (const [socketId, userData] of onlineUsers.entries()) {
          if (userData.userId.toString() === requesterId) {
            requesterData = userData;
            break;
          }
        }

        if (!requesterData) {
          socket.emit('session-request-error', { message: 'User not found' });
          return;
        }

        // Find tutor's socket ID
        let tutorSocketId = null;
        for (const [socketId, userData] of onlineUsers.entries()) {
          if (userData.userId.toString() === tutorId) {
            tutorSocketId = socketId;
            break;
          }
        }

        if (!tutorSocketId) {
          socket.emit('session-request-error', { message: 'Tutor is not online' });
          return;
        }

        // Create session request in database
        const sessionRequest = new SessionRequest({
          requester: requesterId,
          tutor: tutorId,
          subject,
          topic,
          subtopic,
          message: message || ''
        });

        await sessionRequest.save();

        // Populate user details
        await sessionRequest.populate('requester', 'firstName lastName profilePic');
        await sessionRequest.populate('tutor', 'firstName lastName profilePic');

        // Send notification to tutor
        io.to(tutorSocketId).emit('session-request-received', {
          sessionRequest,
          requester: requesterData
        });

        // Send confirmation to requester
        socket.emit('session-request-sent', {
          message: 'Session request sent successfully',
          sessionRequest
        });

        console.log(`[Session Request] Request sent from ${requesterData.firstName} to tutor ${tutorId}`);

      } catch (error) {
        console.error('[Session Request] Error:', error);
        socket.emit('session-request-error', { message: 'Failed to send session request' });
      }
    });

    // Handle session request response (approve/reject)
    socket.on('session-request-response', async (data) => {
      try {
        const { requestId, action } = data; // action: 'approve' or 'reject'
        const tutorId = socket.userId;

        const sessionRequest = await SessionRequest.findOne({
          _id: requestId,
          tutor: tutorId,
          status: 'pending'
        });

        if (!sessionRequest) {
          socket.emit('session-request-response-error', { message: 'Session request not found' });
          return;
        }

        // Update status
        sessionRequest.status = action === 'approve' ? 'approved' : 'rejected';
        await sessionRequest.save();

        // Populate user details
        await sessionRequest.populate('requester', 'firstName lastName profilePic socketId');
        await sessionRequest.populate('tutor', 'firstName lastName profilePic socketId');

        // Find requester's socket ID
        let requesterSocketId = null;
        for (const [socketId, userData] of onlineUsers.entries()) {
          if (userData.userId.toString() === sessionRequest.requester._id.toString()) {
            requesterSocketId = socketId;
            break;
          }
        }

        // Send response to requester
        if (requesterSocketId) {
          io.to(requesterSocketId).emit('session-request-updated', {
            sessionRequest,
            action
          });
        }

        // Send confirmation to tutor
        socket.emit('session-request-response-sent', {
          message: `Session request ${action}d successfully`,
          sessionRequest
        });

        // If approved, emit 'session-started' to both tutor and requester
        if (action === 'approve') {
          const sessionStartedPayload = {
            sessionId: sessionRequest._id.toString(),
            sessionRequest,
            tutor: sessionRequest.tutor,
            requester: sessionRequest.requester
          };
          // To tutor
          socket.emit('session-started', sessionStartedPayload);
          // To requester
          if (requesterSocketId) {
            io.to(requesterSocketId).emit('session-started', sessionStartedPayload);
          }
        }

        console.log(`[Session Request] Request ${action}d by tutor ${tutorId}`);

      } catch (error) {
        console.error('[Session Request Response] Error:', error);
        socket.emit('session-request-response-error', { message: 'Failed to process response' });
      }
    });

    // Find online tutors based on skills
    socket.on('find-tutors', async (searchCriteria) => {
      try {
        const { subject, topic, subtopic } = searchCriteria;
        
        // Find online users who can teach the specified skills
        const matchingTutors = [];
        
        for (const [socketId, userData] of onlineUsers.entries()) {
          // Exclude the searching user
          if (socketId === socket.id) continue;
          const userSkills = userData.skillsToTeach || [];
          
          // Check if user has matching skills
          const hasMatchingSkill = userSkills.some(skill => {
            const subjectMatch = !subject || skill.subject === subject;
            const topicMatch = !topic || skill.topic === topic;
            const subtopicMatch = !subtopic || skill.subtopic === subtopic;
            
            return subjectMatch && topicMatch && subtopicMatch;
          });
          
          if (hasMatchingSkill) {
            matchingTutors.push({
              userId: userData.userId,
              firstName: userData.firstName,
              lastName: userData.lastName,
              profilePic: userData.profilePic,
              rating: userData.rating,
              status: userData.status,
              socketId: userData.socketId
            });
          }
        }
        
        // Send matching tutors back to the client
        socket.emit('tutors-found', {
          tutors: matchingTutors,
          searchCriteria
        });
        
        console.log(`[Find Tutors] Found ${matchingTutors.length} tutors for criteria:`, searchCriteria);
        
      } catch (error) {
        console.error('[Find Tutors] Error:', error);
        socket.emit('tutors-found', {
          tutors: [],
          error: 'Failed to find tutors'
        });
      }
    });

    // Update user status
    socket.on('update-status', (status) => {
      const userData = onlineUsers.get(socket.id);
      if (userData) {
        userData.status = status;
        console.log(`[Status Update] User ${userData.firstName} status updated to: ${status}`);
      }
    });

    // Helper to get userId from socketId
    function getUserIdFromSocketId(socketId) {
      const userData = onlineUsers.get(socketId);
      return userData ? userData.userId : null;
    }

    // Helper to get all userIds in a session room
    function getUserIdsInSession(sessionId) {
      const sockets = sessionRooms.get(sessionId) || new Set();
      return Array.from(sockets).map(getUserIdFromSocketId).filter(Boolean);
    }

    // Helper to get socketIds for a userId
    function getSocketIdsForUserId(userId) {
      return Array.from(onlineUsers.entries())
        .filter(([_, data]) => String(data.userId) === String(userId))
        .map(([socketId, _]) => socketId);
    }

    // Join session room for video calling
    socket.on('join-session', async ({ sessionId, userRole }) => {
      socket.join(sessionId);
      if (!sessionRooms.has(sessionId)) {
        sessionRooms.set(sessionId, new Set());
      }
      sessionRooms.get(sessionId).add(socket.id);
      socket.to(sessionId).emit('user-joined', { sessionId, userRole });

      // Check if both users are present, then start timer if not already started
      const userIds = getUserIdsInSession(sessionId);
      if (userIds.length === 2 && !sessionTimers.has(sessionId)) {
        // Try to find session in SessionRequest first, then Session
        let sessionRequest = await SessionRequest.findById(sessionId);
        let requesterId, tutorId;
        if (sessionRequest) {
          requesterId = String(sessionRequest.requester);
          tutorId = String(sessionRequest.tutor);
        } else {
          // Try Session (scheduled session)
          const session = await Session.findById(sessionId);
          if (session) {
            requesterId = session.requester ? String(session.requester) : null;
            tutorId = session.creator ? String(session.creator) : null;
          }
        }
        if (!requesterId || !tutorId) return;
        // Start timer
        let minutesElapsed = 0;
        const timer = setInterval(async () => {
          minutesElapsed++;
          try {
            // Deduct 1 silver coin from requester
            const requester = await User.findById(requesterId);
            if (requester && requester.silverCoins >= 1) {
              requester.silverCoins -= 1;
              await requester.save();
            }
            // Credit 0.75 silver coin to tutor
            const tutor = await User.findById(tutorId);
            if (tutor) {
              tutor.silverCoins += 0.75;
              await tutor.save();
            }
            // Optionally: emit balance updates to both users
            getSocketIdsForUserId(requesterId).forEach(sid => {
              io.to(sid).emit('coin-update', { silverCoins: requester ? requester.silverCoins : null });
            });
            getSocketIdsForUserId(tutorId).forEach(sid => {
              io.to(sid).emit('coin-update', { silverCoins: tutor ? tutor.silverCoins : null });
            });
          } catch (err) {
            console.error('[Session Timer] Error updating coins:', err);
          }
        }, 60 * 1000); // Every minute
        sessionTimers.set(sessionId, timer);
        console.log(`[Session Timer] Started for session ${sessionId}`);
      }
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

    // Whiteboard events
    socket.on('whiteboard-draw', ({ sessionId, fromX, fromY, toX, toY, color, size, tool }) => {
      socket.to(sessionId).emit('whiteboard-draw', {
        fromX, fromY, toX, toY, color, size, tool
      });
    });

    socket.on('whiteboard-clear', ({ sessionId }) => {
      socket.to(sessionId).emit('whiteboard-clear');
    });

    // Start session after approval (tutor triggers this)
    socket.on('start-session', async ({ sessionId }) => {
      try {
        const sessionRequest = await require('./models/SessionRequest').findById(sessionId)
          .populate('tutor', 'firstName lastName profilePic socketId')
          .populate('requester', 'firstName lastName profilePic socketId');
        if (!sessionRequest || sessionRequest.status !== 'approved') return;

        // Find sockets
        let tutorSocketId = null, requesterSocketId = null;
        for (const [socketId, userData] of onlineUsers.entries()) {
          if (userData.userId.toString() === sessionRequest.tutor._id.toString()) tutorSocketId = socketId;
          if (userData.userId.toString() === sessionRequest.requester._id.toString()) requesterSocketId = socketId;
        }

        const payload = {
          sessionId: sessionRequest._id.toString(),
          sessionRequest,
          tutor: sessionRequest.tutor,
          requester: sessionRequest.requester
        };
        if (tutorSocketId) io.to(tutorSocketId).emit('session-started', payload);
        if (requesterSocketId) io.to(requesterSocketId).emit('session-started', payload);
      } catch (err) {
        console.error('[start-session] Error:', err);
      }
    });

    // Cancel session (requester triggers this)
    socket.on('cancel-session', async ({ sessionId }) => {
      try {
        const sessionRequest = await require('./models/SessionRequest').findById(sessionId)
          .populate('tutor', 'firstName lastName profilePic socketId')
          .populate('requester', 'firstName lastName profilePic socketId');
        if (!sessionRequest) return;

        // Find sockets
        let tutorSocketId = null, requesterSocketId = null;
        for (const [socketId, userData] of onlineUsers.entries()) {
          if (userData.userId.toString() === sessionRequest.tutor._id.toString()) tutorSocketId = socketId;
          if (userData.userId.toString() === sessionRequest.requester._id.toString()) requesterSocketId = socketId;
        }

        // Mark as cancelled
        sessionRequest.status = 'cancelled';
        await sessionRequest.save();

        const payload = {
          sessionId: sessionRequest._id.toString(),
          sessionRequest,
          message: 'Session was cancelled by the requester.'
        };
        if (tutorSocketId) io.to(tutorSocketId).emit('session-cancelled', payload);
        if (requesterSocketId) io.to(requesterSocketId).emit('session-cancelled', payload);
      } catch (err) {
        console.error('[cancel-session] Error:', err);
      }
    });

    // End call for all users in the session
    socket.on('end-call', async ({ sessionId }) => {
      io.to(sessionId).emit('end-call', { sessionId });
      // Stop timer if running
      if (sessionTimers.has(sessionId)) {
        clearInterval(sessionTimers.get(sessionId));
        sessionTimers.delete(sessionId);
        console.log(`[Session Timer] Stopped for session ${sessionId}`);
      }
      // Mark scheduled session as completed if it exists
      const session = await Session.findById(sessionId);
      if (session && session.status !== 'completed') {
        session.status = 'completed';
        await session.save();
        io.to(sessionId).emit('session-completed', { sessionId });
        console.log(`[Session] Marked as completed: ${sessionId}`);
      }
    });

    socket.on('disconnect', () => {
      // Remove user from online users
      const userData = onlineUsers.get(socket.id);
      if (userData) {
        console.log(`Socket Disconnect] User ${userData.firstName} went offline`);
        onlineUsers.delete(socket.id);
      }
      
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
