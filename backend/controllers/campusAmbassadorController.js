const Institute = require('../models/Institute');
const User = require('../models/User');
const xlsx = require('xlsx');
const supabase = require('../utils/supabaseClient');
const bcrypt = require('bcryptjs');
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
    const { instituteName, instituteId, goldCoins, silverCoins, instituteType } = req.body;
    
    // Check if institute ID already exists
    const existingInstitute = await Institute.findOne({ instituteId: instituteId.toUpperCase() });
    if (existingInstitute) {
      return res.status(400).json({ message: 'Institute ID already exists' });
    }

    let campusBackgroundImageUrl = null;

    // Handle campus background image upload to Supabase bucket "institute"
    if (req.file) {
      try {
        const fileExt = (req.file.originalname || 'image').split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const filePath = `${instituteId.toUpperCase()}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('institute')
          .upload(filePath, req.file.buffer, {
            contentType: req.file.mimetype || 'image/jpeg',
            upsert: false,
          });

        if (uploadError) {
          console.error('[Supabase] Institute image upload failed:', uploadError.message || uploadError);
        } else {
          const { data: publicUrlData } = supabase.storage
            .from('institute')
            .getPublicUrl(filePath);

          campusBackgroundImageUrl = publicUrlData?.publicUrl || null;
        }
      } catch (e) {
        console.error('[Supabase] Unexpected error uploading institute image:', e.message || e);
      }
    }

    const institute = new Institute({
      instituteName,
      instituteId: instituteId.toUpperCase(),
      goldCoins: goldCoins || 0,
      silverCoins: silverCoins || 0,
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
    res.status(200).json({ institutes });
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
    const { instituteName, goldCoins, silverCoins } = req.body;

    const institute = await Institute.findOne({
      _id: id,
      campusAmbassador: req.user._id
    });

    if (!institute) {
      return res.status(404).json({ message: 'Institute not found or unauthorized' });
    }

    // Update fields
    if (instituteName) institute.instituteName = instituteName;
    if (goldCoins !== undefined) institute.goldCoins = goldCoins;
    if (silverCoins !== undefined) institute.silverCoins = silverCoins;

    // Handle image update (upload to Supabase "institute" bucket)
    if (req.file) {
      try {
        const fileExt = (req.file.originalname || 'image').split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const filePath = `${institute.instituteId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('institute')
          .upload(filePath, req.file.buffer, {
            contentType: req.file.mimetype || 'image/jpeg',
            upsert: false,
          });

        if (uploadError) {
          console.error('[Supabase] Institute image update failed:', uploadError.message || uploadError);
        } else {
          const { data: publicUrlData } = supabase.storage
            .from('institute')
            .getPublicUrl(filePath);

          institute.campusBackgroundImage = publicUrlData?.publicUrl || institute.campusBackgroundImage;
        }
      } catch (e) {
        console.error('[Supabase] Unexpected error updating institute image:', e.message || e);
      }
    }

    await institute.save();
    res.status(200).json({ message: 'Institute updated successfully', institute });
  } catch (error) {
    console.error('Update institute error:', error);
    res.status(500).json({ message: 'Error updating institute', error: error.message });
  }
};

// Upload Excel and onboard students
exports.uploadStudents = async (req, res) => {
  try {
    const { instituteId } = req.params;

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
      created: 0,
      updated: 0,
      errors: [],
      emailsSent: 0,
      emailsFailed: 0
    };

    // Track all student user IDs linked to this institute
    const studentIds = new Set((institute.students || []).map(id => id.toString()));
    const emailQueue = []; // Store email tasks

    // Calculate reward per student
    const totalStudents = data.length;
    const goldCoinsPerStudent = Math.floor(institute.goldCoins / totalStudents);
    const silverCoinsPerStudent = Math.floor(institute.silverCoins / totalStudents);

    for (const row of data) {
      try {
        const email = row.email?.toLowerCase().trim();
        const name = row.name?.trim();

        if (!email || !name) {
          results.errors.push({ row, error: 'Missing email or name' });
          continue;
        }

        // Check if user exists
        let user = await User.findOne({ email });
        let isNewUser = false;
        let generatedPassword = null;

        if (user) {
          // Update existing user
          user.instituteId = institute.instituteId;
          user.instituteName = institute.instituteName;
          
          if (institute.instituteType === 'school' && row.class) {
            user.class = row.class;
          }
          
          if (institute.instituteType === 'college') {
            if (row.course) user.course = row.course;
            if (row.semester) user.semester = row.semester;
          }

          // Generate student ID if not exists
          if (!user.studentId) {
            user.studentId = generateStudentId(institute.instituteId);
          }

          // Add reward coins to existing user's wallet
          user.goldCoins = (user.goldCoins || 0) + goldCoinsPerStudent;
          user.silverCoins = (user.silverCoins || 0) + silverCoinsPerStudent;

          await user.save();
          results.updated++;
          studentIds.add(user._id.toString());
        } else {
          // Create new user
          const [firstName, ...lastNameParts] = name.split(' ');
          const lastName = lastNameParts.join(' ');
          
          const username = email.split('@')[0] + Math.floor(Math.random() * 1000);
          const studentId = generateStudentId(institute.instituteId);
          generatedPassword = generatePassword();
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

          if (institute.instituteType === 'school' && row.class) {
            newUser.class = row.class;
          }
          
          if (institute.instituteType === 'college') {
            if (row.course) newUser.course = row.course;
            if (row.semester) newUser.semester = row.semester;
          }

          await newUser.save();
          user = newUser;
          isNewUser = true;
          results.created++;
          studentIds.add(newUser._id.toString());
        }

        // Queue email notification
        emailQueue.push({
          user,
          isNewUser,
          generatedPassword,
          instituteName: institute.instituteName,
          goldCoins: goldCoinsPerStudent,
          silverCoins: silverCoinsPerStudent
        });

      } catch (error) {
        results.errors.push({ row, error: error.message });
      }
    }

    // Update student references and count on the institute document
    institute.students = Array.from(studentIds);
    institute.studentsCount = await User.countDocuments({ instituteId: institute.instituteId });
    await institute.save();

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
      message: 'Students onboarded successfully',
      results,
      rewardDistribution: {
        totalStudents,
        goldCoinsPerStudent,
        silverCoinsPerStudent,
        totalGoldDistributed: goldCoinsPerStudent * totalStudents,
        totalSilverDistributed: silverCoinsPerStudent * totalStudents
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

    const students = await User.find({ instituteId })
      .select('firstName lastName email studentId class course semester profileImageUrl')
      .limit(100);

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
