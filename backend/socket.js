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
          socket.userId = userId;
          onlineUsers.set(socket.id, {
            userId: user._id,
            socketId: socket.id,
            firstName: user.firstName,
            lastName: user.lastName,
            skillsToTeach: user.skillsToTeach,
            profilePic: user.profilePic,
            rating: user.rating || 4.5,
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
        const requesterId = socket.userId;

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

        const sessionRequest = new SessionRequest({
          requester: requesterId,
          tutor: tutorId,
          subject,
          topic,
          subtopic,
          message: message || ''
        });

        await sessionRequest.save();

        await sessionRequest.populate('requester', 'firstName lastName profilePic');
        await sessionRequest.populate('tutor', 'firstName lastName profilePic');

        io.to(tutorSocketId).emit('session-request-received', {
          sessionRequest,
          requester: requesterData
        });

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
        const { requestId, action } = data;
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

        sessionRequest.status = action === 'approve' ? 'approved' : 'rejected';
        await sessionRequest.save();

        await sessionRequest.populate('requester', 'firstName lastName profilePic socketId');
        await sessionRequest.populate('tutor', 'firstName lastName profilePic socketId');

        let requesterSocketId = null;
        for (const [socketId, userData] of onlineUsers.entries()) {
          if (userData.userId.toString() === sessionRequest.requester._id.toString()) {
            requesterSocketId = socketId;
            break;
          }
        }

        if (requesterSocketId) {
          io.to(requesterSocketId).emit('session-request-updated', {
            sessionRequest,
            action
          });
        }

        socket.emit('session-request-response-sent', {
          message: `Session request ${action}d successfully`,
          sessionRequest
        });

        if (action === 'approve') {
          const sessionStartedPayload = {
            sessionId: sessionRequest._id.toString(),
            sessionRequest,
            tutor: sessionRequest.tutor,
            requester: sessionRequest.requester
          };
          socket.emit('session-started', sessionStartedPayload);
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
        const matchingTutors = [];
        
        for (const [socketId, userData] of onlineUsers.entries()) {
          if (socketId === socket.id) continue;
          const userSkills = userData.skillsToTeach || [];
          
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

    // Stop session timer
    function stopSessionTimer(sessionId) {
      if (sessionTimers.has(sessionId)) {
        clearInterval(sessionTimers.get(sessionId));
        sessionTimers.delete(sessionId);
        console.log(`[Session Timer] Stopped for session ${sessionId}`);
      }
    }

    // Join session room for video calling
    socket.on('join-session', async ({ sessionId, userRole, username }) => {
      socket.join(sessionId);
      if (!sessionRooms.has(sessionId)) {
        sessionRooms.set(sessionId, new Set());
      }
      sessionRooms.get(sessionId).add(socket.id);
      socket.to(sessionId).emit('user-joined', { sessionId, userRole, username });

      const userIds = getUserIdsInSession(sessionId);
      if (userIds.length === 2 && !sessionTimers.has(sessionId)) {
        let sessionRequest = await SessionRequest.findById(sessionId);
        let requesterId, tutorId;
        if (sessionRequest) {
          requesterId = String(sessionRequest.requester);
          tutorId = String(sessionRequest.tutor);
        } else {
          const session = await Session.findById(sessionId);
          if (session) {
            requesterId = session.requester ? String(session.requester) : null;
            tutorId = session.creator ? String(session.creator) : null;
          }
        }
        if (!requesterId || !tutorId) return;

        // Start timer for coin updates
        const timer = setInterval(async () => {
          try {
            const requester = await User.findById(requesterId);
            if (requester && requester.silverCoins >= 1) {
              requester.silverCoins -= 1;
              await requester.save();
              getSocketIdsForUserId(requesterId).forEach(sid => {
                io.to(sid).emit('coin-update', { silverCoins: requester.silverCoins });
              });
            } else {
              // Stop timer if requester has insufficient coins
              stopSessionTimer(sessionId);
              io.to(sessionId).emit('end-call', { sessionId, reason: 'Insufficient coins' });
              return;
            }

            const tutor = await User.findById(tutorId);
            if (tutor) {
              tutor.silverCoins += 0.75;
              await tutor.save();
              getSocketIdsForUserId(tutorId).forEach(sid => {
                io.to(sid).emit('coin-update', { silverCoins: tutor.silverCoins });
              });
            }
          } catch (err) {
            console.error('[Session Timer] Error updating coins:', err);
            stopSessionTimer(sessionId);
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
          stopSessionTimer(sessionId);
        }
      }
      socket.to(sessionId).emit('user-left', { sessionId });
    });

    // WebRTC Signaling
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

    // Chat and reaction events
    socket.on('chat-message', ({ sessionId, message, username }) => {
      socket.to(sessionId).emit('chat-message', { message, username });
    });

    socket.on('reaction', ({ sessionId, type, username }) => {
      socket.to(sessionId).emit('reaction', { type, username });
    });

    socket.on('toggle-hold', ({ sessionId, isOnHold, username }) => {
      socket.to(sessionId).emit('hold-status', { isOnHold, username });
    });

    // Start session after approval
    socket.on('start-session', async ({ sessionId }) => {
      try {
        const sessionRequest = await SessionRequest.findById(sessionId)
          .populate('tutor', 'firstName lastName profilePic socketId')
          .populate('requester', 'firstName lastName profilePic socketId');
        if (!sessionRequest || sessionRequest.status !== 'approved') return;

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

    // Cancel session
    socket.on('cancel-session', async ({ sessionId }) => {
      try {
        const sessionRequest = await SessionRequest.findById(sessionId)
          .populate('tutor', 'firstName lastName profilePic socketId')
          .populate('requester', 'firstName lastName profilePic socketId');
        if (!sessionRequest) return;

        let tutorSocketId = null, requesterSocketId = null;
        for (const [socketId, userData] of onlineUsers.entries()) {
          if (userData.userId.toString() === sessionRequest.tutor._id.toString()) tutorSocketId = socketId;
          if (userData.userId.toString() === sessionRequest.requester._id.toString()) requesterSocketId = socketId;
        }

        sessionRequest.status = 'cancelled';
        await sessionRequest.save();

        const payload = {
          sessionId: sessionRequest._id.toString(),
          sessionRequest,
          message: 'Session was cancelled by the requester.'
        };
        if (tutorSocketId) io.to(tutorSocketId).emit('session-cancelled', payload);
        if (requesterSocketId) io.to(requesterSocketId).emit('session-cancelled', payload);
        stopSessionTimer(sessionId);
      } catch (err) {
        console.error('[cancel-session] Error:', err);
      }
    });

    // End call
    socket.on('end-call', async ({ sessionId }) => {
      stopSessionTimer(sessionId);
      io.to(sessionId).emit('end-call', { sessionId });
      const session = await Session.findById(sessionId);
      if (session && session.status !== 'completed') {
        session.status = 'completed';
        await session.save();
        io.to(sessionId).emit('session-completed', { sessionId });
        console.log(`[Session] Marked as completed: ${sessionId}`);
      }
    });

    socket.on('disconnect', () => {
      const userData = onlineUsers.get(socket.id);
      if (userData) {
        console.log(`[Socket Disconnect] User ${userData.firstName} went offline`);
        onlineUsers.delete(socket.id);
      }
      
      for (const [sessionId, sockets] of sessionRooms.entries()) {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            sessionRooms.delete(sessionId);
            stopSessionTimer(sessionId);
          } else {
            socket.to(sessionId).emit('user-left', { sessionId });
            stopSessionTimer(sessionId);
          }
        }
      }
    });

    socket.on('start-call', ({ to }) => {
      io.to(to).emit('call-started');
    });
  });
};