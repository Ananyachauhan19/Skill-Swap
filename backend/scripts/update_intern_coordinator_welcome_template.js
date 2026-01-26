// Script to update intern coordinator welcome email template
// Run with: node backend/scripts/update_intern_coordinator_welcome_template.js

const mongoose = require('mongoose');
const EmailTemplate = require('../models/EmailTemplate');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('MONGO_URI not set in environment.');
  process.exit(1);
}

const templateKey = 'intern_coordinator_welcome';
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
`;

async function update() {
  await mongoose.connect(MONGO_URI);
  
  const result = await EmailTemplate.updateOne(
    { templateKey },
    { 
      $set: { 
        subject,
        htmlBody
      } 
    }
  );
  
  if (result.matchedCount === 0) {
    console.log('Template not found. Creating new one...');
    await EmailTemplate.create({
      templateKey,
      name: 'Intern Coordinator Welcome Email',
      description: 'Sent to new intern coordinators with their credentials and login instructions.',
      subject,
      htmlBody,
      variables: ['name', 'email', 'password', 'role', 'loginUrl'],
      category: 'intern',
      isActive: true,
    });
    console.log('✅ Template created successfully!');
  } else {
    console.log(`✅ Template updated successfully! (${result.modifiedCount} document modified)`);
  }
  
  process.exit(0);
}

update().catch(e => {
  console.error('Update failed:', e);
  process.exit(1);
});
