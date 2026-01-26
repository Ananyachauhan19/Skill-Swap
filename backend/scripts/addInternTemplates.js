const mongoose = require('mongoose');
const EmailTemplate = require('../models/EmailTemplate');
const CertificateTemplate = require('../models/CertificateTemplate');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

/**
 * Migration Script: Add Intern Management Email & Certificate Templates
 * Run: node scripts/addInternTemplates.js
 */

// Email Templates for Intern System
const emailTemplates = [
  {
    templateKey: 'intern_joining',
    name: 'Intern Joining Letter Email',
    description: 'Email sent to new intern with joining letter and credentials',
    category: 'intern',
    subject: 'Welcome to SkillSwap Hub - Your Internship Begins!',
    htmlBody: `<p>Dear <strong>{{name}}</strong>,</p>
<p>Congratulations! We are delighted to welcome you to SkillSwap Hub as an Intern in the <strong>{{role}}</strong> department.</p>
<p><strong>Your Internship Details:</strong></p>
<ul>
  <li><strong>Role:</strong> {{role}}</li>
  <li><strong>Joining Date:</strong> {{joiningDate}}</li>
  <li><strong>Duration:</strong> {{duration}}</li>
  <li><strong>Intern ID:</strong> {{internEmployeeId}}</li>
</ul>
<p>Please find your joining letter attached to this email. You can also access it anytime through your intern dashboard.</p>
<div style="background:#f0f9ff; border-left:4px solid #0ea5e9; padding:16px; border-radius:6px; margin:24px 0;">
  <p style="margin:0 0 8px; color:#0c4a6e; font-weight:600;">📋 Your Login Credentials</p>
  <p style="margin:0; color:#334155;"><strong>Email:</strong> {{email}}</p>
  <p style="margin:4px 0 0; color:#334155;"><strong>Intern ID:</strong> {{internEmployeeId}}</p>
</div>
<p>You can login to your intern portal here: <a href="{{certificateLink}}" style="color:#2563eb;">{{certificateLink}}</a></p>
<p>We look forward to a productive and enriching internship experience. Should you have any questions, please don't hesitate to reach out to your supervisor.</p>
<p style="margin-top:24px;">Welcome aboard!</p>`,
    variables: ['name', 'role', 'joiningDate', 'duration', 'internEmployeeId', 'certificateLink', 'email'],
    type: 'intern_joining',
    body: `<p>Dear <strong>{{name}}</strong>,</p>
<p>Congratulations! We are delighted to welcome you to SkillSwap Hub as an Intern in the <strong>{{role}}</strong> department.</p>
<p><strong>Your Internship Details:</strong></p>
<ul>
  <li><strong>Role:</strong> {{role}}</li>
  <li><strong>Joining Date:</strong> {{joiningDate}}</li>
  <li><strong>Duration:</strong> {{duration}}</li>
  <li><strong>Intern ID:</strong> {{internEmployeeId}}</li>
</ul>
<p>Please find your joining letter attached to this email. You can also access it anytime through your intern dashboard.</p>
<div style="background:#f0f9ff; border-left:4px solid #0ea5e9; padding:16px; border-radius:6px; margin:24px 0;">
  <p style="margin:0 0 8px; color:#0c4a6e; font-weight:600;">📋 Your Login Credentials</p>
  <p style="margin:0; color:#334155;"><strong>Email:</strong> {{email}}</p>
  <p style="margin:4px 0 0; color:#334155;"><strong>Intern ID:</strong> {{internEmployeeId}}</p>
</div>
<p>You can login to your intern portal here: <a href="{{certificateLink}}" style="color:#2563eb;">{{certificateLink}}</a></p>
<p>We look forward to a productive and enriching internship experience. Should you have any questions, please don't hesitate to reach out to your supervisor.</p>
<p style="margin-top:24px;">Welcome aboard!</p>`,
    isActive: true
  },
  {
    templateKey: 'intern_completion',
    name: 'Intern Completion Certificate Email',
    description: 'Email sent to intern upon successful completion of internship',
    category: 'intern',
    subject: 'Congratulations on Completing Your Internship at SkillSwap Hub!',
    htmlBody: `<p>Dear <strong>{{name}}</strong>,</p>
<p>Congratulations on successfully completing your internship with SkillSwap Hub!</p>
<p><strong>Internship Summary:</strong></p>
<ul>
  <li><strong>Role:</strong> {{role}}</li>
  <li><strong>Joining Date:</strong> {{joiningDate}}</li>
  <li><strong>Completion Date:</strong> {{completionDate}}</li>
  <li><strong>Duration:</strong> {{duration}}</li>
  <li><strong>Intern ID:</strong> {{internEmployeeId}}</li>
</ul>
<p>It has been a pleasure having you on our team. Your dedication, hard work, and contributions have been invaluable.</p>
<div style="background:#f0fdf4; border-left:4px solid #10b981; padding:16px; border-radius:6px; margin:24px 0;">
  <p style="margin:0 0 8px; color:#065f46; font-weight:600;">🎓 Your Completion Certificate</p>
  <p style="margin:0; color:#334155;">Your official completion certificate is attached to this email.</p>
  <p style="margin:8px 0 0; color:#334155;">You can also verify it online: <a href="{{certificateLink}}" style="color:#2563eb;">{{certificateLink}}</a></p>
</div>
<p>This certificate can be shared with potential employers and added to your professional portfolio. The certificate includes a QR code for easy verification.</p>
<p>We wish you all the best in your future endeavors and hope to see you achieve great success in your career!</p>
<p style="margin-top:24px;">Stay connected with SkillSwap Hub!</p>`,
    variables: ['name', 'role', 'joiningDate', 'completionDate', 'duration', 'internEmployeeId', 'certificateLink'],
    type: 'intern_completion',
    body: `<p>Dear <strong>{{name}}</strong>,</p>
<p>Congratulations on successfully completing your internship with SkillSwap Hub!</p>
<p><strong>Internship Summary:</strong></p>
<ul>
  <li><strong>Role:</strong> {{role}}</li>
  <li><strong>Joining Date:</strong> {{joiningDate}}</li>
  <li><strong>Completion Date:</strong> {{completionDate}}</li>
  <li><strong>Duration:</strong> {{duration}}</li>
  <li><strong>Intern ID:</strong> {{internEmployeeId}}</li>
</ul>
<p>It has been a pleasure having you on our team. Your dedication, hard work, and contributions have been invaluable.</p>
<div style="background:#f0fdf4; border-left:4px solid #10b981; padding:16px; border-radius:6px; margin:24px 0;">
  <p style="margin:0 0 8px; color:#065f46; font-weight:600;">🎓 Your Completion Certificate</p>
  <p style="margin:0; color:#334155;">Your official completion certificate is attached to this email.</p>
  <p style="margin:8px 0 0; color:#334155;">You can also verify it online: <a href="{{certificateLink}}" style="color:#2563eb;">{{certificateLink}}</a></p>
</div>
<p>This certificate can be shared with potential employers and added to your professional portfolio. The certificate includes a QR code for easy verification.</p>
<p>We wish you all the best in your future endeavors and hope to see you achieve great success in your career!</p>
<p style="margin-top:24px;">Stay connected with SkillSwap Hub!</p>`,
    isActive: true
  }
];

// Certificate Templates for Intern System
const certificateTemplates = [
  {
    type: 'joining_letter',
    name: 'Intern Joining Letter',
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Joining Letter</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      margin: 0;
      padding: 40px;
      background: #fff;
    }
    .letterhead {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 3px solid #0ea5e9;
      padding-bottom: 20px;
    }
    .letterhead h1 {
      color: #0ea5e9;
      margin: 0;
      font-size: 32px;
    }
    .letterhead p {
      color: #64748b;
      margin: 5px 0;
      font-size: 14px;
    }
    .content {
      margin: 30px 0;
      line-height: 1.8;
      color: #334155;
    }
    .content h2 {
      color: #0f172a;
      font-size: 22px;
      margin-top: 30px;
      margin-bottom: 15px;
    }
    .details-box {
      background: #f8fafc;
      border-left: 4px solid #0ea5e9;
      padding: 20px;
      margin: 20px 0;
    }
    .details-box p {
      margin: 8px 0;
      font-size: 15px;
    }
    .signature {
      margin-top: 60px;
      display: flex;
      justify-content: space-between;
    }
    .signature div {
      text-align: center;
    }
    .signature p {
      margin: 5px 0;
      color: #334155;
    }
    .signature .line {
      border-top: 1px solid #334155;
      width: 200px;
      margin: 0 auto 5px;
    }
    .qr-code {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px dashed #cbd5e1;
    }
    .qr-code img {
      width: 150px;
      height: 150px;
    }
    .qr-code p {
      color: #64748b;
      font-size: 12px;
      margin-top: 10px;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      color: #64748b;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="letterhead">
    <h1>SKILLSWAP HUB</h1>
    <p>Empowering Learning Through Collaboration</p>
    <p>info@skillswaphub.in | www.skillswaphub.in</p>
  </div>

  <div class="content">
    <p><strong>Date:</strong> {{joiningDate}}</p>
    <p><strong>Intern ID:</strong> {{internEmployeeId}}</p>

    <h2>INTERNSHIP JOINING LETTER</h2>

    <p>Dear <strong>{{name}}</strong>,</p>

    <p>We are pleased to offer you an internship position at SkillSwap Hub. This letter confirms your acceptance into our internship program.</p>

    <div class="details-box">
      <p><strong>Position:</strong> {{role}}</p>
      <p><strong>Duration:</strong> {{duration}}</p>
      <p><strong>Start Date:</strong> {{joiningDate}}</p>
      <p><strong>Intern ID:</strong> {{internEmployeeId}}</p>
    </div>

    <p><strong>Internship Objectives:</strong></p>
    <ul>
      <li>Gain hands-on experience in {{role}}</li>
      <li>Contribute to real-world projects and initiatives</li>
      <li>Develop professional skills and industry knowledge</li>
      <li>Collaborate with experienced team members</li>
    </ul>

    <p><strong>Terms & Conditions:</strong></p>
    <ul>
      <li>This is an unpaid/stipend-based internship program</li>
      <li>Working hours and schedule will be communicated by your supervisor</li>
      <li>You will receive a completion certificate upon successful completion</li>
      <li>All intellectual property created during the internship belongs to SkillSwap Hub</li>
    </ul>

    <p>We look forward to working with you and wish you a productive learning experience.</p>

    <div class="signature">
      <div>
        <div class="line"></div>
        <p><strong>HR Department</strong></p>
        <p>SkillSwap Hub</p>
      </div>
      <div>
        <div class="line"></div>
        <p><strong>Authorized Signatory</strong></p>
        <p>Date: {{joiningDate}}</p>
      </div>
    </div>

    <div class="qr-code">
      <img src="{{qrCode}}" alt="Verification QR Code" />
      <p>Scan to verify this certificate online</p>
      <p style="font-size: 10px; margin-top: 5px;">Certificate ID: {{internEmployeeId}}</p>
    </div>
  </div>

  <div class="footer">
    <p>This is an auto-generated document. For any queries, please contact info@skillswaphub.in</p>
  </div>
</body>
</html>`,
    isActive: true
  },
  {
    type: 'completion_certificate',
    name: 'Intern Completion Certificate',
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Completion Certificate</title>
  <style>
    body {
      font-family: 'Georgia', serif;
      margin: 0;
      padding: 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .certificate {
      background: #fff;
      max-width: 800px;
      margin: 0 auto;
      padding: 60px;
      border: 15px solid #0ea5e9;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .header h1 {
      color: #0ea5e9;
      font-size: 42px;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 3px;
    }
    .header .tagline {
      color: #64748b;
      font-size: 16px;
      font-style: italic;
      margin-top: 10px;
    }
    .title {
      text-align: center;
      margin: 40px 0;
    }
    .title h2 {
      color: #0f172a;
      font-size: 36px;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .title .subtitle {
      color: #475569;
      font-size: 18px;
      margin-top: 10px;
    }
    .recipient {
      text-align: center;
      margin: 40px 0;
      padding: 30px;
      background: #f8fafc;
      border-left: 5px solid #10b981;
    }
    .recipient .label {
      color: #64748b;
      font-size: 16px;
      margin-bottom: 10px;
    }
    .recipient .name {
      color: #0f172a;
      font-size: 32px;
      font-weight: bold;
      margin: 10px 0;
    }
    .recipient .role {
      color: #475569;
      font-size: 20px;
      margin-top: 10px;
    }
    .content {
      text-align: center;
      margin: 30px 0;
      line-height: 2;
      color: #334155;
      font-size: 16px;
    }
    .details {
      display: flex;
      justify-content: space-around;
      margin: 40px 0;
      padding: 20px;
      background: #f8fafc;
    }
    .details div {
      text-align: center;
    }
    .details .label {
      color: #64748b;
      font-size: 14px;
      margin-bottom: 5px;
    }
    .details .value {
      color: #0f172a;
      font-size: 18px;
      font-weight: bold;
    }
    .signatures {
      display: flex;
      justify-content: space-around;
      margin-top: 60px;
    }
    .signatures div {
      text-align: center;
    }
    .signatures .line {
      border-top: 2px solid #0f172a;
      width: 200px;
      margin: 0 auto 10px;
    }
    .signatures p {
      margin: 5px 0;
      color: #334155;
      font-size: 14px;
    }
    .qr-section {
      text-align: center;
      margin-top: 40px;
      padding-top: 30px;
      border-top: 2px dashed #cbd5e1;
    }
    .qr-section img {
      width: 120px;
      height: 120px;
    }
    .qr-section p {
      color: #64748b;
      font-size: 12px;
      margin-top: 10px;
    }
    .seal {
      position: absolute;
      top: 100px;
      right: 80px;
      width: 100px;
      height: 100px;
      border-radius: 50%;
      border: 3px solid #10b981;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(16, 185, 129, 0.1);
      transform: rotate(-15deg);
    }
    .seal-text {
      text-align: center;
      color: #10b981;
      font-size: 11px;
      font-weight: bold;
      line-height: 1.2;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="seal">
      <div class="seal-text">
        CERTIFIED<br/>INTERN<br/>2026
      </div>
    </div>

    <div class="header">
      <h1>SKILLSWAP HUB</h1>
      <p class="tagline">Empowering Learning Through Collaboration</p>
    </div>

    <div class="title">
      <h2>Certificate of Completion</h2>
      <p class="subtitle">Internship Program</p>
    </div>

    <div class="recipient">
      <p class="label">This is to certify that</p>
      <p class="name">{{name}}</p>
      <p class="role">{{role}}</p>
    </div>

    <div class="content">
      <p>has successfully completed an internship program at SkillSwap Hub.</p>
      <p>Throughout the internship period, {{name}} demonstrated exceptional dedication,<br/>
      professionalism, and a strong commitment to learning and growth.</p>
    </div>

    <div class="details">
      <div>
        <p class="label">Start Date</p>
        <p class="value">{{joiningDate}}</p>
      </div>
      <div>
        <p class="label">Completion Date</p>
        <p class="value">{{completionDate}}</p>
      </div>
      <div>
        <p class="label">Duration</p>
        <p class="value">{{duration}}</p>
      </div>
    </div>

    <div class="signatures">
      <div>
        <div class="line"></div>
        <p><strong>HR Manager</strong></p>
        <p>Human Resources</p>
      </div>
      <div>
        <div class="line"></div>
        <p><strong>Director</strong></p>
        <p>SkillSwap Hub</p>
      </div>
    </div>

    <div class="qr-section">
      <img src="{{qrCode}}" alt="Verification QR Code" />
      <p>Scan to verify this certificate | Certificate ID: {{internEmployeeId}}</p>
      <p style="font-size: 10px; margin-top: 5px;">Issued on {{completionDate}} | www.skillswaphub.in</p>
    </div>
  </div>
</body>
</html>`,
    isActive: true
  },
  {
    type: 'hiring_certificate',
    name: 'Intern Hiring Certificate',
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hiring Certificate</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      margin: 0;
      padding: 40px;
      background: #fff;
    }
    .certificate {
      max-width: 700px;
      margin: 0 auto;
      padding: 40px;
      border: 2px solid #0ea5e9;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #0ea5e9;
      padding-bottom: 20px;
    }
    .header h1 {
      color: #0ea5e9;
      margin: 0;
      font-size: 28px;
    }
    .header p {
      color: #64748b;
      margin: 5px 0;
      font-size: 14px;
    }
    .title {
      text-align: center;
      margin: 30px 0;
    }
    .title h2 {
      color: #0f172a;
      font-size: 24px;
      text-transform: uppercase;
    }
    .content {
      margin: 20px 0;
      line-height: 1.8;
      color: #334155;
    }
    .content p {
      margin: 15px 0;
    }
    .info-box {
      background: #f8fafc;
      padding: 20px;
      margin: 20px 0;
      border-left: 4px solid #0ea5e9;
    }
    .info-box p {
      margin: 8px 0;
      font-size: 15px;
    }
    .signature {
      margin-top: 50px;
      text-align: right;
    }
    .signature .line {
      border-top: 1px solid #334155;
      width: 200px;
      margin: 0 0 5px auto;
    }
    .signature p {
      margin: 5px 0;
      color: #334155;
    }
    .qr-code {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px dashed #cbd5e1;
    }
    .qr-code img {
      width: 100px;
      height: 100px;
    }
    .qr-code p {
      color: #64748b;
      font-size: 11px;
      margin-top: 8px;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      <h1>SKILLSWAP HUB</h1>
      <p>www.skillswaphub.in | info@skillswaphub.in</p>
    </div>

    <div class="title">
      <h2>Hiring Certificate</h2>
    </div>

    <div class="content">
      <p><strong>Date:</strong> {{joiningDate}}</p>
      <p><strong>Certificate ID:</strong> {{internEmployeeId}}</p>

      <p>To Whom It May Concern,</p>

      <p>This is to certify that <strong>{{name}}</strong> has been hired as an intern at SkillSwap Hub for the position of <strong>{{role}}</strong>.</p>

      <div class="info-box">
        <p><strong>Candidate Name:</strong> {{name}}</p>
        <p><strong>Position:</strong> {{role}}</p>
        <p><strong>Internship Duration:</strong> {{duration}}</p>
        <p><strong>Start Date:</strong> {{joiningDate}}</p>
      </div>

      <p>During the internship period, {{name}} will be working under the guidance of our experienced team members and will contribute to various projects and initiatives.</p>

      <p>This certificate is issued upon request for official purposes.</p>
    </div>

    <div class="signature">
      <div class="line"></div>
      <p><strong>Authorized Signatory</strong></p>
      <p>SkillSwap Hub</p>
      <p>{{joiningDate}}</p>
    </div>

    <div class="qr-code">
      <img src="{{qrCode}}" alt="Verification QR Code" />
      <p>Verify at www.skillswaphub.in | ID: {{internEmployeeId}}</p>
    </div>
  </div>
</body>
</html>`,
    isActive: false
  }
];

async function migrate() {
  try {
    console.log('🚀 Starting migration: Add Intern Templates...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ Connected to MongoDB\n');

    // Add Email Templates
    console.log('📧 Adding Email Templates...');
    for (const template of emailTemplates) {
      const existing = await EmailTemplate.findOne({ templateKey: template.templateKey });
      if (existing) {
        console.log(`  ⚠️  Template "${template.templateKey}" already exists, skipping...`);
      } else {
        await EmailTemplate.create(template);
        console.log(`  ✓ Added: ${template.name}`);
      }
    }

    // Add Certificate Templates
    console.log('\n📜 Adding Certificate Templates...');
    for (const template of certificateTemplates) {
      const existing = await CertificateTemplate.findOne({ 
        type: template.type,
        name: template.name 
      });
      if (existing) {
        console.log(`  ⚠️  Template "${template.name}" already exists, skipping...`);
      } else {
        await CertificateTemplate.create(template);
        console.log(`  ✓ Added: ${template.name}`);
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`  - Email Templates: ${emailTemplates.length}`);
    console.log(`  - Certificate Templates: ${certificateTemplates.length}`);
    console.log('\n💡 Next Steps:');
    console.log('  1. Install required packages: npm install qrcode puppeteer node-cron');
    console.log('  2. Review templates in Admin Panel');
    console.log('  3. Test intern creation workflow');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Run migration
migrate();
