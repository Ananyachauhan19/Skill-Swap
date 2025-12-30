const sendMail = require('./sendMail');
const emailTemplates = require('./emailTemplates');
const AssessmentNotification = require('../models/AssessmentNotification');
const User = require('../models/User');
const Assessment = require('../models/Assessment');

/**
 * Send assessment notification emails to eligible students
 * @param {Object} assessment - Assessment document
 * @returns {Object} - Results of email sending
 */
async function sendAssessmentNotifications(assessment) {
  const results = {
    compulsorySent: 0,
    nonCompulsorySent: 0,
    failed: 0,
    errors: []
  };

  try {
    // NEW FORMAT: Use collegeConfigs if available
    if (assessment.collegeConfigs && assessment.collegeConfigs.length > 0) {
      // Process each college configuration
      for (const config of assessment.collegeConfigs) {
        // Find all students matching this college and course
        // (ALL semesters of the course get notifications)
        const students = await User.find({
          instituteId: config.collegeId,
          course: config.courseId,
          email: { $exists: true, $ne: null, $ne: '' }
        }).select('_id email firstName lastName semester course');

        console.log(`Found ${students.length} students for college ${config.collegeId}, course ${config.courseId}`);

        for (const student of students) {
          try {
            // Determine if compulsory for this student based on their semester
            const studentSemester = student.semester ? parseInt(student.semester) : null;
            const isCompulsoryForStudent = studentSemester && config.compulsorySemesters.includes(studentSemester);
            
            // Check if notification already sent
            const existingNotification = await AssessmentNotification.findOne({
              assessmentId: assessment._id,
              studentId: student._id
            });

            if (existingNotification) {
              console.log(`Notification already sent to ${student.email}`);
              continue;
            }

            const studentName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student';
            const emailData = {
              studentName,
              assessmentTitle: assessment.title,
              description: assessment.description,
              startTime: assessment.startTime ? new Date(assessment.startTime).toLocaleString() : 'Now',
              endTime: assessment.endTime ? new Date(assessment.endTime).toLocaleString() : 'No deadline',
              duration: assessment.duration,
              totalMarks: assessment.totalMarks
            };

            // Choose email template based on compulsory status
            const emailContent = isCompulsoryForStudent
              ? emailTemplates.compulsoryAssessmentNotification(emailData)
              : emailTemplates.nonCompulsoryAssessmentNotification(emailData);

            // Send email
            await sendMail({
              to: student.email,
              subject: emailContent.subject,
              html: emailContent.html
            });

            // Save notification record
            await AssessmentNotification.create({
              assessmentId: assessment._id,
              studentId: student._id,
              studentEmail: student.email,
              notificationType: isCompulsoryForStudent ? 'compulsory' : 'non-compulsory',
              emailStatus: 'sent'
            });

            if (isCompulsoryForStudent) {
              results.compulsorySent++;
            } else {
              results.nonCompulsorySent++;
            }

            console.log(`✅ Sent ${isCompulsoryForStudent ? 'compulsory' : 'non-compulsory'} notification to ${student.email}`);
          } catch (error) {
            console.error(`❌ Failed to send notification to ${student.email}:`, error.message);
            results.failed++;
            results.errors.push({ email: student.email, error: error.message });

            // Save failed notification record
            await AssessmentNotification.create({
              assessmentId: assessment._id,
              studentId: student._id,
              studentEmail: student.email,
              notificationType: 'compulsory',
              emailStatus: 'failed',
              errorMessage: error.message
            }).catch(err => console.error('Failed to save notification record:', err));
          }
        }
      }
    }
    // OLD FORMAT: Backward compatibility for universitySemesterConfig
    else if (assessment.universitySemesterConfig && assessment.universitySemesterConfig.length > 0) {
      // Get all eligible students for each university-semester config
      for (const config of assessment.universitySemesterConfig) {
        // Find students matching institute and semester
        const students = await User.find({
          instituteId: config.instituteId,
          semester: { $in: config.semesters.map(s => s.toString()) },
          email: { $exists: true, $ne: null, $ne: '' }
        }).select('_id email firstName lastName semester');

        console.log(`Found ${students.length} students for institute ${config.instituteId}, semesters ${config.semesters}`);

        for (const student of students) {
          try {
            // Check if notification already sent
            const existingNotification = await AssessmentNotification.findOne({
              assessmentId: assessment._id,
              studentId: student._id,
              notificationType: config.isCompulsory ? 'compulsory' : 'non-compulsory'
            });

            if (existingNotification) {
              console.log(`Notification already sent to ${student.email}`);
              continue;
            }

            const studentName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student';
            const emailData = {
              studentName,
              assessmentTitle: assessment.title,
              description: assessment.description,
              startTime: assessment.startTime ? new Date(assessment.startTime).toLocaleString() : 'Now',
              endTime: assessment.endTime ? new Date(assessment.endTime).toLocaleString() : 'No deadline',
              duration: assessment.duration,
              totalMarks: assessment.totalMarks
            };

            // Choose email template based on compulsory status
            const emailContent = config.isCompulsory
              ? emailTemplates.compulsoryAssessmentNotification(emailData)
              : emailTemplates.nonCompulsoryAssessmentNotification(emailData);

            // Send email
            await sendMail({
              to: student.email,
              subject: emailContent.subject,
              html: emailContent.html
            });

            // Save notification record
            await AssessmentNotification.create({
              assessmentId: assessment._id,
              studentId: student._id,
              studentEmail: student.email,
              notificationType: config.isCompulsory ? 'compulsory' : 'non-compulsory',
              emailStatus: 'sent'
            });

            if (config.isCompulsory) {
              results.compulsorySent++;
            } else {
              results.nonCompulsorySent++;
            }

            console.log(`✅ Sent ${config.isCompulsory ? 'compulsory' : 'non-compulsory'} notification to ${student.email}`);
          } catch (error) {
            console.error(`❌ Failed to send notification to ${student.email}:`, error.message);
            results.failed++;
            results.errors.push({ email: student.email, error: error.message });

            // Save failed notification record
            await AssessmentNotification.create({
              assessmentId: assessment._id,
              studentId: student._id,
              studentEmail: student.email,
              notificationType: config.isCompulsory ? 'compulsory' : 'non-compulsory',
              emailStatus: 'failed',
              errorMessage: error.message
            }).catch(err => console.error('Failed to save notification record:', err));
          }
        }
      }
    }

    console.log(`\n📊 Notification Results:
      - Compulsory emails sent: ${results.compulsorySent}
      - Non-compulsory emails sent: ${results.nonCompulsorySent}
      - Failed: ${results.failed}`);

    return results;
  } catch (error) {
    console.error('Error in sendAssessmentNotifications:', error);
    throw error;
  }
}

/**
 * Send reminder emails for assessments ending within 24 hours
 * @param {Object} assessment - Assessment document
 * @returns {Object} - Results of reminder sending
 */
async function sendAssessmentReminders(assessment) {
  const results = {
    sent: 0,
    failed: 0,
    errors: []
  };

  try {
    // Only send reminders for compulsory assessments
    const compulsoryConfigs = assessment.universitySemesterConfig.filter(c => c.isCompulsory);
    
    if (compulsoryConfigs.length === 0) {
      console.log('No compulsory configurations found for this assessment');
      return results;
    }

    for (const config of compulsoryConfigs) {
      // Find students who haven't attempted yet
      const students = await User.find({
        instituteId: config.instituteId,
        semester: { $in: config.semesters.map(s => s.toString()) },
        email: { $exists: true, $ne: null, $ne: '' }
      }).select('_id email firstName lastName');

      const AssessmentAttempt = require('../models/AssessmentAttempt');
      
      for (const student of students) {
        try {
          // Check if student has already attempted
          const attempt = await AssessmentAttempt.findOne({
            assessmentId: assessment._id,
            studentId: student._id
          });

          if (attempt) {
            continue; // Already attempted
          }

          // Check if reminder already sent
          const existingReminder = await AssessmentNotification.findOne({
            assessmentId: assessment._id,
            studentId: student._id,
            notificationType: 'reminder'
          });

          if (existingReminder) {
            continue; // Reminder already sent
          }

          const studentName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student';
          const hoursRemaining = Math.ceil((new Date(assessment.endTime) - new Date()) / (1000 * 60 * 60));
          
          const emailContent = emailTemplates.assessmentReminder({
            studentName,
            assessmentTitle: assessment.title,
            endTime: new Date(assessment.endTime).toLocaleString(),
            hoursRemaining
          });

          // Send reminder email
          await sendMail({
            to: student.email,
            subject: emailContent.subject,
            html: emailContent.html
          });

          // Save reminder notification
          await AssessmentNotification.create({
            assessmentId: assessment._id,
            studentId: student._id,
            studentEmail: student.email,
            notificationType: 'reminder',
            emailStatus: 'sent'
          });

          results.sent++;
          console.log(`✅ Sent reminder to ${student.email}`);
        } catch (error) {
          console.error(`❌ Failed to send reminder to ${student.email}:`, error.message);
          results.failed++;
          results.errors.push({ email: student.email, error: error.message });
        }
      }
    }

    console.log(`\n📊 Reminder Results:
      - Reminders sent: ${results.sent}
      - Failed: ${results.failed}`);

    return results;
  } catch (error) {
    console.error('Error in sendAssessmentReminders:', error);
    throw error;
  }
}

module.exports = {
  sendAssessmentNotifications,
  sendAssessmentReminders
};
