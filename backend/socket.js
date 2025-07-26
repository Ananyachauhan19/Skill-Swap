const User = require('./models/User');
const SessionRequest = require('./models/SessionRequest');
const Session = require('./models/Session');
const SkillMate = require('./models/SkillMate');
const Notification = require('./models/Notification');
const ChatMessage = require('./models/Chat');

module.exports = (io) => {
  // Store session rooms
  const sessionRooms = new Map();
  // Store online users
  const onlineUsers = new Map();
  // Store active session timers
  const sessionTimers = new Map();

  // Helper function to send notifications
  const sendNotification = async (io, userId, type, message, sessionId, requestId, requesterId, requesterName, subject, topic, subtopic, messageId) => {
    try {
      const notification = await Notification.create({
        userId,
        type,
        message,
        sessionId,
        requestId,
        requesterId,
        requesterName,
        subject,
        topic,
        subtopic,
        messageId,
        timestamp: Date.now(),
        read: false
      });

      console.log(`Notification created for user ${userId}:`, notification);

      io.to(userId.toString()).emit('notification', {
        _id: notification._id,
        userId,
        type,
        message,
        sessionId,
        requestId,
        requesterId,
        requesterName,
        subject,
        topic,
        subtopic,
        messageId,
        timestamp: notification.timestamp,
        read: false
      });

      console.log(`Emitted notification to room ${userId.toString()}`);
    } catch (error) {
      console.error('Error in sendNotification:', error);
    }
  };

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Join user to their own room based on userId
    socket.on('join', (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined their room`);
    });

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

    // Handle SkillMate request
    socket.on('send-skillmate-request', async (data) => {
      try {
        const { recipientId } = data;
        const requesterId = socket.userId;

        // Prevent self-requests
        if (requesterId === recipientId) {
          socket.emit('skillmate-request-error', { message: 'You cannot send a SkillMate request to yourself' });
          return;
        }

        let requesterData = null;
        for (const [socketId, userData] of onlineUsers.entries()) {
          if (userData.userId.toString() === requesterId) {
            requesterData = userData;
            break;
          }
        }

        if (!requesterData) {
          socket.emit('skillmate-request-error', { message: 'User not found' });
          return;
        }

        let recipientSocketId = null;
        for (const [socketId, userData] of onlineUsers.entries()) {
          if (userData.userId.toString() === recipientId) {
            recipientSocketId = socketId;
            break;
          }
        }

        // Check if there's already a request or relationship
        const existingRequest = await SkillMate.findOne({
          $or: [
            { requester: requesterId, recipient: recipientId },
            { requester: recipientId, recipient: requesterId }
          ]
        });

        if (existingRequest) {
          if (existingRequest.status === 'approved') {
            socket.emit('skillmate-request-error', { message: 'You are already SkillMates with this user' });
            return;
          } else if (existingRequest.status === 'pending') {
            if (existingRequest.requester.toString() === requesterId) {
              socket.emit('skillmate-request-error', { message: 'You already have a pending request with this user' });
              return;
            } else {
              // If the recipient has already sent a request to the requester, approve it
              existingRequest.status = 'approved';
              await existingRequest.save();

              // Add each user to the other's skillMates array
              await User.findByIdAndUpdate(requesterId, { $addToSet: { skillMates: recipientId } });
              await User.findByIdAndUpdate(recipientId, { $addToSet: { skillMates: requesterId } });

              await existingRequest.populate('requester', 'firstName lastName profilePic');
              await existingRequest.populate('recipient', 'firstName lastName profilePic');

              const requesterName = `${existingRequest.recipient.firstName} ${existingRequest.recipient.lastName}`;
              await sendNotification(
                io,
                existingRequest.requester._id,
                'skillmate-approved',
                `Your SkillMate request has been approved by ${requesterName}.`,
                null,
                existingRequest._id,
                recipientId,
                requesterName
              );

              if (recipientSocketId) {
                io.to(recipientSocketId).emit('skillmate-request-approved', {
                  message: 'SkillMate request approved automatically',
                  skillMate: existingRequest
                });
              }

              socket.emit('skillmate-request-approved', {
                message: 'SkillMate request approved automatically as the user had already sent you a request',
                skillMate: existingRequest
              });

              return;
            }
          } else if (existingRequest.status === 'rejected') {
            // If previously rejected, update to pending
            existingRequest.status = 'pending';
            await existingRequest.save();

            await existingRequest.populate('requester', 'firstName lastName profilePic');
            await existingRequest.populate('recipient', 'firstName lastName profilePic');

            const requesterName = `${existingRequest.requester.firstName} ${existingRequest.requester.lastName}`;
            await sendNotification(
              io,
              recipientId,
              'skillmate-requested',
              `${requesterName} has sent you a SkillMate request.`,
              null,
              existingRequest._id,
              requesterId,
              requesterName
            );

            if (recipientSocketId) {
              io.to(recipientSocketId).emit('skillmate-request-received', {
                skillMate: existingRequest,
                requester: requesterData
              });
            }

            socket.emit('skillmate-request-sent', {
              message: 'SkillMate request sent successfully',
              skillMate: existingRequest
            });

            return;
          }
        }

        // Create new SkillMate request
        const skillMateRequest = new SkillMate({
          requester: requesterId,
          recipient: recipientId
        });

        await skillMateRequest.save();

        await skillMateRequest.populate('requester', 'firstName lastName profilePic');
        await skillMateRequest.populate('recipient', 'firstName lastName profilePic');

        const requesterName = `${skillMateRequest.requester.firstName} ${skillMateRequest.requester.lastName}`;
        await sendNotification(
          io,
          recipientId,
          'skillmate-requested',
          `${requesterName} has sent you a SkillMate request.`,
          null,
          skillMateRequest._id,
          requesterId,
          requesterName
        );

        if (recipientSocketId) {
          io.to(recipientSocketId).emit('skillmate-request-received', {
            skillMate: skillMateRequest,
            requester: requesterData
          });
        }

        socket.emit('skillmate-request-sent', {
          message: 'SkillMate request sent successfully',
          skillMate: skillMateRequest
        });

        console.log(`[SkillMate Request] Request sent from ${requesterData.firstName} to recipient ${recipientId}`);

      } catch (error) {
        console.error('[SkillMate Request] Error:', error);
        socket.emit('skillmate-request-error', { message: 'Failed to send SkillMate request' });
      }
    });

    // Handle SkillMate request approval
    socket.on('approve-skillmate-request', async (data) => {
      try {
        const { requestId } = data;
        const userId = socket.userId;

        const skillMateRequest = await SkillMate.findOne({
          _id: requestId,
          recipient: userId,
          status: 'pending'
        });

        if (!skillMateRequest) {
          socket.emit('skillmate-request-error', { message: 'SkillMate request not found or already processed' });
          return;
        }

        // Update request status
        skillMateRequest.status = 'approved';
        await skillMateRequest.save();

        // Add each user to the other's skillMates array
        await User.findByIdAndUpdate(skillMateRequest.requester, { 
          $addToSet: { skillMates: skillMateRequest.recipient } 
        });
        await User.findByIdAndUpdate(skillMateRequest.recipient, { 
          $addToSet: { skillMates: skillMateRequest.requester } 
        });

        await skillMateRequest.populate('requester', 'firstName lastName profilePic');
        await skillMateRequest.populate('recipient', 'firstName lastName profilePic');

        const recipientName = `${skillMateRequest.recipient.firstName} ${skillMateRequest.recipient.lastName}`;
        await sendNotification(
          io,
          skillMateRequest.requester._id,
          'skillmate-approved',
          `Your SkillMate request has been approved by ${recipientName}.`,
          null,
          skillMateRequest._id,
          userId,
          recipientName
        );

        // Find requester's socket ID
        let requesterSocketId = null;
        for (const [socketId, userData] of onlineUsers.entries()) {
          if (userData.userId.toString() === skillMateRequest.requester.toString()) {
            requesterSocketId = socketId;
            break;
          }
        }

        if (requesterSocketId) {
          io.to(requesterSocketId).emit('skillmate-request-approved', {
            message: 'Your SkillMate request has been approved',
            skillMate: skillMateRequest
          });
        }

        socket.emit('skillmate-request-approved', {
          message: 'SkillMate request approved successfully',
          skillMate: skillMateRequest
        });

        console.log(`[SkillMate Request] Request approved by ${userId} for requester ${skillMateRequest.requester}`);

      } catch (error) {
        console.error('[SkillMate Request] Error approving request:', error);
        socket.emit('skillmate-request-error', { message: 'Failed to approve SkillMate request' });
      }
    });

    // Handle SkillMate request rejection
    socket.on('reject-skillmate-request', async (data) => {
      try {
        const { requestId } = data;
        const userId = socket.userId;

        const skillMateRequest = await SkillMate.findOne({
          _id: requestId,
          recipient: userId,
          status: 'pending'
        });

        if (!skillMateRequest) {
          socket.emit('skillmate-request-error', { message: 'SkillMate request not found or already processed' });
          return;
        }

        // Update request status
        skillMateRequest.status = 'rejected';
        await skillMateRequest.save();

        await skillMateRequest.populate('requester', 'firstName lastName profilePic');
        await skillMateRequest.populate('recipient', 'firstName lastName profilePic');

        const recipientName = `${skillMateRequest.recipient.firstName} ${skillMateRequest.recipient.lastName}`;
        await sendNotification(
          io,
          skillMateRequest.requester._id,
          'skillmate-rejected',
          `Your SkillMate request has been rejected by ${recipientName}.`,
          null,
          skillMateRequest._id,
          userId,
          recipientName
        );

        // Find requester's socket ID
        let requesterSocketId = null;
        for (const [socketId, userData] of onlineUsers.entries()) {
          if (userData.userId.toString() === skillMateRequest.requester.toString()) {
            requesterSocketId = socketId;
            break;
          }
        }

        if (requesterSocketId) {
          io.to(requesterSocketId).emit('skillmate-request-rejected', {
            message: 'Your SkillMate request has been rejected',
            skillMate: skillMateRequest
          });
        }

        socket.emit('skillmate-request-rejected', {
          message: 'SkillMate request rejected successfully',
          skillMate: skillMateRequest
        });

        console.log(`[SkillMate Request] Request rejected by ${userId} for requester ${skillMateRequest.requester}`);

      } catch (error) {
        console.error('[SkillMate Request] Error rejecting request:', error);
        socket.emit('skillmate-request-error', { message: 'Failed to reject SkillMate request' });
      }
    });

    // Handle SkillMate removal
    socket.on('remove-skillmate', async (data) => {
      try {
        const { skillMateId } = data;
        const userId = socket.userId;

        const skillMateRelationship = await SkillMate.findOne({
          $or: [
            { requester: userId, recipient: skillMateId },
            { requester: skillMateId, recipient: userId }
          ],
          status: 'approved'
        });

        if (!skillMateRelationship) {
          socket.emit('skillmate-request-error', { message: 'SkillMate relationship not found' });
          return;
        }

        // Remove from both users' skillMates arrays
        await User.findByIdAndUpdate(userId, { 
          $pull: { skillMates: skillMateId } 
        });
        await User.findByIdAndUpdate(skillMateId, { 
          $pull: { skillMates: userId } 
        });

        // Delete the SkillMate document
        await SkillMate.deleteOne({
          $or: [
            { requester: userId, recipient: skillMateId },
            { requester: skillMateId, recipient: userId }
          ],
          status: 'approved'
        });

        const currentUser = await User.findById(userId).select('firstName lastName profilePic');
        const currentUserName = `${currentUser.firstName} ${currentUser.lastName}`;
        await sendNotification(
          io,
          skillMateId,
          'skillmate-removed',
          `${currentUserName} has removed you as a SkillMate.`,
          null,
          null,
          userId,
          currentUserName
        );

        // Find the other user's socket ID
        let otherUserSocketId = null;
        for (const [socketId, userData] of onlineUsers.entries()) {
          if (userData.userId.toString() === skillMateId.toString()) {
            otherUserSocketId = socketId;
            break;
          }
        }

        if (otherUserSocketId) {
          io.to(otherUserSocketId).emit('skillmate-removed', {
            message: 'You have been removed as a SkillMate',
            userId: userId
          });
        }

        socket.emit('skillmate-removed', {
          message: 'SkillMate removed successfully',
          userId: skillMateId
        });

        console.log(`[SkillMate Removal] User ${userId} removed SkillMate ${skillMateId}`);

      } catch (error) {
        console.error('[SkillMate Removal] Error:', error);
        socket.emit('skillmate-request-error', { message: 'Failed to remove SkillMate' });
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

        // Check if tutor exists
        const tutor = await User.findById(tutorId).select('firstName lastName profilePic');
        if (!tutor) {
          socket.emit('session-request-error', { message: 'Tutor not found' });
          return;
        }

        // Check for existing pending request
        const existingRequest = await SessionRequest.findOne({
          requester: requesterId,
          tutor: tutorId,
          status: 'pending',
        });
        if (existingRequest) {
          socket.emit('session-request-error', { message: 'You already have a pending request with this tutor' });
          return;
        }

        // Create new session request
        const sessionRequest = new SessionRequest({
          requester: requesterId,
          tutor: tutorId,
          subject,
          topic,
          subtopic: subtopic || '',
          message: message || '',
          status: 'pending',
        });

        await sessionRequest.save();

        await sessionRequest.populate('requester', 'firstName lastName profilePic');
        await sessionRequest.populate('tutor', 'firstName lastName profilePic');

        // Send notification to tutor
        const requesterName = `${requesterData.firstName} ${requesterData.lastName}`;
        const notificationMessage = `${requesterName} has requested a session on ${subject}${subtopic ? ` (${subtopic})` : ''}. Please approve or reject.`;
        await sendNotification(
          io,
          tutorId,
          'session-requested',
          notificationMessage,
          null,
          sessionRequest._id,
          requesterId,
          requesterName,
          subject,
          topic,
          subtopic
        );

        // Emit real-time event if tutor is online
        let tutorSocketId = null;
        for (const [socketId, userData] of onlineUsers.entries()) {
          if (userData.userId.toString() === tutorId) {
            tutorSocketId = socketId;
            break;
          }
        }

        if (tutorSocketId) {
          io.to(tutorSocketId).emit('session-request-received', {
            sessionRequest,
            requester: requesterData
          });
        }

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

        // Send notification to requester
        const tutorName = `${sessionRequest.tutor.firstName} ${sessionRequest.tutor.lastName}`;
        const notificationMessage = `${tutorName} has ${action}d your session request on ${sessionRequest.subject}${sessionRequest.subtopic ? ` (${sessionRequest.subtopic})` : ''}.`;
        await sendNotification(
          io,
          sessionRequest.requester._id,
          `session-${action}d`,
          notificationMessage,
          null,
          sessionRequest._id,
          tutorId,
          tutorName,
          sessionRequest.subject,
          sessionRequest.topic,
          sessionRequest.subtopic
        );

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

        const requesterName = `${sessionRequest.requester.firstName} ${sessionRequest.requester.lastName}`;
        await sendNotification(
          io,
          sessionRequest.tutor._id,
          'session-cancelled',
          `${requesterName} has cancelled the session on ${sessionRequest.subject}${sessionRequest.subtopic ? ` (${sessionRequest.subtopic})` : ''}.`,
          sessionRequest._id,
          null,
          sessionRequest.requester._id,
          requesterName,
          sessionRequest.subject,
          sessionRequest.topic,
          sessionRequest.subtopic
        );

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

    socket.on('start-call', ({ to }) => {
      io.to(to).emit('call-started');
    });

    // Handle chat messages between SkillMates
    socket.on('send-chat-message', async (data) => {
      try {
        const { recipientId, content } = data;
        const senderId = socket.userId;

        if (!senderId || !recipientId || !content) {
          socket.emit('chat-error', { message: 'Invalid message data' });
          return;
        }

        // Verify that the users are skillmates
        const skillMateRelationship = await SkillMate.findOne({
          status: 'approved',
          $or: [
            { requester: senderId, recipient: recipientId },
            { requester: recipientId, recipient: senderId }
          ]
        });

        if (!skillMateRelationship) {
          socket.emit('chat-error', { message: 'You can only chat with your SkillMates' });
          return;
        }

        // Get sender's information
        const sender = await User.findById(senderId).select('firstName lastName');
        if (!sender) {
          socket.emit('chat-error', { message: 'Sender not found' });
          return;
        }

        // Create and save the message
        const chatMessage = new ChatMessage({
          senderId,
          recipientId,
          content,
          sender: {
            firstName: sender.firstName,
            lastName: sender.lastName
          }
        });

        await chatMessage.save();

        // Send notification to recipient
        const senderName = `${sender.firstName} ${sender.lastName}`;
        await sendNotification(
          io,
          recipientId,
          'chat-message',
          `${senderName}: ${content.length > 50 ? content.substring(0, 50) + '...' : content}`,
          null,
          null,
          senderId,
          senderName,
          null,
          null,
          null,
          chatMessage._id
        );

        // Find recipient's socket ID
        let recipientSocketId = null;
        for (const [socketId, userData] of onlineUsers.entries()) {
          if (userData.userId.toString() === recipientId) {
            recipientSocketId = socketId;
            break;
          }
        }

        // Send message to recipient if online
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('chat-message-received', {
            message: chatMessage,
            senderId
          });
        }

        // Send confirmation to sender
        socket.emit('chat-message-sent', {
          message: chatMessage
        });

        console.log(`[Chat] Message sent from ${senderId} to ${recipientId}`);

      } catch (error) {
        console.error('[Chat] Error sending message:', error);
        socket.emit('chat-error', { message: 'Failed to send message' });
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
      console.log('Client disconnected:', socket.id);
    });
  });
};