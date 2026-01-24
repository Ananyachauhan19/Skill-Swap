const Institute = require('../models/Institute');
const User = require('../models/User');
const InstituteRewardTransaction = require('../models/InstituteRewardTransaction');
const ActivityLog = require('../models/ActivityLog');
const xlsx = require('xlsx');
const { getEmailTemplate } = require('../utils/dynamicEmailTemplate');
const cloudinary = require('../utils/cloudinary');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { sendMail } = require('../utils/sendMail');

// Helper function to generate student ID
const generateStudentId = (instituteId) => {
  const randomNumber = Math.floor(10000000 + Math.random() * 90000000);
  return `SSH-${instituteId}-${randomNumber}`;
};

// Helper function to generate random password
const generatePassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Create Institute
exports.createInstitute = async (req, res) => {
  try {
    const { instituteName, instituteId, instituteType, numberOfCourses, courses } = req.body;
    
    // Check if institute ID already exists
    const existingInstitute = await Institute.findOne({ instituteId: instituteId.toUpperCase() });
    if (existingInstitute) {
      return res.status(400).json({ message: 'Institute ID already exists' });
    }

    // Parse courses if provided as JSON string
    let parsedCourses = [];
    if (courses) {
      try {
        parsedCourses = typeof courses === 'string' ? JSON.parse(courses) : courses;
      } catch (e) {
        return res.status(400).json({ message: 'Invalid courses format' });
      }
    }

    // Validate number of courses matches actual courses
    const numCourses = parseInt(numberOfCourses) || 0;
    if (numCourses > 0 && parsedCourses.length !== numCourses) {
      return res.status(400).json({ 
        message: `Number of courses (${numCourses}) does not match provided courses (${parsedCourses.length})` 
      });
    }

    let campusBackgroundImageUrl = null;

    // Handle campus background image upload to Cloudinary
    if (req.file) {
      try {
        const uploadFolder = process.env.CLOUDINARY_INSTITUTE_FOLDER || 'SkillSwaphub/institutes';
        
        const streamUpload = () => {
          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: uploadFolder,
                resource_type: 'image',
                public_id: `${instituteId.toUpperCase()}_${Date.now()}`,
                transformation: [
                  { width: 1920, height: 1080, crop: 'fill', gravity: 'auto' },
                  { quality: 'auto' },
                ],
              },
              (error, result) => {
                if (error) return reject(error);
                resolve(result);
              }
            );
            stream.end(req.file.buffer);
          });
        };

        const result = await streamUpload();
        campusBackgroundImageUrl = result.secure_url;
        console.log('[Cloudinary] Institute image uploaded:', result.secure_url);
      } catch (e) {
        console.error('[Cloudinary] Unexpected error uploading institute image:', e.message || e);
      }
    }

    const institute = new Institute({
      instituteName,
      instituteId: instituteId.toUpperCase(),
      campusBackgroundImage: campusBackgroundImageUrl,
      instituteType,
      numberOfCourses: numCourses,
      courses: parsedCourses,
      campusAmbassador: req.user._id,
      campusAmbassadorEmail: (req.user.email || '').toLowerCase(),
      students: [],
    });

    await institute.save();

    // Log activity
    await ActivityLog.logActivity(req.campusAmbassador._id, 'Institute Added', {
      instituteName: institute.instituteName,
      metadata: {
        instituteId: institute.instituteId,
        instituteType: institute.instituteType,
        numberOfCourses: numCourses
      }
    });

    res.status(201).json({
      message: 'Institute created successfully',
      institute
    });
  } catch (error) {
    console.error('Create institute error:', error);
    res.status(500).json({ message: 'Error creating institute', error: error.message });
  }
};

// Get institutes managed by campus ambassador
exports.getMyInstitutes = async (req, res) => {
  try {
    const institutes = await Institute.find({ campusAmbassador: req.user._id });
    
    // Fetch aggregated transaction data for each institute
    const institutesWithStats = await Promise.all(
      institutes.map(async (institute) => {
        const transactions = await InstituteRewardTransaction.find({
          instituteId: institute._id
        });

        const totalSilverAssigned = transactions.reduce((sum, t) => sum + (t.totalSilverDistributed || 0), 0);
        const totalGoldenAssigned = transactions.reduce((sum, t) => sum + (t.totalGoldenDistributed || 0), 0);
        const assignmentEventsCount = transactions.length;

        return {
          ...institute.toObject(),
          totalSilverAssigned,
          totalGoldenAssigned,
          assignmentEventsCount
        };
      })
    );

    res.status(200).json({ institutes: institutesWithStats });
  } catch (error) {
    console.error('Get institutes error:', error);
    res.status(500).json({ message: 'Error fetching institutes', error: error.message });
  }
};

// Get institute by ID (for campus ambassadors)
exports.getInstituteById = async (req, res) => {
  try {
    const { id } = req.params;
    const institute = await Institute.findById(id);
    
    if (!institute) {
      return res.status(404).json({ message: 'Institute not found' });
    }

    res.status(200).json({ institute });
  } catch (error) {
    console.error('Get institute error:', error);
    res.status(500).json({ message: 'Error fetching institute', error: error.message });
  }
};

// Get student's institute data (for students to view their campus info)
exports.getStudentInstitute = async (req, res) => {
  try {
    // Get institute ID from authenticated user
    const studentInstituteId = req.user.instituteId;
    
    if (!studentInstituteId) {
      return res.status(404).json({ message: 'Student is not associated with any institute' });
    }

    // Find institute by instituteId (the unique string identifier, not MongoDB _id)
    const institute = await Institute.findOne({ instituteId: studentInstituteId });
    
    if (!institute) {
      return res.status(404).json({ message: 'Institute not found' });
    }

    // Return only necessary public information
    res.status(200).json({ 
      institute: {
        _id: institute._id,
        instituteName: institute.instituteName,
        instituteId: institute.instituteId,
        campusBackgroundImage: institute.campusBackgroundImage,
        instituteType: institute.instituteType
      }
    });
  } catch (error) {
    console.error('Get student institute error:', error);
    res.status(500).json({ message: 'Error fetching institute data', error: error.message });
  }
};

// Update Institute
exports.updateInstitute = async (req, res) => {
  try {
    const { id } = req.params;
    const { instituteName } = req.body;

    const institute = await Institute.findOne({
      _id: id,
      campusAmbassador: req.user._id
    });

    if (!institute) {
      return res.status(404).json({ message: 'Institute not found or unauthorized' });
    }

    // Update fields
    if (instituteName) institute.instituteName = instituteName;

    // Handle image update (upload to Cloudinary)
    if (req.file) {
      try {
        const uploadFolder = process.env.CLOUDINARY_INSTITUTE_FOLDER || 'SkillSwaphub/institutes';
        
        const streamUpload = () => {
          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: uploadFolder,
                resource_type: 'image',
                public_id: `${institute.instituteId}_${Date.now()}`,
                transformation: [
                  { width: 1920, height: 1080, crop: 'fill', gravity: 'auto' },
                  { quality: 'auto' },
                ],
              },
              (error, result) => {
                if (error) return reject(error);
                resolve(result);
              }
            );
            stream.end(req.file.buffer);
          });
        };

        const result = await streamUpload();
        institute.campusBackgroundImage = result.secure_url;
        console.log('[Cloudinary] Institute image updated:', result.secure_url);
      } catch (e) {
        console.error('[Cloudinary] Unexpected error updating institute image:', e.message || e);
      }
    }

    await institute.save();

    // Log activity
    await ActivityLog.logActivity(req.campusAmbassador._id, 'Institute Edited', {
      instituteName: institute.instituteName,
      metadata: {
        instituteId: institute.instituteId
      }
    });

    res.status(200).json({ message: 'Institute updated successfully', institute });
  } catch (error) {
    console.error('Update institute error:', error);
    res.status(500).json({ message: 'Error updating institute', error: error.message });
  }
};

// Upload Excel and onboard students with intelligent re-upload handling
exports.uploadStudents = async (req, res) => {
  try {
    const { instituteId } = req.params;
    const { perStudentSilver, perStudentGolden } = req.body;

    // Parse coin values from request body
    const silverCoinsPerStudent = parseInt(perStudentSilver) || 0;
    const goldCoinsPerStudent = parseInt(perStudentGolden) || 0;

    // Find institute
    const institute = await Institute.findOne({
      _id: instituteId,
      campusAmbassador: req.user._id
    });

    if (!institute) {
      return res.status(404).json({ message: 'Institute not found or unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an Excel file' });
    }

    // Parse Excel file
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    const results = {
      added: [],
      updated: [],
      skippedDuplicate: [],
      skippedDifferentInstitute: [],
      errors: [],
      emailsSent: 0,
      emailsFailed: 0
    };

    // Track all student user IDs linked to this institute
    const studentIds = new Set((institute.students || []).map(id => id.toString()));
    const emailQueue = []; // Store email tasks
    let validProcessedCount = 0;
    let totalSilverDistributed = 0;
    let totalGoldenDistributed = 0;

    for (const row of data) {
      try {
        const email = row.email?.toLowerCase().trim();
        const name = row.name?.trim();
        const course = row.course?.trim();
        const semester = row.semester ? String(row.semester).trim() : '';
        const classValue = row.class ? String(row.class).trim() : '';

        if (!email || !name) {
          results.errors.push({ email: email || 'unknown', name: name || 'unknown', reason: 'Missing email or name' });
          continue;
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
          // Case 1: Email exists but assigned to a different institute
          if (existingUser.instituteId && existingUser.instituteId !== institute.instituteId) {
            results.skippedDifferentInstitute.push({
              email,
              name,
              currentInstitute: existingUser.instituteName || existingUser.instituteId,
              reason: 'User already assigned to another institute'
            });
            continue;
          }

          // Case 2: Email exists for the same institute - check for changes
          const isSameInstitute = existingUser.instituteId === institute.instituteId;
          
          if (isSameInstitute) {
            // Build comparison object for duplicate detection
            const existingValues = {
              course: existingUser.course || '',
              semester: existingUser.semester || '',
              class: existingUser.class || ''
            };

            const newValues = {
              course: institute.instituteType === 'college' ? course : '',
              semester: institute.instituteType === 'college' ? semester : '',
              class: institute.instituteType === 'school' ? classValue : ''
            };

            // Check if all values are unchanged (duplicate)
            const isUnchanged = existingValues.course === newValues.course &&
                               existingValues.semester === newValues.semester &&
                               existingValues.class === newValues.class;

            if (isUnchanged) {
              // Case 2a: Complete duplicate - skip entirely (no wallet increment)
              results.skippedDuplicate.push({
                email,
                name,
                reason: 'No changes detected, wallet not incremented'
              });
              continue;
            } else {
              // Case 2b: Values changed (semester or other fields) - update and increment wallet
              if (institute.instituteType === 'college') {
                if (course) existingUser.course = course;
                if (semester) existingUser.semester = semester;
              }
              
              if (institute.instituteType === 'school' && classValue) {
                existingUser.class = classValue;
              }

              // Increment wallet coins
              existingUser.goldCoins = (existingUser.goldCoins || 0) + goldCoinsPerStudent;
              existingUser.silverCoins = (existingUser.silverCoins || 0) + silverCoinsPerStudent;

              await existingUser.save();
              
              validProcessedCount++;
              totalSilverDistributed += silverCoinsPerStudent;
              totalGoldenDistributed += goldCoinsPerStudent;
              
              results.updated.push({
                email,
                name,
                changes: {
                  course: newValues.course !== existingValues.course ? { old: existingValues.course, new: newValues.course } : null,
                  semester: newValues.semester !== existingValues.semester ? { old: existingValues.semester, new: newValues.semester } : null,
                  class: newValues.class !== existingValues.class ? { old: existingValues.class, new: newValues.class } : null
                },
                coinsAdded: { silver: silverCoinsPerStudent, golden: goldCoinsPerStudent }
              });

              studentIds.add(existingUser._id.toString());
            }
          } else {
            // Case 3: Email exists but not yet assigned to any institute - assign now
            const hadStudentId = !!existingUser.studentId;

            existingUser.instituteId = institute.instituteId;
            existingUser.instituteName = institute.instituteName;
            
            if (institute.instituteType === 'school' && classValue) {
              existingUser.class = classValue;
            }
            
            if (institute.instituteType === 'college') {
              if (course) existingUser.course = course;
              if (semester) existingUser.semester = semester;
            }

            // Generate student ID if not exists
            if (!existingUser.studentId) {
              existingUser.studentId = generateStudentId(institute.instituteId);
            }

            // Increment wallet coins
            existingUser.goldCoins = (existingUser.goldCoins || 0) + goldCoinsPerStudent;
            existingUser.silverCoins = (existingUser.silverCoins || 0) + silverCoinsPerStudent;

            await existingUser.save();
            
            validProcessedCount++;
            totalSilverDistributed += silverCoinsPerStudent;
            totalGoldenDistributed += goldCoinsPerStudent;
            
            results.added.push({
              email,
              name,
              studentId: existingUser.studentId,
              coinsAdded: { silver: silverCoinsPerStudent, golden: goldCoinsPerStudent }
            });

            studentIds.add(existingUser._id.toString());

            // Queue email for first-time campus addition
            emailQueue.push({
              user: existingUser,
              isNewUser: false,
              generatedPassword: null,
              instituteName: institute.instituteName,
              goldCoins: goldCoinsPerStudent,
              silverCoins: silverCoinsPerStudent
            });
          }
        } else {
          // Case 4: New user - create and assign to institute
          const [firstName, ...lastNameParts] = name.split(' ');
          const lastName = lastNameParts.join(' ');
          
          const username = email.split('@')[0] + Math.floor(Math.random() * 1000);
          const studentId = generateStudentId(institute.instituteId);
          const generatedPassword = generatePassword();
          const hashedPassword = await bcrypt.hash(generatedPassword, 10);

          const newUser = new User({
            firstName,
            lastName: lastName || '',
            email,
            username,
            password: hashedPassword,
            studentId,
            instituteId: institute.instituteId,
            instituteName: institute.instituteName,
            role: 'learner',
            goldCoins: goldCoinsPerStudent,
            silverCoins: silverCoinsPerStudent
          });

          if (institute.instituteType === 'school' && classValue) {
            newUser.class = classValue;
          }
          
          if (institute.instituteType === 'college') {
            if (course) newUser.course = course;
            if (semester) newUser.semester = semester;
          }

          await newUser.save();
          
          validProcessedCount++;
          totalSilverDistributed += silverCoinsPerStudent;
          totalGoldenDistributed += goldCoinsPerStudent;
          
          results.added.push({
            email,
            name,
            studentId: newUser.studentId,
            coinsAdded: { silver: silverCoinsPerStudent, golden: goldCoinsPerStudent }
          });

          studentIds.add(newUser._id.toString());

          // Queue email for new user
          emailQueue.push({
            user: newUser,
            isNewUser: true,
            generatedPassword,
            instituteName: institute.instituteName,
            goldCoins: goldCoinsPerStudent,
            silverCoins: silverCoinsPerStudent
          });
        }

      } catch (error) {
        results.errors.push({ email: row.email || 'unknown', name: row.name || 'unknown', reason: error.message });
      }
    }

    // Update student references and count on the institute document
    institute.students = Array.from(studentIds);
    institute.studentsCount = await User.countDocuments({ instituteId: institute.instituteId });
    await institute.save();

    // Create reward transaction record if coins were distributed
    if (validProcessedCount > 0 && (silverCoinsPerStudent > 0 || goldCoinsPerStudent > 0)) {
      const transaction = new InstituteRewardTransaction({
        instituteId: institute._id,
        instituteName: institute.instituteName,
        ambassadorId: req.user._id,
        ambassadorName: req.user.name || req.user.email,
        ambassadorEmail: req.user.email,
        source: 'EXCEL_UPLOAD',
        perStudentSilver: silverCoinsPerStudent,
        perStudentGolden: goldCoinsPerStudent,
        totalStudentsCount: validProcessedCount,
        totalSilverDistributed,
        totalGoldenDistributed,
        remarks: 'Excel upload - Student onboarding',
        status: 'completed',
        distributionDate: new Date()
      });

      await transaction.save();
    }

    // Send emails asynchronously
    for (const emailData of emailQueue) {
      try {
        if (emailData.isNewUser) {
          // Send welcome email to new users with credentials
          const courseInfo = emailData.user.course || emailData.user.semester || emailData.user.class
            ? `<p>Course Information:</p><ul style="margin:8px 0; padding-left:20px;">
                ${emailData.user.course ? `<li>Course: ${emailData.user.course}</li>` : ''}
                ${emailData.user.semester ? `<li>Semester: ${emailData.user.semester}</li>` : ''}
                ${emailData.user.class ? `<li>Class: ${emailData.user.class}</li>` : ''}
              </ul>`
            : '';
          
          const emailHtml = await getEmailTemplate('campusWelcomeNewUser', {
            instituteName: emailData.instituteName,
            firstName: emailData.user.firstName,
            username: emailData.user.username,
            password: emailData.generatedPassword,
            studentId: emailData.user.studentId,
            courseInfo
          });

          await sendMail({ 
            to: emailData.user.email, 
            subject: `Welcome to ${emailData.instituteName} Campus Dashboard - SkillSwap Hub`,
            html: emailHtml
          });
          results.emailsSent++;
        } else {
          // Send notification to existing users about campus addition
          const courseInfo = emailData.user.course || emailData.user.semester || emailData.user.class
            ? `<div style="margin:12px 0;">
                ${emailData.user.course ? `<p style="margin:8px 0;"><strong>Course:</strong> ${emailData.user.course}</p>` : ''}
                ${emailData.user.semester ? `<p style="margin:8px 0;"><strong>Semester:</strong> ${emailData.user.semester}</p>` : ''}
                ${emailData.user.class ? `<p style="margin:8px 0;"><strong>Class:</strong> ${emailData.user.class}</p>` : ''}
              </div>`
            : '';

          const emailHtml = await getEmailTemplate('campusAddedExistingUser', {
            firstName: emailData.user.firstName,
            instituteName: emailData.instituteName,
            studentId: emailData.user.studentId,
            courseInfo
          });

          await sendMail({ 
            to: emailData.user.email, 
            subject: `Added to ${emailData.instituteName} Campus Dashboard - SkillSwap Hub`,
            html: emailHtml
          });
          results.emailsSent++;
        }
      } catch (emailError) {
        console.error('Email send error:', emailError);
        results.emailsFailed++;
      }
    }

    res.status(200).json({
      message: 'Students processed successfully',
      summary: {
        totalRows: data.length,
        added: results.added.length,
        updated: results.updated.length,
        skippedDuplicate: results.skippedDuplicate.length,
        skippedDifferentInstitute: results.skippedDifferentInstitute.length,
        errors: results.errors.length,
        validProcessed: validProcessedCount,
        emailsSent: results.emailsSent,
        emailsFailed: results.emailsFailed
      },
      details: results,
      rewardDistribution: validProcessedCount > 0 ? {
        perStudentSilver: silverCoinsPerStudent,
        perStudentGolden: goldCoinsPerStudent,
        totalSilverDistributed,
        totalGoldenDistributed,
        recipientCount: validProcessedCount
      } : null
    });

    // Log activity (after response to avoid blocking)
    setImmediate(async () => {
      try {
        await ActivityLog.logActivity(req.campusAmbassador._id, 'Student Upload', {
          instituteName: institute.instituteName,
          metadata: {
            totalStudents: validProcessedCount,
            coinsAssigned: (silverCoinsPerStudent > 0 || goldCoinsPerStudent > 0),
            silverCoinsPerStudent: silverCoinsPerStudent,
            goldenCoinsPerStudent: goldCoinsPerStudent
          }
        });
      } catch (logError) {
        console.error('[ActivityLog] Error logging student upload:', logError);
      }
    });
  } catch (error) {
    console.error('Upload students error:', error);
    res.status(500).json({ message: 'Error uploading students', error: error.message });
  }
};

// Validate Campus ID
exports.validateCampusId = async (req, res) => {
  try {
    const { studentId } = req.body;

    const user = await User.findOne({ studentId });

    if (!user || !user.instituteId) {
      return res.status(404).json({ message: 'Invalid Campus ID' });
    }

    const institute = await Institute.findOne({ instituteId: user.instituteId });

    if (!institute) {
      return res.status(404).json({ message: 'Institute not found' });
    }

    res.status(200).json({
      message: 'Campus ID validated successfully',
      institute: {
        _id: institute._id,
        instituteName: institute.instituteName,
        instituteId: institute.instituteId,
        campusBackgroundImage: institute.campusBackgroundImage,
        goldCoins: institute.goldCoins,
        silverCoins: institute.silverCoins
      },
      user: {
        _id: user._id,
        studentId: user.studentId,
        firstName: user.firstName,
        lastName: user.lastName,
        class: user.class,
        course: user.course,
        semester: user.semester
      }
    });
  } catch (error) {
    console.error('Validate campus ID error:', error);
    res.status(500).json({ message: 'Error validating campus ID', error: error.message });
  }
};

// Get students of a specific institute (for filtering)
exports.getInstituteStudents = async (req, res) => {
  try {
    const { instituteId } = req.params;

    // First, find the institute to get its instituteId (string ID)
    const institute = await Institute.findOne({
      _id: instituteId,
      campusAmbassador: req.user._id
    });

    if (!institute) {
      return res.status(404).json({ message: 'Institute not found or unauthorized' });
    }

    // Query users by the instituteId string field
    const students = await User.find({ 
      instituteId: institute.instituteId
    })
      .select('firstName lastName email studentId class course semester profileImageUrl isActive')
      .limit(1000);

    // Map to include name field
    const studentsWithName = students.map(student => ({
      _id: student._id,
      name: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
      email: student.email,
      studentId: student.studentId,
      class: student.class,
      course: student.course,
      semester: student.semester,
      profileImageUrl: student.profileImageUrl,
      isActive: student.isActive
    }));

    res.status(200).json({ students: studentsWithName, count: studentsWithName.length });
  } catch (error) {
    console.error('Get institute students error:', error);
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
};

// Delete student from institute
exports.deleteInstituteStudent = async (req, res) => {
  try {
    const { instituteId, studentId } = req.params;

    // Verify institute belongs to this ambassador
    const institute = await Institute.findOne({
      _id: instituteId,
      campusAmbassador: req.user._id
    });

    if (!institute) {
      return res.status(404).json({ message: 'Institute not found or unauthorized' });
    }

    // Find the student
    const student = await User.findOne({
      _id: studentId,
      instituteId: institute.instituteId
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found in this institute' });
    }

    // Remove instituteId to unlink student from institute (keep coins)
    student.instituteId = null;
    student.class = null;
    student.course = null;
    student.semester = null;
    await student.save();

    res.status(200).json({ 
      message: 'Student removed from institute successfully',
      studentEmail: student.email
    });
  } catch (error) {
    console.error('Delete institute student error:', error);
    res.status(500).json({ message: 'Error removing student', error: error.message });
  }
};

// Update student in institute
exports.updateInstituteStudent = async (req, res) => {
  try {
    const { instituteId, studentId } = req.params;
    const { name, email, course, semester, class: studentClass } = req.body;

    // Verify institute belongs to this ambassador
    const institute = await Institute.findOne({
      _id: instituteId,
      campusAmbassador: req.user._id
    });

    if (!institute) {
      return res.status(404).json({ message: 'Institute not found or unauthorized' });
    }

    // Find the student
    const student = await User.findOne({
      _id: studentId,
      instituteId: institute.instituteId
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found in this institute' });
    }

    // Check if email is being changed
    if (email && email.toLowerCase() !== student.email.toLowerCase()) {
      // Check if new email exists in any institute (campus database)
      const existingUser = await User.findOne({
        email: email.toLowerCase(),
        instituteId: { $ne: null }
      });

      if (existingUser) {
        return res.status(400).json({ 
          message: 'This email is already registered with another student in the campus database' 
        });
      }
    }

    // Track if email is changing
    const emailChanged = email && email.toLowerCase() !== student.email.toLowerCase();
    const oldEmail = student.email;

    // Update student fields
    if (name) student.name = name.trim();
    if (email) student.email = email.trim().toLowerCase();
    
    if (institute.instituteType === 'school') {
      if (studentClass) student.class = studentClass;
    } else {
      if (course) student.course = course.trim();
      if (semester) student.semester = parseInt(semester);
    }

    await student.save();

    // Send email notification if email was changed
    if (emailChanged) {
      setImmediate(async () => {
        try {
          const courseInfo = student.course || student.semester || student.class
            ? `<div style="margin:12px 0;">
                ${student.course ? `<p style="margin:8px 0;"><strong>Course:</strong> ${student.course}</p>` : ''}
                ${student.semester ? `<p style="margin:8px 0;"><strong>Semester:</strong> ${student.semester}</p>` : ''}
                ${student.class ? `<p style="margin:8px 0;"><strong>Class:</strong> ${student.class}</p>` : ''}
              </div>`
            : '';

          const emailHtml = await getEmailTemplate('campusAddedExistingUser', {
            firstName: student.firstName || 'Student',
            instituteName: institute.instituteName,
            studentId: student.studentId,
            courseInfo
          });
          
          await sendMail({ 
            to: student.email, 
            subject: `Added to ${institute.instituteName} Campus Dashboard - SkillSwap Hub`,
            html: emailHtml
          });
          console.log(`Email sent to updated address: ${student.email} (previously: ${oldEmail})`);
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
        }
      });
    }

    res.status(200).json({ 
      message: 'Student updated successfully',
      student: {
        _id: student._id,
        name: student.name,
        email: student.email,
        class: student.class,
        course: student.course,
        semester: student.semester
      }
    });
  } catch (error) {
    console.error('Update institute student error:', error);
    res.status(500).json({ message: 'Error updating student', error: error.message });
  }
};

// Delete Institute
exports.deleteInstitute = async (req, res) => {
  try {
    const { id } = req.params;

    const institute = await Institute.findOne({
      _id: id,
      campusAmbassador: req.user._id
    });

    if (!institute) {
      return res.status(404).json({ message: 'Institute not found or unauthorized' });
    }

    const instituteName = institute.instituteName;
    const instituteId = institute.instituteId;

    await Institute.findByIdAndDelete(id);

    // Log activity (after deletion so it's preserved)
    await ActivityLog.logActivity(req.campusAmbassador._id, 'Institute Deleted', {
      instituteName: instituteName,
      metadata: {
        instituteId: instituteId
      }
    });

    res.status(200).json({ message: 'Institute deleted successfully' });
  } catch (error) {
    console.error('Delete institute error:', error);
    res.status(500).json({ message: 'Error deleting institute', error: error.message });
  }
};

// Distribute coins to all students of an institute
exports.distributeCoinsToInstitute = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { instituteId, perStudentSilver, perStudentGolden, remarks } = req.body;

    // Validate input
    const silverCoins = parseInt(perStudentSilver) || 0;
    const goldenCoins = parseInt(perStudentGolden) || 0;

    if (silverCoins < 0 || goldenCoins < 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Coin values cannot be negative' });
    }

    if (silverCoins === 0 && goldenCoins === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Must distribute at least Silver or Golden coins' });
    }

    // Find institute and verify ownership
    const institute = await Institute.findOne({
      _id: instituteId,
      campusAmbassador: req.user._id
    }).session(session);

    if (!institute) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Institute not found or unauthorized' });
    }

    console.log('[Distribute Coins] Searching for students with:', {
      instituteId: institute.instituteId,
      instituteMongoId: institute._id
    });

    // Fetch all active students of the institute
    // Note: instituteId on User model stores the institute.instituteId string (e.g., "HARV-001"), not the ObjectId
    // Don't filter by role as existing users may have any role
    const students = await User.find({
      instituteId: institute.instituteId,
      $or: [
        { isActive: true },
        { isActive: { $exists: false } }
      ]
    }).session(session);

    console.log('[Distribute Coins] Found students:', students.length);
    if (students.length > 0) {
      console.log('[Distribute Coins] Sample student:', {
        id: students[0]._id,
        email: students[0].email,
        instituteId: students[0].instituteId,
        role: students[0].role,
        isActive: students[0].isActive
      });
    }

    if (students.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'No active students found in this institute' });
    }

    // Update each student's wallet (increment, not replace)
    const updatePromises = students.map(student => {
      const updateFields = {};
      if (silverCoins > 0) {
        updateFields.silverCoins = (student.silverCoins || 0) + silverCoins;
      }
      if (goldenCoins > 0) {
        updateFields.goldCoins = (student.goldCoins || 0) + goldenCoins;
      }

      return User.findByIdAndUpdate(
        student._id,
        { $set: updateFields },
        { session, new: true }
      );
    });

    await Promise.all(updatePromises);

    // Calculate totals
    const totalStudentsCount = students.length;
    const totalSilverDistributed = silverCoins * totalStudentsCount;
    const totalGoldenDistributed = goldenCoins * totalStudentsCount;

    // Create transaction record
    const transaction = new InstituteRewardTransaction({
      instituteId: institute._id,
      instituteName: institute.instituteName,
      ambassadorId: req.user._id,
      ambassadorName: req.user.name || req.user.email,
      ambassadorEmail: req.user.email,
      source: 'DISTRIBUTE',
      perStudentSilver: silverCoins,
      perStudentGolden: goldenCoins,
      totalStudentsCount,
      totalSilverDistributed,
      totalGoldenDistributed,
      remarks: remarks || '',
      status: 'completed',
      distributionDate: new Date()
    });

    await transaction.save({ session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: 'Coins distributed successfully',
      transaction: {
        totalStudents: totalStudentsCount,
        perStudentSilver: silverCoins,
        perStudentGolden: goldenCoins,
        totalSilverDistributed,
        totalGoldenDistributed,
        distributionDate: transaction.distributionDate
      }
    });

    // Log activity (after response to avoid blocking)
    setImmediate(async () => {
      try {
        await ActivityLog.logActivity(req.campusAmbassador._id, 'Coins Distributed', {
          instituteName: institute.instituteName,
          metadata: {
            totalStudentsAffected: totalStudentsCount,
            silverCoinsPerStudent: silverCoins,
            goldenCoinsPerStudent: goldenCoins
          }
        });
      } catch (logError) {
        console.error('[ActivityLog] Error logging coin distribution:', logError);
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Distribute coins error:', error);
    res.status(500).json({ message: 'Error distributing coins', error: error.message });
  }
};

// Get reward transaction history for an institute
exports.getInstituteRewardHistory = async (req, res) => {
  try {
    const { instituteId } = req.params;

    // Verify institute ownership
    const institute = await Institute.findOne({
      _id: instituteId,
      campusAmbassador: req.user._id
    });

    if (!institute) {
      return res.status(404).json({ message: 'Institute not found or unauthorized' });
    }

    // Fetch all transactions for this institute
    const transactions = await InstituteRewardTransaction.find({ instituteId })
      .sort({ distributionDate: -1 })
      .lean();

    // Calculate cumulative totals
    let cumulativeSilver = 0;
    let cumulativeGolden = 0;

    const transactionsWithCumulative = transactions.reverse().map(tx => {
      cumulativeSilver += tx.totalSilverDistributed;
      cumulativeGolden += tx.totalGoldenDistributed;
      return {
        ...tx,
        cumulativeSilver,
        cumulativeGolden
      };
    }).reverse();

    res.status(200).json({
      institute: {
        id: institute._id,
        name: institute.instituteName,
        instituteId: institute.instituteId
      },
      transactions: transactionsWithCumulative,
      totals: {
        totalSilverDistributed: cumulativeSilver,
        totalGoldenDistributed: cumulativeGolden,
        totalTransactions: transactions.length
      }
    });
  } catch (error) {
    console.error('Get reward history error:', error);
    res.status(500).json({ message: 'Error fetching reward history', error: error.message });
  }
};

// Get student dashboard statistics
exports.getStudentDashboardStats = async (req, res) => {
  try {
    const studentId = req.user._id;
    let instituteId = req.user.instituteId;

    // If instituteId not in token, fetch from user document
    if (!instituteId) {
      const user = await User.findById(studentId).select('instituteId');
      instituteId = user?.instituteId;
    }

    if (!instituteId) {
      console.log('[Dashboard Stats] Student not associated with any institute:', studentId);
      return res.status(200).json({ 
        message: 'Student is not associated with any institute',
        studentStats: {
          totalSessions: 0,
          completedSessions: 0,
          pendingRequests: 0
        },
        institute: {
          totalStudents: 0,
          activeStudents: 0
        },
        topTutors: [],
        recentActivity: []
      });
    }

    console.log('[Dashboard Stats] Fetching stats for student:', studentId, 'institute:', instituteId);

    // Import required models
    const Session = require('../models/Session');
    const SessionRequest = require('../models/SessionRequest');

    // Get institute info
    const institute = await Institute.findOne({ instituteId });

    if (!institute) {
      return res.status(404).json({ message: 'Institute not found' });
    }

    // Count total students from the same institute
    const totalStudents = await User.countDocuments({ 
      instituteId,
      studentId: { $exists: true, $ne: null }
    });

    // Get active students (logged in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const activeStudents = await User.countDocuments({
      instituteId,
      studentId: { $exists: true, $ne: null },
      lastActivityAt: { $gte: sevenDaysAgo }
    });

    // Get student's sessions (created or participated)
    const mySessions = await Session.countDocuments({
      $or: [
        { creator: studentId },
        { requester: studentId }
      ]
    });

    // Get student's completed sessions
    const completedSessions = await Session.countDocuments({
      $or: [
        { creator: studentId },
        { requester: studentId }
      ],
      status: 'completed'
    });

    // Get pending session requests for this student
    const pendingRequests = await SessionRequest.countDocuments({
      $or: [
        { sender: studentId, status: 'pending' },
        { receiver: studentId, status: 'pending' }
      ]
    });

    // Get top tutors from the institute (by session count)
    const topTutors = await Session.aggregate([
      {
        $match: {
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$creator',
          sessionCount: { $sum: 1 }
        }
      },
      {
        $sort: { sessionCount: -1 }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'tutorInfo'
        }
      },
      {
        $unwind: '$tutorInfo'
      },
      {
        $match: {
          'tutorInfo.instituteId': instituteId
        }
      },
      {
        $project: {
          name: {
            $concat: ['$tutorInfo.firstName', ' ', { $ifNull: ['$tutorInfo.lastName', ''] }]
          },
          sessionCount: 1,
          ratingAverage: '$tutorInfo.ratingAverage',
          profilePic: { $ifNull: ['$tutorInfo.profileImageUrl', '$tutorInfo.profilePic'] }
        }
      }
    ]);

    // Get recent activity from institute (last 5 sessions)
    const recentSessions = await Session.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('creator', 'firstName lastName instituteId')
      .populate('requester', 'firstName lastName instituteId')
      .lean();

    const recentInstituteActivity = recentSessions
      .filter(s => s.creator?.instituteId === instituteId || s.requester?.instituteId === instituteId)
      .map(s => ({
        subject: s.subject,
        topic: s.topic,
        status: s.status,
        date: s.date,
        createdAt: s.createdAt
      }));

    res.status(200).json({
      institute: {
        name: institute.instituteName,
        type: institute.instituteType,
        totalStudents,
        activeStudents
      },
      studentStats: {
        totalSessions: mySessions,
        completedSessions,
        pendingRequests,
        coins: {
          gold: req.user.goldCoins || 0,
          silver: req.user.silverCoins || 0
        }
      },
      topTutors,
      recentActivity: recentInstituteActivity
    });
  } catch (error) {
    console.error('Get student dashboard stats error:', error);
    res.status(500).json({ message: 'Error fetching dashboard statistics', error: error.message });
  }
};

const buildStudentDisplayName = (user) => {
  const first = String(user?.firstName || '').trim();
  const last = String(user?.lastName || '').trim();
  if (first || last) return `${first}${last ? ` ${last}` : ''}`;
  const username = String(user?.username || '').trim();
  if (username) return username;
  const email = String(user?.email || '').trim();
  if (email && email.includes('@')) return email.split('@')[0];
  return 'Student';
};

const daysSince = (dateValue) => {
  const d = dateValue ? new Date(dateValue) : null;
  if (!d || Number.isNaN(d.getTime())) return null;
  const diffMs = Date.now() - d.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
};

const computeEngagement = ({ totalSessions, completedSessions, lastActivityAt }) => {
  const total = Number(totalSessions || 0);
  const completed = Number(completedSessions || 0);

  const completionRatio = total > 0 ? Math.min(1, Math.max(0, completed / total)) : 0;

  const inactivityDays = daysSince(lastActivityAt);
  let recencyScore = 0.15;
  if (inactivityDays === null) recencyScore = 0.15;
  else if (inactivityDays <= 2) recencyScore = 0.4;
  else if (inactivityDays <= 7) recencyScore = 0.28;
  else if (inactivityDays <= 14) recencyScore = 0.2;
  else recencyScore = 0.12;

  const score = 0.6 * completionRatio + recencyScore;
  const label = score >= 0.7 ? 'High' : score >= 0.45 ? 'Medium' : 'Low';
  return { score, label, inactivityDays };
};

// New API for the redesigned Campus Student Home dashboard
exports.getStudentHomeDashboard = async (req, res) => {
  try {
    const studentId = req.user._id;
    const instituteId = req.user.instituteId;

    if (!instituteId) {
      return res.status(404).json({ message: 'Student is not associated with any institute' });
    }

    const Session = require('../models/Session');
    const SessionRequest = require('../models/SessionRequest');
    const Contribution = require('../models/Contribution');

    const institute = await Institute.findOne({ instituteId }).lean();
    if (!institute) {
      return res.status(404).json({ message: 'Institute not found' });
    }

    const totalStudents = await User.countDocuments({
      instituteId,
      studentId: { $exists: true, $ne: null },
    });

    const totalSessions = await Session.countDocuments({
      $or: [{ creator: studentId }, { requester: studentId }],
    });

    const completedSessions = await Session.countDocuments({
      $or: [{ creator: studentId }, { requester: studentId }],
      status: 'completed',
    });

    const pendingRequests = await SessionRequest.countDocuments({
      $or: [
        { sender: studentId, status: 'pending' },
        { receiver: studentId, status: 'pending' },
      ],
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);
    const dateKeyLowerBound = thirtyDaysAgo.toISOString().slice(0, 10);

    const contributionAgg = await Contribution.aggregate([
      { $match: { userId: studentId, dateKey: { $gte: dateKeyLowerBound } } },
      { $group: { _id: null, total: { $sum: '$count' } } },
    ]);
    const contribution30d = Number(contributionAgg?.[0]?.total || 0);

    const engagement = computeEngagement({
      totalSessions,
      completedSessions,
      lastActivityAt: req.user.lastActivityAt,
    });

    const performanceLines = [
      `Sessions completed: ${completedSessions}/${totalSessions}`,
      `Engagement level: ${engagement.label}`,
      `Campus contribution (30 days): ${contribution30d}`,
    ];

    if (typeof engagement.inactivityDays === 'number') {
      performanceLines.push(`Last active: ${engagement.inactivityDays} day${engagement.inactivityDays === 1 ? '' : 's'} ago`);
    }

    const futureLines = [];
    if (completedSessions === 0) {
      futureLines.push('Complete your first session to unlock stronger campus visibility.');
    } else if (completedSessions > 0) {
      const nextTarget = completedSessions + 1;
      futureLines.push(`Aim for ${nextTarget} completed sessions to keep improving your learning curve.`);
    }
    if (pendingRequests > 0) {
      futureLines.push(`You have ${pendingRequests} pending request${pendingRequests === 1 ? '' : 's'} — respond to keep momentum.`);
    }
    if (engagement.label === 'Low') {
      futureLines.push('Try a short 1-on-1 this week to boost engagement and consistency.');
    } else if (engagement.label === 'High') {
      futureLines.push('Your engagement is strong — explore advanced topics or mentor juniors for higher impact.');
    }
    while (futureLines.length > 3) futureLines.pop();
    while (futureLines.length < 2) futureLines.push('Keep exploring new skills — steady progress compounds over time.');

    const thoughts = [];
    thoughts.push(
      totalSessions === 0
        ? 'Start with one focused session — consistency beats intensity.'
        : `You’ve shown up for ${totalSessions} session${totalSessions === 1 ? '' : 's'} — keep building the habit.`
    );
    thoughts.push(
      completedSessions === 0
        ? 'Your first completion is the biggest step — schedule a quick 1-on-1.'
        : `Completed ${completedSessions} session${completedSessions === 1 ? '' : 's'} — protect your momentum.`
    );
    thoughts.push(
      contribution30d === 0
        ? 'Add a small campus contribution today — even one action matters.'
        : `Your campus contribution this month is ${contribution30d} — keep your impact visible.`
    );
    if (pendingRequests > 0) {
      thoughts.push(`Clear pending requests to unlock faster progress and better matches.`);
    }

    res.status(200).json({
      hero: {
        studentName: buildStudentDisplayName(req.user),
        instituteName: institute.instituteName,
        campusBackgroundImage: institute.campusBackgroundImage || null,
      },
      activity: {
        mySessions: totalSessions,
        completed: completedSessions,
        pending: pendingRequests,
        campusStudents: totalStudents,
      },
      performance: {
        lines: performanceLines.slice(0, 4),
        futureLines,
      },
      thoughts: {
        items: thoughts.slice(0, 4),
        intervalMs: 5000,
      },
    });
  } catch (error) {
    console.error('Get student home dashboard error:', error);
    res.status(500).json({ message: 'Error fetching home dashboard data', error: error.message });
  }
};

// Get public campus statistics (no auth required)
exports.getPublicCampusStats = async (req, res) => {
  try {
    // Count total institutes
    const totalInstitutes = await Institute.countDocuments({ isActive: true });

    // Count total students with instituteId
    const totalStudents = await User.countDocuments({ 
      studentId: { $exists: true, $ne: null },
      instituteId: { $exists: true, $ne: null }
    });

    res.status(200).json({
      totalCampusCollaborations: totalInstitutes,
      totalStudentsOnDashboard: totalStudents
    });
  } catch (error) {
    console.error('Get public campus stats error:', error);
    res.status(500).json({ 
      message: 'Error fetching campus statistics', 
      error: error.message,
      // Return default values on error
      totalCampusCollaborations: 0,
      totalStudentsOnDashboard: 0
    });
  }
};

// Add a single student manually
exports.addSingleStudent = async (req, res) => {
  try {
    const { instituteId } = req.params;
    const { students, perStudentSilver, perStudentGolden } = req.body;

    // Parse coin values
    const silverCoinsPerStudent = parseInt(perStudentSilver) || 0;
    const goldCoinsPerStudent = parseInt(perStudentGolden) || 0;

    // Find institute
    const institute = await Institute.findOne({
      _id: instituteId,
      campusAmbassador: req.user._id
    });

    if (!institute) {
      return res.status(404).json({ message: 'Institute not found or unauthorized' });
    }

    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ message: 'Please provide student data' });
    }

    const student = students[0]; // We expect only one student
    const email = student.email?.toLowerCase().trim();
    const name = student.name?.trim();
    const course = student.course?.trim();
    const semester = student.semester ? String(student.semester).trim() : '';
    const classValue = student.class ? String(student.class).trim() : '';

    if (!email || !name) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    if (institute.instituteType === 'school' && !classValue) {
      return res.status(400).json({ message: 'Class is required for school students' });
    }

    if (institute.instituteType === 'college' && (!course || !semester)) {
      return res.status(400).json({ message: 'Course and semester are required for college students' });
    }

    // Track student IDs
    const studentIds = new Set((institute.students || []).map(id => id.toString()));

    // Check if user exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      // Email exists but assigned to different institute
      if (existingUser.instituteId && existingUser.instituteId !== institute.instituteId) {
        return res.status(400).json({
          message: 'User already assigned to another institute',
          existingInstitute: existingUser.instituteName || existingUser.instituteId
        });
      }

      // Same institute - check for changes
      if (existingUser.instituteId === institute.instituteId) {
        const existingValues = {
          course: existingUser.course || '',
          semester: existingUser.semester || '',
          class: existingUser.class || ''
        };

        const newValues = {
          course: institute.instituteType === 'college' ? course : '',
          semester: institute.instituteType === 'college' ? semester : '',
          class: institute.instituteType === 'school' ? classValue : ''
        };

        const isUnchanged = existingValues.course === newValues.course &&
                           existingValues.semester === newValues.semester &&
                           existingValues.class === newValues.class;

        if (isUnchanged) {
          return res.status(400).json({
            message: 'Student already exists with same details. No changes made.',
            student: { email, name }
          });
        }

        // Update with new data
        if (institute.instituteType === 'college') {
          if (course) existingUser.course = course;
          if (semester) existingUser.semester = semester;
        }
        
        if (institute.instituteType === 'school' && classValue) {
          existingUser.class = classValue;
        }

        // Increment wallet coins
        existingUser.goldCoins = (existingUser.goldCoins || 0) + goldCoinsPerStudent;
        existingUser.silverCoins = (existingUser.silverCoins || 0) + silverCoinsPerStudent;

        await existingUser.save();
        
        studentIds.add(existingUser._id.toString());

        // Update institute
        institute.students = Array.from(studentIds).map(id => new mongoose.Types.ObjectId(id));
        institute.studentsCount = studentIds.size;
        
        // Update institute coin tracking
        if (silverCoinsPerStudent > 0 || goldCoinsPerStudent > 0) {
          institute.perStudentSilverCoins = (institute.perStudentSilverCoins || 0) + silverCoinsPerStudent;
          institute.perStudentGoldCoins = (institute.perStudentGoldCoins || 0) + goldCoinsPerStudent;
          
          // Create transaction record
          const transaction = new InstituteRewardTransaction({
            instituteId: institute._id,
            instituteName: institute.instituteName,
            ambassadorId: req.user._id,
            ambassadorName: req.user.name || req.user.email,
            ambassadorEmail: req.user.email,
            source: 'MANUAL_UPDATE',
            perStudentSilver: silverCoinsPerStudent,
            perStudentGolden: goldCoinsPerStudent,
            totalStudentsCount: 1,
            totalSilverDistributed: silverCoinsPerStudent,
            totalGoldenDistributed: goldCoinsPerStudent,
            remarks: `Manual student update - ${name}`,
            status: 'completed',
            distributionDate: new Date()
          });
          await transaction.save();
        }
        
        await institute.save();

        // Log activity
        setImmediate(async () => {
          try {
            await ActivityLog.logActivity(req.campusAmbassador._id, 'Student Upload', {
              instituteName: institute.instituteName,
              metadata: {
                totalStudents: 1,
                coinsAssigned: silverCoinsPerStudent > 0 || goldCoinsPerStudent > 0,
                silverCoinsPerStudent,
                goldenCoinsPerStudent: goldCoinsPerStudent
              }
            });
          } catch (logError) {
            console.error('[ActivityLog] Error logging student upload:', logError);
          }
        });

        // Send email notification about update
        setImmediate(async () => {
          try {
            const tpl = emailTemplates.campusDashboardUpdatedCoins({
              firstName: existingUser.firstName,
              instituteName: institute.instituteName,
              goldCoins: goldCoinsPerStudent,
              silverCoins: silverCoinsPerStudent
            });
            await sendMail({ to: existingUser.email, subject: tpl.subject, html: tpl.html });
            console.log(`Email sent to updated student: ${existingUser.email}`);
          } catch (emailError) {
            console.error('Error sending email to updated student:', emailError);
          }
        });

        return res.status(200).json({
          success: true,
          message: 'Student updated successfully',
          student: { email, name },
          coinsAdded: { silver: silverCoinsPerStudent, golden: goldCoinsPerStudent }
        });
      }

      // Email exists but not assigned to any institute - assign now
      existingUser.instituteId = institute.instituteId;
      existingUser.instituteName = institute.instituteName;
      
      if (institute.instituteType === 'school' && classValue) {
        existingUser.class = classValue;
      }
      
      if (institute.instituteType === 'college') {
        if (course) existingUser.course = course;
        if (semester) existingUser.semester = semester;
      }

      // Generate student ID if not exists
      if (!existingUser.studentId) {
        existingUser.studentId = generateStudentId(institute.instituteId);
      }

      // Increment wallet coins
      existingUser.goldCoins = (existingUser.goldCoins || 0) + goldCoinsPerStudent;
      existingUser.silverCoins = (existingUser.silverCoins || 0) + silverCoinsPerStudent;

      await existingUser.save();
      
      studentIds.add(existingUser._id.toString());

      // Update institute
      institute.students = Array.from(studentIds).map(id => new mongoose.Types.ObjectId(id));
      institute.studentsCount = studentIds.size;
      
      // Update institute coin tracking
      if (silverCoinsPerStudent > 0 || goldCoinsPerStudent > 0) {
        institute.perStudentSilverCoins = (institute.perStudentSilverCoins || 0) + silverCoinsPerStudent;
        institute.perStudentGoldCoins = (institute.perStudentGoldCoins || 0) + goldCoinsPerStudent;
        
        // Create transaction record
        const transaction = new InstituteRewardTransaction({
          instituteId: institute._id,
          instituteName: institute.instituteName,
          ambassadorId: req.user._id,
          ambassadorName: req.user.name || req.user.email,
          ambassadorEmail: req.user.email,
          source: 'MANUAL_ASSIGN',
          perStudentSilver: silverCoinsPerStudent,
          perStudentGolden: goldCoinsPerStudent,
          totalStudentsCount: 1,
          totalSilverDistributed: silverCoinsPerStudent,
          totalGoldenDistributed: goldCoinsPerStudent,
          remarks: `Manual student assignment - ${name}`,
          status: 'completed',
          distributionDate: new Date()
        });
        await transaction.save();
      }
      
      await institute.save();

      // Log activity
      setImmediate(async () => {
        try {
          await ActivityLog.logActivity(req.campusAmbassador._id, 'Student Upload', {
            instituteName: institute.instituteName,
            metadata: {
              totalStudents: 1,
              coinsAssigned: silverCoinsPerStudent > 0 || goldCoinsPerStudent > 0,
              silverCoinsPerStudent,
              goldenCoinsPerStudent: goldCoinsPerStudent
            }
          });
        } catch (logError) {
          console.error('[ActivityLog] Error logging student upload:', logError);
        }
      });

      // Send email notification about campus addition
      setImmediate(async () => {
        try {
          const tpl = emailTemplates.campusExistingUserAdded({
            firstName: existingUser.firstName,
            studentId: existingUser.studentId,
            instituteName: institute.instituteName,
            course: existingUser.course,
            semester: existingUser.semester,
            className: existingUser.class,
            goldCoins: goldCoinsPerStudent,
            silverCoins: silverCoinsPerStudent
          });
          await sendMail({ to: existingUser.email, subject: tpl.subject, html: tpl.html });
          console.log(`Email sent to existing user added to campus: ${existingUser.email}`);
        } catch (emailError) {
          console.error('Error sending email to existing user:', emailError);
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Student added successfully',
        student: { email, name },
        coinsAdded: { silver: silverCoinsPerStudent, golden: goldCoinsPerStudent }
      });
    }

    // Create new user
    const generatedPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);
    
    const newUser = new User({
      email,
      username: email.split('@')[0] + Math.floor(Math.random() * 1000), // Generate unique username
      firstName: name.split(' ')[0],
      lastName: name.split(' ').slice(1).join(' ') || '',
      instituteId: institute.instituteId,
      instituteName: institute.instituteName,
      studentId: generateStudentId(institute.instituteId),
      goldCoins: goldCoinsPerStudent,
      silverCoins: silverCoinsPerStudent,
      password: hashedPassword,
      role: 'learner'
    });

    if (institute.instituteType === 'school' && classValue) {
      newUser.class = classValue;
    }
    
    if (institute.instituteType === 'college') {
      if (course) newUser.course = course;
      if (semester) newUser.semester = semester;
    }

    await newUser.save();
    
    studentIds.add(newUser._id.toString());

    // Update institute
    institute.students = Array.from(studentIds).map(id => new mongoose.Types.ObjectId(id));
    institute.studentsCount = studentIds.size;
    
    // Update institute coin tracking
    if (silverCoinsPerStudent > 0 || goldCoinsPerStudent > 0) {
      institute.perStudentSilverCoins = (institute.perStudentSilverCoins || 0) + silverCoinsPerStudent;
      institute.perStudentGoldCoins = (institute.perStudentGoldCoins || 0) + goldCoinsPerStudent;
      
      // Create transaction record
      const transaction = new InstituteRewardTransaction({
        instituteId: institute._id,
        instituteName: institute.instituteName,
        ambassadorId: req.user._id,
        ambassadorName: req.user.name || req.user.email,
        ambassadorEmail: req.user.email,
        source: 'MANUAL_ADD',
        perStudentSilver: silverCoinsPerStudent,
        perStudentGolden: goldCoinsPerStudent,
        totalStudentsCount: 1,
        totalSilverDistributed: silverCoinsPerStudent,
        totalGoldenDistributed: goldCoinsPerStudent,
        remarks: `Manual student addition - ${name}`,
        status: 'completed',
        distributionDate: new Date()
      });
      await transaction.save();
    }
    
    await institute.save();

    // Log activity
    setImmediate(async () => {
      try {
        await ActivityLog.logActivity(req.campusAmbassador._id, 'Student Upload', {
          instituteName: institute.instituteName,
          metadata: {
            totalStudents: 1,
            coinsAssigned: silverCoinsPerStudent > 0 || goldCoinsPerStudent > 0,
            silverCoinsPerStudent,
            goldenCoinsPerStudent: goldCoinsPerStudent
          }
        });
      } catch (logError) {
        console.error('[ActivityLog] Error logging student upload:', logError);
      }
    });

    // Send welcome email to new user with credentials
    setImmediate(async () => {
      try {
        const tpl = emailTemplates.campusNewUserWelcome({
          firstName: newUser.firstName,
          username: newUser.username,
          password: generatedPassword,
          studentId: newUser.studentId,
          instituteName: institute.instituteName,
          goldCoins: goldCoinsPerStudent,
          silverCoins: silverCoinsPerStudent
        });
        await sendMail({ to: newUser.email, subject: tpl.subject, html: tpl.html });
        console.log(`Welcome email sent to new user: ${newUser.email}`);
      } catch (emailError) {
        console.error('Error sending welcome email to new user:', emailError);
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Student created successfully',
      student: { email, name },
      coinsAdded: { silver: silverCoinsPerStudent, golden: goldCoinsPerStudent }
    });

  } catch (error) {
    console.error('Error adding single student:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Update institute courses manually
exports.updateInstituteCourses = async (req, res) => {
  try {
    const { instituteId } = req.params;
    const { courses, numberOfCourses } = req.body;

    // Find the institute
    const institute = await Institute.findOne({
      _id: instituteId,
      campusAmbassador: req.user._id
    });

    if (!institute) {
      return res.status(404).json({ message: 'Institute not found or not authorized' });
    }

    // Parse courses if provided as JSON string
    let parsedCourses = [];
    if (courses) {
      try {
        parsedCourses = typeof courses === 'string' ? JSON.parse(courses) : courses;
      } catch (e) {
        return res.status(400).json({ message: 'Invalid courses format' });
      }
    }

    // Validate
    if (!Array.isArray(parsedCourses)) {
      return res.status(400).json({ message: 'Courses must be an array' });
    }

    // Clean course names
    parsedCourses = parsedCourses.map(c => c.toString().trim()).filter(c => c.length > 0);

    // Remove duplicates
    parsedCourses = [...new Set(parsedCourses)];

    // Update institute
    institute.courses = parsedCourses;
    institute.numberOfCourses = parsedCourses.length;
    await institute.save();

    res.status(200).json({
      message: 'Courses updated successfully',
      coursesCount: parsedCourses.length,
      courses: parsedCourses,
      institute
    });
  } catch (error) {
    console.error('Update institute courses error:', error);
    res.status(500).json({ message: 'Error updating courses', error: error.message });
  }
};

// Get courses for a specific institute
exports.getInstituteCourses = async (req, res) => {
  try {
    const { instituteId } = req.params;

    const institute = await Institute.findOne({
      _id: instituteId,
      campusAmbassador: req.user._id
    }).select('courses numberOfCourses instituteName instituteId');

    if (!institute) {
      return res.status(404).json({ message: 'Institute not found or not authorized' });
    }

    res.status(200).json({
      courses: institute.courses || [],
      numberOfCourses: institute.numberOfCourses || 0,
      instituteName: institute.instituteName,
      instituteId: institute.instituteId
    });
  } catch (error) {
    console.error('Get institute courses error:', error);
    res.status(500).json({ message: 'Error fetching courses', error: error.message });
  }
};

// Get college assessments with analytics
exports.getCollegeAssessments = async (req, res) => {
  try {
    const { instituteId } = req.params;
    const Assessment = require('../models/Assessment');
    const AssessmentAttempt = require('../models/AssessmentAttempt');

    // Verify college belongs to this campus ambassador
    const institute = await Institute.findOne({
      _id: instituteId,
      campusAmbassador: req.user._id
    });

    if (!institute) {
      return res.status(404).json({ message: 'Institute not found or not authorized' });
    }

    // Find all assessments for this college
    const assessments = await Assessment.find({
      'collegeConfigs.collegeId': instituteId
    }).sort({ createdAt: -1 }).lean();

    // For each assessment, gather analytics
    const assessmentAnalytics = await Promise.all(assessments.map(async (assessment) => {
      // Find this college's config
      const collegeConfig = assessment.collegeConfigs?.find(
        c => c.collegeId.toString() === instituteId.toString()
      );

      if (!collegeConfig) return null;

      const courseId = collegeConfig.courseId;
      const compulsorySemesters = collegeConfig.compulsorySemesters || [];

      console.log(`[Assessment Analytics] Processing assessment: ${assessment.title}`);
      console.log(`[Assessment Analytics] Institute ID: ${instituteId}, Course ID: ${courseId}`);
      console.log(`[Assessment Analytics] Compulsory Semesters: ${JSON.stringify(compulsorySemesters)}`);

      // Get all students in this college for this course
      // The instituteId might be stored as ObjectId in User collection
      const instituteObjectId = mongoose.Types.ObjectId.isValid(instituteId) 
        ? new mongoose.Types.ObjectId(instituteId) 
        : instituteId;

      let students = await User.find({
        $or: [
          { instituteId: instituteId.toString() },
          { instituteId: instituteObjectId },
          { instituteName: institute.instituteName },
          { instituteName: institute.instituteId }
        ],
        course: courseId,
        role: 'learner'
      }).select('_id firstName lastName username email semester course instituteId instituteName').lean();

      // If no students found, try without course filter to debug
      if (students.length === 0) {
        console.log(`[Assessment Analytics] No students found with course filter. Checking all students in college...`);
        const allCollegeStudents = await User.find({
          $or: [
            { instituteId: instituteId.toString() },
            { instituteId: instituteObjectId },
            { instituteName: institute.instituteName },
            { instituteName: institute.instituteId }
          ],
          role: 'learner'
        }).select('_id firstName lastName username course semester instituteId instituteName').lean();
        console.log(`[Assessment Analytics] Total students in college: ${allCollegeStudents.length}`);
        if (allCollegeStudents.length > 0) {
          console.log(`[Assessment Analytics] Sample student instituteId type:`, typeof allCollegeStudents[0].instituteId, allCollegeStudents[0].instituteId);
          console.log(`[Assessment Analytics] Sample courses in college:`, [...new Set(allCollegeStudents.map(s => s.course))]);
        } else {
          // Check if there are any students at all
          const anyStudents = await User.find({ role: 'learner' }).select('_id firstName lastName username instituteId instituteName course semester').limit(3).lean();
          console.log(`[Assessment Analytics] Sample of ANY students in database:`, anyStudents.length);
          if (anyStudents.length > 0) {
            console.log(`[Assessment Analytics] Full student record sample:`, JSON.stringify(anyStudents[0], null, 2));
            console.log(`[Assessment Analytics] Looking for institute with _id:`, instituteId);
            console.log(`[Assessment Analytics] Looking for institute with name:`, institute.instituteName);
          }
        }
      }

      console.log(`[Assessment Analytics] Students found matching course '${courseId}': ${students.length}`);
      if (students.length > 0) {
        console.log(`[Assessment Analytics] Sample student:`, JSON.stringify(students[0]));
      }

      // Get all attempts for this assessment from these students
      const studentIds = students.map(s => s._id);
      
      console.log(`[Assessment Analytics] Looking for attempts with assessmentId:`, assessment._id);
      console.log(`[Assessment Analytics] Student IDs to match:`, studentIds.map(id => id.toString()));
      
      // First, check all attempts for this assessment regardless of status
      const allAttempts = await AssessmentAttempt.find({
        assessmentId: assessment._id
      }).lean();
      
      console.log(`[Assessment Analytics] Total attempts for this assessment (any status):`, allAttempts.length);
      if (allAttempts.length > 0) {
        console.log(`[Assessment Analytics] Full attempt record:`, JSON.stringify(allAttempts[0], null, 2));
        console.log(`[Assessment Analytics] Attempt user field names:`, Object.keys(allAttempts[0]).filter(k => k.toLowerCase().includes('user')));
      }
      
      const attempts = await AssessmentAttempt.find({
        assessmentId: assessment._id,
        studentId: { $in: studentIds },
        status: 'submitted'
      }).select('studentId score marksObtained submittedAt startedAt createdAt updatedAt timeTaken violations').lean();

      console.log(`[Assessment Analytics] Attempts found (submitted status, matching students): ${attempts.length}`);

      // Group by semester
      const semesterData = {};
      students.forEach(student => {
        const sem = parseInt(student.semester) || student.semester; // Handle both string and number
        if (!semesterData[sem]) {
          semesterData[sem] = {
            semester: sem,
            isCompulsory: compulsorySemesters.includes(parseInt(sem)),
            totalStudents: 0,
            attemptedCount: 0,
            notAttemptedCount: 0,
            attempts: []
          };
        }
        semesterData[sem].totalStudents++;
        
        // Find student's attempt
        const attempt = attempts.find(a => a.studentId.toString() === student._id.toString());
        if (attempt) {
          semesterData[sem].attemptedCount++;
          const studentName = student.firstName || student.lastName 
            ? `${student.firstName || ''} ${student.lastName || ''}`.trim()
            : student.username || 'Unknown Student';
          
          // Calculate time taken in seconds
          const startTime = new Date(attempt.startedAt || attempt.createdAt);
          const endTime = new Date(attempt.submittedAt);
          const timeTakenSeconds = Math.floor((endTime - startTime) / 1000);
          
          // Extract violation details
          const violationTypes = (attempt.violations || []).map(v => v.type || 'unknown');
          
          semesterData[sem].attempts.push({
            studentId: student._id,
            studentName: studentName,
            studentEmail: student.email,
            marksObtained: attempt.score || attempt.marksObtained || 0,
            totalMarks: assessment.totalMarks,
            timeTaken: timeTakenSeconds > 0 ? timeTakenSeconds : 0,
            completedAt: attempt.submittedAt || attempt.updatedAt,
            violations: attempt.violations?.length || 0,
            violationTypes: violationTypes,
            violationDetected: (attempt.violations?.length || 0) > 0
          });
        } else {
          semesterData[sem].notAttemptedCount++;
        }
      });

      // Split into compulsory and optional
      const compulsory = [];
      const optional = [];
      Object.values(semesterData).forEach(sd => {
        if (sd.isCompulsory) {
          compulsory.push(sd);
        } else {
          optional.push(sd);
        }
      });

      // Sort by semester
      compulsory.sort((a, b) => a.semester - b.semester);
      optional.sort((a, b) => a.semester - b.semester);

      // Calculate totals
      const totalStudents = students.length;
      const totalAttempted = attempts.length;
      const totalNotAttempted = totalStudents - totalAttempted;

      // Check if expired
      const now = new Date();
      const isExpired = assessment.endTime && new Date(assessment.endTime) < now;
      const isActive = !isExpired && (!assessment.startTime || new Date(assessment.startTime) <= now);

      return {
        assessmentId: assessment._id,
        title: assessment.title,
        description: assessment.description,
        duration: assessment.duration,
        totalMarks: assessment.totalMarks,
        questionCount: assessment.questionCount,
        createdAt: assessment.createdAt,
        startTime: assessment.startTime,
        endTime: assessment.endTime,
        status: isExpired ? 'Expired' : isActive ? 'Active' : 'Scheduled',
        courseId,
        compulsorySemesters,
        optionalSemesters: optional.map(o => o.semester),
        totalStudents,
        totalAttempted,
        totalNotAttempted,
        compulsoryData: compulsory,
        optionalData: optional
      };
    }));

    // Filter out null entries
    const validAssessments = assessmentAnalytics.filter(a => a !== null);

    res.status(200).json({
      college: {
        _id: institute._id,
        instituteName: institute.instituteName,
        instituteId: institute.instituteId
      },
      assessments: validAssessments,
      totalAssessments: validAssessments.length
    });

  } catch (error) {
    console.error('Get college assessments error:', error);
    res.status(500).json({ message: 'Error fetching college assessments', error: error.message });
  }
};

// Get assessment attempt details with questions and answers for answer sheet view
exports.getAssessmentAttemptDetails = async (req, res) => {
  try {
    const { studentId, assessmentId } = req.params;
    const Assessment = require('../models/Assessment');
    const AssessmentAttempt = require('../models/AssessmentAttempt');

    console.log('[Answer Sheet] Fetching details for assessmentId:', assessmentId, 'studentId:', studentId);

    // Find the assessment
    const assessment = await Assessment.findById(assessmentId).lean();
    if (!assessment) {
      console.log('[Answer Sheet] Assessment not found');
      return res.status(404).json({ message: 'Assessment not found' });
    }

    console.log('[Answer Sheet] Assessment found:', assessment.title);
    console.log('[Answer Sheet] College configs:', assessment.collegeConfigs);

    // Verify this assessment belongs to one of the campus ambassador's institutes
    const instituteIds = assessment.collegeConfigs?.map(c => c.collegeId.toString()) || [];
    console.log('[Answer Sheet] Institute IDs from assessment:', instituteIds);
    console.log('[Answer Sheet] Campus ambassador ID:', req.campusAmbassador._id);
    console.log('[Answer Sheet] User ID:', req.user._id);

    const institutes = await Institute.find({
      _id: { $in: instituteIds },
      campusAmbassador: req.user._id
    }).select('_id instituteName');

    console.log('[Answer Sheet] Matching institutes found:', institutes.length);
    if (institutes.length > 0) {
      console.log('[Answer Sheet] Institute details:', institutes);
    }

    if (institutes.length === 0) {
      console.log('[Answer Sheet] Authorization failed - no matching institutes');
      return res.status(403).json({ message: 'Not authorized to view this assessment' });
    }

    // Find the student's attempt
    const attempt = await AssessmentAttempt.findOne({
      assessmentId,
      studentId,
      status: 'submitted'
    }).lean();

    if (!attempt) {
      console.log('[Answer Sheet] Assessment attempt not found');
      return res.status(404).json({ message: 'Assessment attempt not found' });
    }

    console.log('[Answer Sheet] Attempt found, score:', attempt.score);

    // Return assessment questions and student's answers
    res.status(200).json({
      assessment: {
        title: assessment.title,
        totalMarks: assessment.totalMarks,
        questions: assessment.questions
      },
      attempt: {
        score: attempt.score,
        answers: attempt.answers,
        submittedAt: attempt.submittedAt,
        timeTaken: Math.floor((new Date(attempt.submittedAt) - new Date(attempt.startedAt)) / 1000 / 60)
      }
    });

  } catch (error) {
    console.error('Get assessment attempt details error:', error);
    res.status(500).json({ message: 'Error fetching assessment attempt details', error: error.message });
  }
};


// Get my activity logs (for ambassador self-view)
exports.getMyActivityLogs = async (req, res) => {
  try {
    const ActivityLog = require('../models/ActivityLog');
    const { page = 1, limit = 20, actionType } = req.query;
    
    const query = { ambassadorId: req.campusAmbassador._id };
    
    // Filter by action type if provided
    if (actionType && actionType !== 'all') {
      query.actionType = actionType;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [activities, totalCount] = await Promise.all([
      ActivityLog.find(query)
        .sort({ performedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      ActivityLog.countDocuments(query)
    ]);

    res.status(200).json({
      activities,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        hasMore: skip + activities.length < totalCount
      }
    });
  } catch (error) {
    console.error('Get my activity logs error:', error);
    res.status(500).json({ message: 'Error fetching activity logs', error: error.message });
  }
};

// Get my activity stats (for ambassador self-view)
exports.getMyActivityStats = async (req, res) => {
  try {
    const ActivityLog = require('../models/ActivityLog');
    const mongoose = require('mongoose');

    const stats = await ActivityLog.aggregate([
      { $match: { ambassadorId: new mongoose.Types.ObjectId(req.campusAmbassador._id) } },
      { $group: {
        _id: '$actionType',
        count: { $sum: 1 }
      }},
      { $sort: { count: -1 } }
    ]);

    const totalActivities = stats.reduce((sum, stat) => sum + stat.count, 0);

    // Calculate cumulative student count and coin distribution from all uploads
    const studentUploadStats = await ActivityLog.aggregate([
      { 
        $match: { 
          ambassadorId: new mongoose.Types.ObjectId(req.campusAmbassador._id),
          actionType: 'Student Upload'
        } 
      },
      { 
        $group: {
          _id: null,
          totalStudents: { $sum: { $ifNull: ['$metadata.totalStudents', 0] } },
          totalSilverCoins: { $sum: { 
            $multiply: [
              { $ifNull: ['$metadata.totalStudents', 0] },
              { $ifNull: ['$metadata.silverCoinsPerStudent', 0] }
            ]
          } },
          totalGoldenCoins: { $sum: { 
            $multiply: [
              { $ifNull: ['$metadata.totalStudents', 0] },
              { $ifNull: ['$metadata.goldenCoinsPerStudent', 0] }
            ]
          } }
        }
      }
    ]);

    const uploadTotals = studentUploadStats.length > 0 ? studentUploadStats[0] : {
      totalStudents: 0,
      totalSilverCoins: 0,
      totalGoldenCoins: 0
    };

    res.status(200).json({
      stats: stats.map(s => ({
        actionType: s._id,
        count: s.count
      })),
      totalActivities,
      studentUploadTotals: {
        totalStudentsUploaded: uploadTotals.totalStudents,
        totalSilverCoinsDistributed: uploadTotals.totalSilverCoins,
        totalGoldenCoinsDistributed: uploadTotals.totalGoldenCoins
      }
    });
  } catch (error) {
    console.error('Get my activity stats error:', error);
    res.status(500).json({ message: 'Error fetching activity stats', error: error.message });
  }
};

// Get student rankings for institute (overall)
exports.getInstituteRankings = async (req, res) => {
  try {
    const { instituteId } = req.params;
    const { limit = 10 } = req.query;

    // Verify institute exists
    const institute = await Institute.findOne({ instituteId: instituteId.toUpperCase() });
    if (!institute) {
      return res.status(404).json({ message: 'Institute not found' });
    }

    // Get all students from this institute
    const students = await User.find({ instituteId: instituteId.toUpperCase() }).select('_id firstName lastName username profilePic profileImageUrl');

    if (students.length === 0) {
      return res.status(200).json({ rankings: [] });
    }

    const studentIds = students.map(s => s._id);

    // Import models
    const Session = require('../models/Session');
    const QuizementAttempt = require('../models/QuizementAttempt');

    // Calculate rankings for each student
    const rankingsPromises = studentIds.map(async (studentId) => {
      const student = students.find(s => s._id.equals(studentId));

      // Count sessions as tutor (creator)
      const sessionsAsTutor = await Session.countDocuments({
        creator: studentId,
        status: 'completed'
      });

      // Count sessions as learner (requester)
      const sessionsAsLearner = await Session.countDocuments({
        requester: studentId,
        status: 'completed'
      });

      // Get total quiz marks
      const quizAttempts = await QuizementAttempt.find({
        userId: studentId,
        finished: true
      }).select('score');

      const totalQuizMarks = quizAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0);

      // Calculate total score: sessions + quiz marks
      const totalSessions = sessionsAsTutor + sessionsAsLearner;
      const totalScore = totalSessions + totalQuizMarks;

      return {
        studentId: student._id,
        firstName: student.firstName || '',
        lastName: student.lastName || '',
        username: student.username,
        profilePic: student.profileImageUrl || student.profilePic || '',
        sessionsAsTutor,
        sessionsAsLearner,
        totalSessions,
        totalQuizMarks,
        totalScore
      };
    });

    let rankings = await Promise.all(rankingsPromises);

    // Sort by total score (descending)
    rankings.sort((a, b) => b.totalScore - a.totalScore);

    // Add rank
    rankings = rankings.map((ranking, index) => ({
      ...ranking,
      rank: index + 1
    }));

    // Limit results if needed
    const limitedRankings = rankings.slice(0, parseInt(limit));

    // Get current user's ranking if they're not in top 3 and userId is provided
    let userRanking = null;
    if (req.user && req.user._id) {
      const userRank = rankings.find(r => r.studentId.equals(req.user._id));
      if (userRank && userRank.rank > parseInt(limit)) {
        userRanking = userRank;
      }
    }

    res.status(200).json({ 
      rankings: limitedRankings,
      userRanking,
      instituteName: institute.instituteName,
      instituteId: institute.instituteId
    });
  } catch (error) {
    console.error('Get institute rankings error:', error);
    res.status(500).json({ message: 'Error fetching rankings', error: error.message });
  }
};

// Get weekly rankings for institute
exports.getWeeklyInstituteRankings = async (req, res) => {
  try {
    const { instituteId } = req.params;
    const { limit = 10 } = req.query;

    // Verify institute exists
    const institute = await Institute.findOne({ instituteId: instituteId.toUpperCase() });
    if (!institute) {
      return res.status(404).json({ message: 'Institute not found' });
    }

    // Get all students from this institute
    const students = await User.find({ instituteId: instituteId.toUpperCase() }).select('_id firstName lastName username profilePic profileImageUrl');

    if (students.length === 0) {
      return res.status(200).json({ rankings: [] });
    }

    const studentIds = students.map(s => s._id);

    // Calculate start of current week (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysToMonday);
    weekStart.setHours(0, 0, 0, 0);

    // Import models
    const Session = require('../models/Session');
    const QuizementAttempt = require('../models/QuizementAttempt');

    // Calculate weekly rankings for each student
    const rankingsPromises = studentIds.map(async (studentId) => {
      const student = students.find(s => s._id.equals(studentId));

      // Count sessions as tutor this week
      const sessionsAsTutor = await Session.countDocuments({
        creator: studentId,
        status: 'completed',
        updatedAt: { $gte: weekStart }
      });

      // Count sessions as learner this week
      const sessionsAsLearner = await Session.countDocuments({
        requester: studentId,
        status: 'completed',
        updatedAt: { $gte: weekStart }
      });

      // Get total quiz marks this week
      const quizAttempts = await QuizementAttempt.find({
        userId: studentId,
        finished: true,
        finishedAt: { $gte: weekStart }
      }).select('score');

      const totalQuizMarks = quizAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0);

      // Calculate total score: sessions + quiz marks
      const totalSessions = sessionsAsTutor + sessionsAsLearner;
      const totalScore = totalSessions + totalQuizMarks;

      return {
        studentId: student._id,
        firstName: student.firstName || '',
        lastName: student.lastName || '',
        username: student.username,
        profilePic: student.profileImageUrl || student.profilePic || '',
        sessionsAsTutor,
        sessionsAsLearner,
        totalSessions,
        totalQuizMarks,
        totalScore
      };
    });

    let rankings = await Promise.all(rankingsPromises);

    // Sort by total score (descending)
    rankings.sort((a, b) => b.totalScore - a.totalScore);

    // Add rank
    rankings = rankings.map((ranking, index) => ({
      ...ranking,
      rank: index + 1
    }));

    // Limit results if needed
    const limitedRankings = rankings.slice(0, parseInt(limit));

    // Get current user's ranking if they're not in top 3 and userId is provided
    let userRanking = null;
    if (req.user && req.user._id) {
      const userRank = rankings.find(r => r.studentId.equals(req.user._id));
      if (userRank && userRank.rank > parseInt(limit)) {
        userRanking = userRank;
      }
    }

    res.status(200).json({ 
      rankings: limitedRankings,
      userRanking,
      instituteName: institute.instituteName,
      instituteId: institute.instituteId,
      weekStart: weekStart.toISOString()
    });
  } catch (error) {
    console.error('Get weekly institute rankings error:', error);
    res.status(500).json({ message: 'Error fetching weekly rankings', error: error.message });
  }
};

// Get global top performer (student) across all institutes
exports.getGlobalTopStudent = async (req, res) => {
  try {
    // Get all students with instituteId
    const students = await User.find({ 
      instituteId: { $exists: true, $ne: null } 
    }).select('_id firstName lastName username profilePic profileImageUrl instituteId instituteName');

    if (students.length === 0) {
      return res.status(200).json({ topStudent: null });
    }

    // Import models
    const Session = require('../models/Session');
    const QuizementAttempt = require('../models/QuizementAttempt');

  // Consider only sessions between campus students (users that belong to an institute)
  const campusStudentIds = students.map((s) => s._id);

    // Calculate score for each student
    const studentScoresPromises = students.map(async (student) => {
      // Count sessions as tutor
      const sessionsAsTutor = await Session.countDocuments({
        creator: student._id,
        requester: { $in: campusStudentIds },
        status: 'completed'
      });

      // Count sessions as learner
      const sessionsAsLearner = await Session.countDocuments({
        requester: student._id,
        creator: { $in: campusStudentIds },
        status: 'completed'
      });

      // Get total quiz marks
      const quizAttempts = await QuizementAttempt.find({
        userId: student._id,
        finished: true
      }).select('score');

      const totalQuizMarks = quizAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0);

      // Calculate total score
      const totalSessions = sessionsAsTutor + sessionsAsLearner;
      const totalScore = totalSessions + totalQuizMarks;

      return {
        studentId: student._id,
        firstName: student.firstName || '',
        lastName: student.lastName || '',
        username: student.username,
        profilePic: student.profileImageUrl || student.profilePic || '',
        instituteId: student.instituteId,
        instituteName: student.instituteName,
        sessionsAsTutor,
        sessionsAsLearner,
        totalSessions,
        totalQuizMarks,
        totalScore
      };
    });

    const studentScores = await Promise.all(studentScoresPromises);

    // Sort by total score (descending) and get top 3
    studentScores.sort((a, b) => b.totalScore - a.totalScore);
    const topStudents = studentScores.slice(0, 3).map((student, index) => ({
      ...student,
      rank: index + 1
    }));

    res.status(200).json({ topStudents });
  } catch (error) {
    console.error('Get global top student error:', error);
    res.status(500).json({ message: 'Error fetching top student', error: error.message });
  }
};

// Get global top institute
exports.getGlobalTopInstitute = async (req, res) => {
  try {
    // Get all institutes
    const institutes = await Institute.find({}).select('instituteId instituteName instituteType students');

    if (institutes.length === 0) {
      return res.status(200).json({ topInstitute: null });
    }

    // Import models
    const Session = require('../models/Session');
    const QuizementAttempt = require('../models/QuizementAttempt');

    // Preload all campus students (users that belong to any institute)
    const allCampusStudents = await User.find({
      instituteId: { $exists: true, $ne: null }
    }).select('_id');
    const allCampusStudentIds = allCampusStudents.map((s) => s._id);

    // Calculate score for each institute
    const instituteScoresPromises = institutes.map(async (institute) => {
      // Get all students in this institute
      const students = await User.find({ 
        instituteId: institute.instituteId 
      }).select('_id');

      if (students.length === 0) {
        return {
          instituteId: institute.instituteId,
          instituteName: institute.instituteName,
          instituteType: institute.instituteType,
          totalStudents: 0,
          totalSessions: 0,
          totalQuizMarks: 0,
          totalScore: 0,
          averageScore: 0
        };
      }

      const studentIds = students.map(s => s._id);

      // Count total sessions, limited to sessions between campus students
      const totalSessions = await Session.countDocuments({
        status: 'completed',
        $or: [
          { creator: { $in: studentIds }, requester: { $in: allCampusStudentIds } },
          { requester: { $in: studentIds }, creator: { $in: allCampusStudentIds } }
        ]
      });

      // Get total quiz marks for all students
      const quizAttempts = await QuizementAttempt.find({
        userId: { $in: studentIds },
        finished: true
      }).select('score');

      const totalQuizMarks = quizAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0);

      // Calculate total score
      const totalScore = totalSessions + totalQuizMarks;
      const averageScore = students.length > 0 ? totalScore / students.length : 0;

      return {
        instituteId: institute.instituteId,
        instituteName: institute.instituteName,
        instituteType: institute.instituteType,
        totalStudents: students.length,
        totalSessions,
        totalQuizMarks,
        totalScore,
        averageScore
      };
    });

    const instituteScores = await Promise.all(instituteScoresPromises);

    // Sort by average score (descending) and get top 3
    instituteScores.sort((a, b) => b.averageScore - a.averageScore);
    const topInstitutes = instituteScores.slice(0, 3).map((institute, index) => ({
      ...institute,
      rank: index + 1
    }));

    res.status(200).json({ topInstitutes });
  } catch (error) {
    console.error('Get global top institute error:', error);
    res.status(500).json({ message: 'Error fetching top institute', error: error.message });
  }
};

