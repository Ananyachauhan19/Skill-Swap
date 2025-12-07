const SessionRequest = require('../models/SessionRequest');
const User = require('../models/User');

// Get feedback for a specific tutor
exports.getTutorFeedback = async (req, res) => {
  try {
    const { tutorId } = req.params;

    // Fetch all completed sessions where this user was the tutor
    const sessions = await SessionRequest.find({
      tutor: tutorId,
      status: 'completed',
      ratingByRequester: { $exists: true, $ne: null }
    })
      .populate('requester', 'firstName lastName username')
      .sort({ ratedByRequesterAt: -1 });

    // Calculate rating distribution
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;
    let totalRatings = 0;

    const reviews = [];

    for (const session of sessions) {
      if (session.ratingByRequester) {
        const rating = session.ratingByRequester;
        ratingDistribution[rating]++;
        totalRating += rating;
        totalRatings++;

        // Get class/subject/topic from the session
        // SessionRequest stores the search terms as-is from frontend
        // Frontend sends: subject (Class like "class 8"), topic (Subject like "Mathematics"), subtopic (Topic)
        // So session.subject might be "class 8" and session.topic might be "Mathematics"
        
        let classValue = session.subject; // This might be "class 8"
        let subjectValue = session.topic; // This might be "Mathematics"
        let topicValue = session.questionText ? session.questionText.substring(0, 50) : null; // Use question as topic hint

        reviews.push({
          sessionId: session._id,
          studentName: session.requester 
            ? `${session.requester.firstName} ${session.requester.lastName}` 
            : 'Anonymous',
          rating: session.ratingByRequester,
          reviewText: session.reviewByRequester || '',
          ratedAt: session.ratedByRequesterAt || session.updatedAt,
          class: classValue,
          subject: subjectValue,
          topic: topicValue
        });
      }
    }

    const averageRating = totalRatings > 0 ? totalRating / totalRatings : 0;

    res.status(200).json({
      tutorId,
      totalRatings,
      averageRating,
      ratingDistribution,
      reviews
    });

  } catch (error) {
    console.error('[Tutor Feedback] Error:', error);
    res.status(500).json({ message: 'Failed to fetch tutor feedback', error: error.message });
  }
};
