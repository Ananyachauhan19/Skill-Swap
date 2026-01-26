const mongoose = require('mongoose');
const EmailTemplate = require('../models/EmailTemplate');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

/**
 * Migration Script: Convert Intern Email Templates to Use Base Template
 * This migrates intern email templates from full HTML to content-only format
 * that uses the base_email_layout template (like other system emails)
 */

async function migrateInternTemplates() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Define the three intern email templates with content-only format
    const internTemplates = [
      {
        templateKey: 'intern_coordinator_welcome',
        name: 'Intern Coordinator Welcome Email',
        description: 'Welcome email sent to new intern coordinators with their login credentials',
        category: 'intern',
        subject: 'Welcome to SkillSwap Hub - Intern Coordinator Account Created',
        htmlBody: `<div style="text-align: center; margin-bottom: 24px;">
  <h2 style="color: #0f172a; margin: 0 0 8px;">Welcome to SkillSwap Hub</h2>
  <p style="color: #64748b; margin: 0;">You've been added as an Intern Coordinator</p>
</div>

<p>Hello <strong>\${fullName}</strong>,</p>

<p>Welcome to SkillSwap Hub! Your intern coordinator account has been successfully created. You now have access to manage interns, generate certificates, and track internship activities.</p>

<div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; border-radius: 6px; margin: 24px 0;">
  <h3 style="margin: 0 0 12px; color: #0c4a6e; font-size: 16px;">🔐 Your Login Credentials</h3>
  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 6px 0; color: #475569; font-weight: 500;">Email:</td>
      <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">\${email}</td>
    </tr>
    <tr>
      <td style="padding: 6px 0; color: #475569; font-weight: 500;">Password:</td>
      <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">\${password}</td>
    </tr>
  </table>
</div>

<div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 6px; margin: 24px 0;">
  <p style="margin: 0; color: #78350f;"><strong>⚠️ Security Notice:</strong> Please change your password after your first login for security purposes.</p>
</div>

<div style="text-align: center; margin: 32px 0;">
  <a href="\${loginUrl}" style="display: inline-block; background: #0ea5e9; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Login to Your Dashboard</a>
</div>

<div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 24px 0;">
  <h3 style="margin: 0 0 12px; color: #0f172a; font-size: 16px;">📋 What You Can Do</h3>
  <ul style="margin: 0; padding-left: 20px; color: #475569;">
    <li style="margin-bottom: 8px;">Add and manage interns with complete details</li>
    <li style="margin-bottom: 8px;">Generate joining letters and completion certificates</li>
    <li style="margin-bottom: 8px;">Track intern activities and performance</li>
    <li style="margin-bottom: 8px;">View activity logs and statistics</li>
  </ul>
</div>

<p>If you have any questions or need assistance, please don't hesitate to reach out to the admin team.</p>

<p style="margin-top: 32px;">Best regards,<br><strong>SkillSwap Hub Team</strong></p>`,
        variables: ['fullName', 'email', 'password', 'loginUrl'],
        isActive: true
      },
      {
        templateKey: 'intern_joining',
        name: 'Intern Joining Letter Email',
        description: 'Email sent to new intern with joining letter and credentials',
        category: 'intern',
        subject: 'Welcome to SkillSwap Hub - Your Internship Begins! 🎉',
        htmlBody: `<div style="text-align: center; margin-bottom: 24px;">
  <h2 style="color: #0f172a; margin: 0 0 8px;">🎉 Welcome to SkillSwap Hub!</h2>
  <p style="color: #64748b; margin: 0;">Your internship journey begins here</p>
</div>

<p>Dear <strong>\${name}</strong>,</p>

<p>Congratulations! We are delighted to welcome you to SkillSwap Hub as an Intern in the <strong>\${role}</strong> department.</p>

<div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; border-radius: 6px; margin: 24px 0;">
  <h3 style="margin: 0 0 12px; color: #065f46; font-size: 16px;">📋 Your Internship Details</h3>
  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 6px 0; color: #475569; font-weight: 500; width: 140px;">Role:</td>
      <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">\${role}</td>
    </tr>
    <tr>
      <td style="padding: 6px 0; color: #475569; font-weight: 500;">Position:</td>
      <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">\${position}</td>
    </tr>
    <tr>
      <td style="padding: 6px 0; color: #475569; font-weight: 500;">Joining Date:</td>
      <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">\${joiningDate}</td>
    </tr>
    <tr>
      <td style="padding: 6px 0; color: #475569; font-weight: 500;">Duration:</td>
      <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">\${duration}</td>
    </tr>
    <tr>
      <td style="padding: 6px 0; color: #475569; font-weight: 500;">Intern ID:</td>
      <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">\${internEmployeeId}</td>
    </tr>
  </table>
</div>

<p>Please find your <strong>joining letter attached</strong> to this email. This document contains all the official details about your internship and can be used for verification purposes.</p>

<div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 6px; margin: 24px 0;">
  <h3 style="margin: 0 0 12px; color: #1e40af; font-size: 16px;">🔗 Certificate Verification</h3>
  <p style="margin: 0 0 8px; color: #475569;">Your joining letter includes a QR code for easy verification. Anyone can scan it or visit:</p>
  <p style="margin: 0;"><a href="\${certificateLink}" style="color: #2563eb; font-weight: 600; word-break: break-all;">\${certificateLink}</a></p>
</div>

<div style="text-align: center; margin: 32px 0;">
  <a href="\${certificateLink}" style="display: inline-block; background: #0ea5e9; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">📄 View Certificate Online</a>
</div>

<div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 6px; margin: 24px 0;">
  <p style="margin: 0; color: #78350f;"><strong>📧 Your Login Email:</strong> \${email}</p>
  <p style="margin: 8px 0 0; color: #78350f; font-size: 14px;">You can use this email to access any intern-specific resources or portals.</p>
</div>

<p>We look forward to a productive and enriching internship experience. Should you have any questions, please don't hesitate to reach out to your supervisor.</p>

<p style="margin-top: 32px;">Welcome aboard!</p>
<p style="margin-top: 16px;"><strong>The SkillSwap Hub Team</strong></p>`,
        variables: ['name', 'role', 'position', 'joiningDate', 'duration', 'internEmployeeId', 'certificateLink', 'email'],
        isActive: true
      },
      {
        templateKey: 'intern_completion',
        name: 'Intern Completion Certificate Email',
        description: 'Email sent to intern upon successful completion of internship',
        category: 'intern',
        subject: 'Congratulations on Completing Your Internship! 🎓',
        htmlBody: `<div style="text-align: center; margin-bottom: 24px;">
  <h2 style="color: #0f172a; margin: 0 0 8px;">🎓 Congratulations!</h2>
  <p style="color: #64748b; margin: 0; font-size: 18px;">You've successfully completed your internship</p>
</div>

<p>Dear <strong>\${name}</strong>,</p>

<p>Congratulations on successfully completing your internship with SkillSwap Hub! It has been a pleasure having you on our team.</p>

<div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; border-radius: 6px; margin: 24px 0;">
  <h3 style="margin: 0 0 12px; color: #065f46; font-size: 16px;">📊 Internship Summary</h3>
  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 6px 0; color: #475569; font-weight: 500; width: 140px;">Role:</td>
      <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">\${role}</td>
    </tr>
    <tr>
      <td style="padding: 6px 0; color: #475569; font-weight: 500;">Position:</td>
      <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">\${position}</td>
    </tr>
    <tr>
      <td style="padding: 6px 0; color: #475569; font-weight: 500;">Joining Date:</td>
      <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">\${joiningDate}</td>
    </tr>
    <tr>
      <td style="padding: 6px 0; color: #475569; font-weight: 500;">Completion Date:</td>
      <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">\${completionDate}</td>
    </tr>
    <tr>
      <td style="padding: 6px 0; color: #475569; font-weight: 500;">Duration:</td>
      <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">\${duration}</td>
    </tr>
    <tr>
      <td style="padding: 6px 0; color: #475569; font-weight: 500;">Intern ID:</td>
      <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">\${internEmployeeId}</td>
    </tr>
  </table>
</div>

<p>Your dedication, hard work, and contributions have been invaluable. We appreciate the effort you put into every task and the positive energy you brought to the team.</p>

<div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 6px; margin: 24px 0;">
  <h3 style="margin: 0 0 12px; color: #78350f; font-size: 16px;">🎓 Your Completion Certificate</h3>
  <p style="margin: 0 0 8px; color: #78350f;">Your official completion certificate is <strong>attached to this email</strong>.</p>
  <p style="margin: 0; color: #78350f;">This certificate can be shared with potential employers and added to your professional portfolio.</p>
</div>

<div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 6px; margin: 24px 0;">
  <h3 style="margin: 0 0 12px; color: #1e40af; font-size: 16px;">🔗 Certificate Verification</h3>
  <p style="margin: 0 0 8px; color: #475569;">Your certificate includes a QR code for instant verification. Share this link with employers:</p>
  <p style="margin: 0;"><a href="\${certificateLink}" style="color: #2563eb; font-weight: 600; word-break: break-all;">\${certificateLink}</a></p>
</div>

<div style="text-align: center; margin: 32px 0;">
  <a href="\${certificateLink}" style="display: inline-block; background: #10b981; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">📄 View & Download Certificate</a>
</div>

<div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 24px 0;">
  <h3 style="margin: 0 0 12px; color: #0f172a; font-size: 16px;">💡 What's Next?</h3>
  <ul style="margin: 0; padding-left: 20px; color: #475569;">
    <li style="margin-bottom: 8px;">Add this certificate to your LinkedIn profile and resume</li>
    <li style="margin-bottom: 8px;">Share your experience with friends and on social media</li>
    <li style="margin-bottom: 8px;">Stay connected with SkillSwap Hub for future opportunities</li>
    <li style="margin-bottom: 8px;">Consider recommending SkillSwap Hub to others</li>
  </ul>
</div>

<p>We wish you all the best in your future endeavors and hope to see you achieve great success in your career!</p>

<p style="margin-top: 32px;">Best wishes,</p>
<p style="margin-top: 16px;"><strong>The SkillSwap Hub Team</strong></p>`,
        variables: ['name', 'role', 'position', 'joiningDate', 'completionDate', 'duration', 'internEmployeeId', 'certificateLink'],
        isActive: true
      }
    ];

    console.log('\n🔄 Starting migration...\n');

    for (const template of internTemplates) {
      const existing = await EmailTemplate.findOne({ templateKey: template.templateKey });
      
      if (existing) {
        // Update existing template
        await EmailTemplate.updateOne(
          { templateKey: template.templateKey },
          { $set: template }
        );
        console.log(`✅ Updated: ${template.name} (${template.templateKey})`);
      } else {
        // Create new template
        await EmailTemplate.create(template);
        console.log(`✨ Created: ${template.name} (${template.templateKey})`);
      }
    }

    // Remove old template fields if they exist (cleanup)
    await EmailTemplate.updateMany(
      { category: 'intern' },
      { $unset: { type: '', body: '' } }
    );

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📋 Summary:');
    console.log('  - All 3 intern email templates now use base_email_layout');
    console.log('  - Templates are content-only (no full HTML structure)');
    console.log('  - Consistent with other system emails');
    console.log('  - Ready for use with getEmailTemplate() function');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run migration
if (require.main === module) {
  migrateInternTemplates()
    .then(() => {
      console.log('\n✨ All done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error:', error);
      process.exit(1);
    });
}

module.exports = migrateInternTemplates;
