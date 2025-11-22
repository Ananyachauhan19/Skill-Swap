#!/usr/bin/env node
/**
 * Migration script: upload existing local resumes from /backend/uploads/resumes to Supabase bucket
 * and update InterviewerApplication.resumeUrl to public Supabase URL.
 *
 * Usage (PowerShell):
 *   node ./backend/scripts/migrateInterviewResumes.js
 *
 * Requirements:
 *   - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (preferred) or SUPABASE_KEY set in environment/.env
 *   - Bucket (default interviewer-resumes) must exist.
 */
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');
const InterviewerApplication = require('../models/InterviewerApplication');

(async () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
  const bucket = process.env.SUPABASE_INTERVIEWER_RESUMES_BUCKET || 'interviewer-resumes';
  if (!supabaseUrl || !key) {
    console.error('Missing SUPABASE_URL or key env vars. Abort.');
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, key, { auth: { autoRefreshToken: false, persistSession: false } });
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const localDir = path.join(__dirname, '..', 'uploads', 'resumes');
  if (!fs.existsSync(localDir)) {
    console.log('Local resumes directory not found; nothing to migrate.');
    process.exit(0);
  }

  const apps = await InterviewerApplication.find({ resumeUrl: /\/uploads\/resumes\// });
  console.log(`Found ${apps.length} applications referencing local resume paths.`);

  let migrated = 0;
  for (const app of apps) {
    try {
      const localRel = app.resumeUrl.replace(/^\//, ''); // remove leading slash
      const fileName = path.basename(localRel);
      const localPath = path.join(__dirname, '..', 'uploads', 'resumes', fileName);
      if (!fs.existsSync(localPath)) {
        console.warn('Missing local file for', app._id.toString(), localPath);
        continue;
      }
      const fileBuffer = fs.readFileSync(localPath);
      const remoteName = `${app.user}-${Date.now()}-${fileName}`;
      const { error: uploadErr } = await supabase.storage.from(bucket).upload(remoteName, fileBuffer, {
        contentType: 'application/pdf', upsert: false,
      });
      if (uploadErr) {
        console.error('Supabase upload failed for', app._id.toString(), uploadErr.message);
        continue;
      }
      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(remoteName);
      app.resumeUrl = pub.publicUrl;
      await app.save();
      migrated++;
      console.log('Migrated', app._id.toString(), '->', pub.publicUrl);
    } catch (e) {
      console.error('Error migrating app', app._id.toString(), e.message);
    }
  }

  console.log(`Migration complete. Migrated ${migrated}/${apps.length}.`);
  await mongoose.disconnect();
  console.log('Disconnected MongoDB.');
})();
