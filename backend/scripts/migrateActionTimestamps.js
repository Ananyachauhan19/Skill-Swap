/**
 * Migration Script: Populate Action Timestamps
 * 
 * This script backfills the new approvedActionTimestamp and rejectedActionTimestamp
 * fields for existing TutorApplication and InterviewerApplication records.
 * 
 * For approved applications: Uses approvedAt as the action timestamp
 * For rejected applications: Uses createdAt as a fallback (since we don't have a rejectedAt field)
 * 
 * Run this script once after deploying the schema changes.
 */

const mongoose = require('mongoose');
const TutorApplication = require('../models/TutorApplication');
const InterviewerApplication = require('../models/InterviewerApplication');

async function migrateActionTimestamps() {
  try {
    console.log('Starting action timestamp migration...');

    // Migrate TutorApplication approved records
    const tutorApprovedResult = await TutorApplication.updateMany(
      {
        status: 'approved',
        approvedByEmployee: { $exists: true, $ne: null },
        approvedActionTimestamp: { $exists: false }
      },
      [
        {
          $set: {
            approvedActionTimestamp: {
              $ifNull: ['$approvedAt', '$submittedAt']
            }
          }
        }
      ]
    );
    console.log(`✅ Migrated ${tutorApprovedResult.modifiedCount} approved tutor applications`);

    // Migrate TutorApplication rejected records
    const tutorRejectedResult = await TutorApplication.updateMany(
      {
        status: 'rejected',
        rejectedByEmployee: { $exists: true, $ne: null },
        rejectedActionTimestamp: { $exists: false }
      },
      [
        {
          $set: {
            rejectedActionTimestamp: '$submittedAt'
          }
        }
      ]
    );
    console.log(`✅ Migrated ${tutorRejectedResult.modifiedCount} rejected tutor applications`);

    // Migrate InterviewerApplication approved records
    const interviewApprovedResult = await InterviewerApplication.updateMany(
      {
        status: 'approved',
        approvedByEmployee: { $exists: true, $ne: null },
        approvedActionTimestamp: { $exists: false }
      },
      [
        {
          $set: {
            approvedActionTimestamp: '$createdAt'
          }
        }
      ]
    );
    console.log(`✅ Migrated ${interviewApprovedResult.modifiedCount} approved interviewer applications`);

    // Migrate InterviewerApplication rejected records
    const interviewRejectedResult = await InterviewerApplication.updateMany(
      {
        status: 'rejected',
        rejectedByEmployee: { $exists: true, $ne: null },
        rejectedActionTimestamp: { $exists: false }
      },
      [
        {
          $set: {
            rejectedActionTimestamp: '$createdAt'
          }
        }
      ]
    );
    console.log(`✅ Migrated ${interviewRejectedResult.modifiedCount} rejected interviewer applications`);

    console.log('\n🎉 Migration completed successfully!');
    console.log(`
Summary:
- Tutor Applications (Approved): ${tutorApprovedResult.modifiedCount}
- Tutor Applications (Rejected): ${tutorRejectedResult.modifiedCount}
- Interview Applications (Approved): ${interviewApprovedResult.modifiedCount}
- Interview Applications (Rejected): ${interviewRejectedResult.modifiedCount}
Total Records Updated: ${
      tutorApprovedResult.modifiedCount +
      tutorRejectedResult.modifiedCount +
      interviewApprovedResult.modifiedCount +
      interviewRejectedResult.modifiedCount
    }
    `);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// If running as standalone script
if (require.main === module) {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillswap';
  
  mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
    .then(() => {
      console.log('📦 Connected to MongoDB');
      return migrateActionTimestamps();
    })
    .then(() => {
      console.log('✨ Closing database connection...');
      return mongoose.connection.close();
    })
    .then(() => {
      console.log('👋 Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { migrateActionTimestamps };
