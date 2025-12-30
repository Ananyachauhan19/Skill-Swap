const Institute = require('../models/Institute');
const User = require('../models/User');
const InstituteRewardTransaction = require('../models/InstituteRewardTransaction');
const ActivityLog = require('../models/ActivityLog');
const xlsx = require('xlsx');
const cloudinary = require('../utils/cloudinary');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { sendMail } = require('../utils/sendMail');
const emailTemplates = require('../utils/emailTemplates');

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
          const emailContent = {
            subject: `Welcome to ${emailData.instituteName} Campus Dashboard - Skill-Swap`,
            html: `
              <div style="font-family: system-ui, Arial; max-width: 640px; margin:0 auto; padding:16px;">
                <div style="background:#0ea5e9; color:#fff; padding:12px 16px; border-radius:8px 8px 0 0;">
                  <strong>Skill‑Swap</strong>
                </div>
                <div style="border:1px solid #e5e7eb; border-top:none; padding:16px; border-radius:0 0 8px 8px;">
                  <h2 style="margin:0 0 12px; color:#0f172a;">Welcome to ${emailData.instituteName}!</h2>
                  <p>Hello ${emailData.user.firstName},</p>
                  <p>You have been successfully onboarded to the <strong>${emailData.instituteName}</strong> campus dashboard on Skill-Swap platform.</p>
                  
                  <div style="background:#f8fafc; padding:16px; border-radius:6px; margin:16px 0;">
                    <h3 style="margin:0 0 12px; color:#334155;">Your Login Credentials:</h3>
                    <p style="margin:8px 0;"><strong>Username:</strong> ${emailData.user.username}</p>
                    <p style="margin:8px 0;"><strong>Password:</strong> ${emailData.generatedPassword}</p>
                    <p style="margin:8px 0;"><strong>Student ID:</strong> ${emailData.user.studentId}</p>
                  </div>

                  <div style="background:#ecfdf5; padding:16px; border-radius:6px; margin:16px 0; border-left:4px solid #10b981;">
                    <h3 style="margin:0 0 12px; color:#065f46;">Welcome Rewards!</h3>
                    <p style="margin:8px 0;">🏆 <strong>Golden Coins:</strong> ${emailData.goldCoins}</p>
                    <p style="margin:8px 0;">🥈 <strong>Silver Coins:</strong> ${emailData.silverCoins}</p>
                  </div>

                  <p style="margin:16px 0;">You can now access the Skill-Swap platform as both a regular user and a campus dashboard student. Explore learning opportunities, connect with peers, and grow your skills!</p>
                  
                  <p style="margin:24px 0;">
                    <a href="https://skillswaphub.in/login" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">Login Now</a>
                  </p>
                  
                  <p style="margin:16px 0 0; color:#334155;">Please change your password after first login for security.</p>
                  <hr style="margin:24px 0; border:none; border-top:1px solid #e5e7eb"/>
                  <p style="color:#64748b; font-size:12px;">This email was sent automatically by Skill‑Swap. Please do not reply to this message.</p>
                </div>
              </div>
            `
          };
          await sendMail({ to: emailData.user.email, ...emailContent });
          results.emailsSent++;
        } else {
          // Send notification to existing users about campus addition
          const emailContent = {
            subject: `Added to ${emailData.instituteName} Campus Dashboard - Skill-Swap`,
            html: `
              <div style="font-family: system-ui, Arial; max-width: 640px; margin:0 auto; padding:16px;">
                <div style="background:#0ea5e9; color:#fff; padding:12px 16px; border-radius:8px 8px 0 0;">
                  <strong>Skill‑Swap</strong>
                </div>
                <div style="border:1px solid #e5e7eb; border-top:none; padding:16px; border-radius:0 0 8px 8px;">
                  <h2 style="margin:0 0 12px; color:#0f172a;">Campus Dashboard Access Granted!</h2>
                  <p>Hello ${emailData.user.firstName},</p>
                  <p>Great news! You have been added to the <strong>${emailData.instituteName}</strong> campus dashboard.</p>
                  
                  <div style="background:#f8fafc; padding:16px; border-radius:6px; margin:16px 0;">
                    <h3 style="margin:0 0 12px; color:#334155;">Your Campus Details:</h3>
                    <p style="margin:8px 0;"><strong>Student ID:</strong> ${emailData.user.studentId}</p>
                    <p style="margin:8px 0;"><strong>Institute:</strong> ${emailData.instituteName}</p>
                    ${emailData.user.course ? `<p style="margin:8px 0;"><strong>Course:</strong> ${emailData.user.course}</p>` : ''}
                    ${emailData.user.semester ? `<p style="margin:8px 0;"><strong>Semester:</strong> ${emailData.user.semester}</p>` : ''}
                    ${emailData.user.class ? `<p style="margin:8px 0;"><strong>Class:</strong> ${emailData.user.class}</p>` : ''}
                  </div>

                  <div style="background:#ecfdf5; padding:16px; border-radius:6px; margin:16px 0; border-left:4px solid #10b981;">
                    <h3 style="margin:0 0 12px; color:#065f46;">Bonus Rewards Added!</h3>
                    <p style="margin:8px 0;">🏆 <strong>Golden Coins:</strong> +${emailData.goldCoins}</p>
                    <p style="margin:8px 0;">🥈 <strong>Silver Coins:</strong> +${emailData.silverCoins}</p>
                    <p style="margin:8px 0; font-size:12px; color:#065f46;">These coins have been added to your wallet!</p>
                  </div>

                  <p style="margin:16px 0;">You can now access campus-specific features and participate in institutional activities while continuing to use all regular Skill-Swap features.</p>
                  
                  <p style="margin:24px 0;">
                    <a href="https://skillswaphub.in/campus-dashboard" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">View Campus Dashboard</a>
                  </p>
                  
                  <hr style="margin:24px 0; border:none; border-top:1px solid #e5e7eb"/>
                  <p style="color:#64748b; font-size:12px;">This email was sent automatically by Skill‑Swap. Please do not reply to this message.</p>
                </div>
              </div>
            `
          };
          await sendMail({ to: emailData.user.email, ...emailContent });
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
        await ActivityLog.logActivity(req.campusAmbassador._id, 'Student Excel Uploaded', {
          instituteName: institute.instituteName,
          metadata: {
            totalStudentsUploaded: validProcessedCount,
            coinsAssignedDuringUpload: (silverCoinsPerStudent > 0 || goldCoinsPerStudent > 0),
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

    res.status(200).json({ students, count: students.length });
  } catch (error) {
    console.error('Get institute students error:', error);
    res.status(500).json({ message: 'Error fetching students', error: error.message });
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
    const instituteId = req.user.instituteId;

    if (!instituteId) {
      return res.status(404).json({ message: 'Student is not associated with any institute' });
    }

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

// Upload courses for an institute via Excel
exports.uploadCourses = async (req, res) => {
  try {
    const { instituteId } = req.params;
    const { numberOfCourses } = req.body;

    // Find the institute
    const institute = await Institute.findOne({
      _id: instituteId,
      campusAmbassador: req.user._id
    });

    if (!institute) {
      return res.status(404).json({ message: 'Institute not found or not authorized' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Excel file is required' });
    }

    // Parse Excel file
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    if (!data.length) {
      return res.status(400).json({ message: 'Excel file is empty' });
    }

    // Extract course names from Excel
    const courses = [];
    const errors = [];

    data.forEach((row, index) => {
      const rowNum = index + 2;
      const courseName = row.courseName || row['Course Name'] || row.course || row.Course;
      
      if (!courseName || !courseName.toString().trim()) {
        errors.push(`Row ${rowNum}: Course name is required`);
        return;
      }

      const trimmedCourseName = courseName.toString().trim();
      if (!courses.includes(trimmedCourseName)) {
        courses.push(trimmedCourseName);
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation errors found', errors });
    }

    // Validate number of courses if provided
    const numCourses = parseInt(numberOfCourses) || courses.length;
    if (numberOfCourses && courses.length !== numCourses) {
      return res.status(400).json({
        message: `Expected ${numCourses} courses but found ${courses.length} in Excel`
      });
    }

    // Update institute with courses
    institute.courses = courses;
    institute.numberOfCourses = courses.length;
    await institute.save();

    res.status(200).json({
      message: 'Courses uploaded successfully',
      coursesCount: courses.length,
      courses: courses,
      institute
    });
  } catch (error) {
    console.error('Upload courses error:', error);
    res.status(500).json({ message: 'Error uploading courses', error: error.message });
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

    res.status(200).json({
      stats: stats.map(s => ({
        actionType: s._id,
        count: s.count
      })),
      totalActivities
    });
  } catch (error) {
    console.error('Get my activity stats error:', error);
    res.status(500).json({ message: 'Error fetching activity stats', error: error.message });
  }
};

