const Institute = require('../models/Institute');
const User = require('../models/User');
const InstituteRewardTransaction = require('../models/InstituteRewardTransaction');
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
    const { instituteName, instituteId, instituteType } = req.body;
    
    // Check if institute ID already exists
    const existingInstitute = await Institute.findOne({ instituteId: instituteId.toUpperCase() });
    if (existingInstitute) {
      return res.status(400).json({ message: 'Institute ID already exists' });
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
      campusAmbassador: req.user._id,
      campusAmbassadorEmail: (req.user.email || '').toLowerCase(),
      students: [],
    });

    await institute.save();

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

// Get institute by ID
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

    await Institute.findByIdAndDelete(id);
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
