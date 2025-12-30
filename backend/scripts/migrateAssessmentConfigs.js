/**
 * Migration Script: Assessment Configuration Update
 * 
 * Converts old universitySemesterConfig format to new collegeConfigs format
 * while maintaining backward compatibility.
 * 
 * Old format: universitySemesterConfig with separate institute, courses, and semesters fields
 * New format: collegeConfigs with collegeId, courseId, and compulsorySemesters per college
 * 
 * IMPORTANT:
 * - This migration is backward compatible - old format is preserved
 * - Old tests continue to work with getStudentAssessments logic
 * - New tests use the new collegeConfigs format
 */

const mongoose = require('mongoose');
const Assessment = require('../models/Assessment');

async function migrateAssessmentConfigs() {
  try {
    console.log('🔄 Starting Assessment Configuration Migration...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skillswap', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB\n');

    // Find all assessments with old universitySemesterConfig format
    const assessmentsWithOldConfig = await Assessment.find({
      universitySemesterConfig: { $exists: true, $ne: null, $not: { $size: 0 } },
      $or: [
        { collegeConfigs: { $exists: false } },
        { collegeConfigs: { $size: 0 } }
      ]
    });

    console.log(`📊 Found ${assessmentsWithOldConfig.length} assessments with old configuration format\n`);

    if (assessmentsWithOldConfig.length === 0) {
      console.log('✅ No assessments to migrate. All assessments are already in the new format or have no config.\n');
      await mongoose.disconnect();
      process.exit(0);
    }

    let migratedCount = 0;
    let skippedCount = 0;
    const errors = [];

    // Migrate each assessment
    for (const assessment of assessmentsWithOldConfig) {
      try {
        console.log(`\n📝 Processing Assessment: "${assessment.title}" (ID: ${assessment._id})`);

        if (!assessment.universitySemesterConfig || assessment.universitySemesterConfig.length === 0) {
          console.log('   ⏭️  Skipping - No configuration found');
          skippedCount++;
          continue;
        }

        // Convert old format to new format
        const newCollegeConfigs = [];

        for (const oldConfig of assessment.universitySemesterConfig) {
          // Old format: { instituteId, courses: [array], semesters: [array], isCompulsory }
          // New format: { collegeId, courseId (single), compulsorySemesters: [array] }
          
          if (!oldConfig.instituteId) {
            console.log('   ⚠️  Skipping old config - Missing instituteId');
            continue;
          }

          // If old config has courses array, create one config per course
          const coursesToProcess = oldConfig.courses && oldConfig.courses.length > 0 
            ? oldConfig.courses 
            : [null]; // If no courses specified, create a generic config

          for (const course of coursesToProcess) {
            const newConfig = {
              collegeId: oldConfig.instituteId,
              courseId: course || 'General', // Use 'General' if no course specified
              compulsorySemesters: oldConfig.semesters || [] // Use semesters as compulsory semesters
            };

            newCollegeConfigs.push(newConfig);
            console.log(`   ✓ Migrated: College ${oldConfig.instituteId} > Course: ${newConfig.courseId} > Compulsory Semesters: [${oldConfig.semesters?.join(', ')}]`);
          }
        }

        // Update the assessment with new format
        assessment.collegeConfigs = newCollegeConfigs;
        await assessment.save();

        console.log(`   ✅ Successfully migrated with ${newCollegeConfigs.length} college config(s)`);
        migratedCount++;

      } catch (error) {
        console.error(`   ❌ Error migrating assessment: ${error.message}`);
        errors.push({
          assessmentId: assessment._id,
          title: assessment.title,
          error: error.message
        });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎯 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully migrated: ${migratedCount} assessments`);
    console.log(`⏭️  Skipped: ${skippedCount} assessments`);
    console.log(`❌ Errors: ${errors.length} assessments`);
    console.log('='.repeat(60));

    if (errors.length > 0) {
      console.log('\n⚠️  MIGRATION ERRORS:\n');
      errors.forEach((err, index) => {
        console.log(`${index + 1}. Assessment: "${err.title}" (${err.assessmentId})`);
        console.log(`   Error: ${err.error}\n`);
      });
    }

    console.log('\n✅ Migration completed!\n');
    console.log('📌 NOTES:');
    console.log('   • Old universitySemesterConfig format has been preserved for backward compatibility');
    console.log('   • New assessments use collegeConfigs format');
    console.log('   • Existing assessment attempts are not affected');
    console.log('   • Students can still access assessments via the updated logic\n');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateAssessmentConfigs();
