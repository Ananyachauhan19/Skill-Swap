// Migration: Add intern coordinator welcome email template to EmailTemplate collection
// Run with: node backend/scripts/migrate_add_intern_coordinator_welcome_template.js

const mongoose = require('mongoose');
const EmailTemplate = require('../models/EmailTemplate');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('MONGO_URI not set in environment.');
  process.exit(1);
}

const templateKey = 'intern_coordinator_welcome';
const name = 'Intern Coordinator Welcome Email';
const description = 'Sent to new intern coordinators with their credentials and login instructions.';
const subject = 'Welcome as Intern Coordinator at SkillSwap';
const htmlBody = `
  <h2 style="margin:0 0 12px; color:#0f172a;">Welcome, \${name}</h2>
  <p>Congratulations! You have been added as an <strong>Intern Coordinator</strong> at SkillSwap.</p>
  <p><strong>Your login credentials:</strong></p>
  <ul>
    <li><strong>Email:</strong> \${email}</li>
    <li><strong>Password:</strong> \${password}</li>
    <li><strong>Role:</strong> \${role}</li>
  </ul>
  <p>You can now log in and start adding interns, assigning positions, and sending joining letters and certificates.</p>
  <div style="text-align:center; margin:24px 0;">
    <a href="\${loginUrl}" style="display:inline-block; background:#0ea5e9; color:#fff; padding:12px 24px; text-decoration:none; border-radius:6px; font-weight:500;">Login to Coordinator Portal</a>
  </div>
  <p style="margin-top:16px; color:#334155;">Best regards,<br/>SkillSwap Team</p>
`;
const variables = ['name', 'email', 'password', 'role', 'loginUrl'];
const category = 'intern';

async function up() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const existing = await EmailTemplate.findOne({ templateKey });
  if (existing) {
    console.log('Template already exists. Skipping.');
    process.exit(0);
  }
  await EmailTemplate.create({
    templateKey,
    name,
    description,
    subject,
    htmlBody,
    variables,
    category,
    isActive: true,
  });
  console.log('Intern coordinator welcome email template added.');
  process.exit(0);
}

up().catch(e => {
  console.error('Migration failed:', e);
  process.exit(1);
});
