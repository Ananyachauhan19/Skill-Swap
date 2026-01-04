const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const socketIO = require('socket.io');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });
require('./config/passport');

// Now load routes that depend on environment variables
const questionRoutes = require('./routes/questionRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const chatRoutes = require('./routes/chatRoutes');
const videoRoutes = require('./routes/videoRoutes');

const authRoutes = require('./routes/authRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const sessionRequestRoutes = require('./routes/sessionRequestRoutes');
const privateProfileRoutes = require('./routes/privateProfileRoutes');
const skillMateRoutes = require('./routes/skillMateRoutes');
const adminRoutes = require('./routes/adminRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const testimonialRoutes = require('./routes/testimonialRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const skillsRoutes = require('./routes/skillsRoutes');
const debugRoutes = require('./routes/debugRoutes');
const contributionRoutes = require('./routes/contributionRoutes');
const tutorRoutes = require('./routes/tutorRoutes');
const userRoutes = require('./routes/userRoutes');
const tutorFeedbackRoutes = require('./routes/tutorFeedbackRoutes');
const reportRoutes = require('./routes/reportRoutes');
const helpRoutes = require('./routes/helpRoutes');
const packageRoutes = require('./routes/packageRoutes');
const recruitmentRoutes = require('./routes/recruitmentRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const blogRoutes = require('./routes/blogRoutes');
const visitorRoutes = require('./routes/visitorRoutes');
const campusAmbassadorRoutes = require('./routes/campusAmbassadorRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes');
const assessmentReportRoutes = require('./routes/assessmentReportRoutes');
const dataRoutes = require('./routes/dataRoutes');
const googleDataRoutes = require('./routes/googleDataRoutes');
const cron = require('node-cron');
const Session = require('./models/Session');
const User = require('./models/User');
const Notification = require('./models/Notification');
const { sendMail } = require('./utils/sendMail');
const emailTemplates = require('./utils/emailTemplates');
const anonymousVisitorTracking = require('./middleware/anonymousVisitorTracking');
const { expireOverdueInterviews } = require('./cron/expireInterviews');
const { initAssessmentCronJobs } = require('./cron/assessmentCronJobs');

const app = express();
const server = http.createServer(app);

// Trust reverse proxy (needed for secure cookies behind Nginx/ALB)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

const io = socketIO(server, {
  cors: { 
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:4173', 'https://www.skillswaphub.in', 'https://skillswaphub.in', 'https://skill-swap-69nw.onrender.com'],
    credentials: true 
  },
});

app.use(cors({ 
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:4173', 'https://www.skillswaphub.in', 'https://skillswaphub.in', 'https://skill-swap-69nw.onrender.com'],
  credentials: true 
}));
app.use(express.json());
app.use(cookieParser());

// Validate critical envs and harden session store
const MONGO_URI = process.env.MONGO_URI;
const SESSION_SECRET = process.env.SESSION_SECRET || process.env.COOKIE_SECRET || 'change-me-in-prod';

if (!MONGO_URI) {
  console.error('[Startup] MONGO_URI is not set. Set it in environment or .env.');
  // Fail fast to avoid cryptic connect-mongo runtime errors
  process.exit(1);
}
if (process.env.NODE_ENV === 'production' && (!SESSION_SECRET || SESSION_SECRET === 'change-me-in-prod')) {
  console.warn('[Startup] SESSION_SECRET is weak or missing; set a strong secret in production.');
}

const sessionStore = MongoStore.create({
  mongoUrl: MONGO_URI,
  collectionName: 'sessions',
  ttl: 14 * 24 * 60 * 60, // 14 days in seconds
  touchAfter: 24 * 3600, // lazy session update (in seconds)
  autoRemove: 'native',
  mongoOptions: {
    // Stable defaults for Node Mongo driver in many environments
    // (driver will ignore options it doesn't support on newer versions)
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
  },
});

sessionStore.on('error', (err) => {
  console.error('[SessionStore] Error:', err);
});

// Support secret rotation: first item is used to sign new cookies, others validate old ones
const SESSION_SECRETS = [SESSION_SECRET].concat(
  (process.env.SESSION_SECRET_PREVIOUS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
);

app.use(session({
  secret: SESSION_SECRETS,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  },
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(anonymousVisitorTracking);
require('./socket')(io);
app.set('io', io);
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/session-requests', sessionRequestRoutes);
app.use('/api/skillmates', skillMateRoutes);
app.use('/api', privateProfileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', employeeRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api', skillsRoutes);
app.use('/api', debugRoutes);
app.use('/api/contributions', contributionRoutes);
app.use('/api', tutorRoutes);
app.use('/api', userRoutes);
app.use('/api/tutors', tutorFeedbackRoutes);
app.use('/api', reportRoutes);
app.use('/api/support', helpRoutes);
app.use('/api', packageRoutes);
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api', verificationRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/campus-ambassador', campusAmbassadorRoutes);
app.use('/api', assessmentRoutes);
app.use('/api/assessment-reports', assessmentReportRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/google-data', googleDataRoutes);

// Backwards-compatible alias used in some frontend bundles
const interviewCtrl = require('./controllers/interviewController');
app.get('/api/interview-faqs', interviewCtrl.getFaqs);

// Centralized error handler (after routes) with Multer-specific responses
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  // Multer file size limit
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'Resume file too large. Max size is 2MB.' });
  }
  // Custom resume type validation error
  if (err && err.message === 'Resume must be a PDF') {
    return res.status(400).json({ message: err.message });
  }
  // General Multer errors
  if (err && err.name === 'MulterError') {
    return res.status(400).json({ message: err.message || 'File upload error' });
  }
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  return res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB Connected');
    
    // Expire overdue interviews immediately on startup
    try {
      const expiredCount = await expireOverdueInterviews();
      if (expiredCount > 0) {
        console.log(`[Startup] Expired ${expiredCount} overdue interview(s)`);
      }
    } catch (err) {
      console.error('[Startup] Failed to expire overdue interviews:', err);
    }
    
    // Initialize assessment cron jobs
    try {
      initAssessmentCronJobs();
      console.log('[Startup] ✅ Assessment cron jobs initialized');
    } catch (err) {
      console.error('[Startup] Failed to initialize assessment cron jobs:', err);
    }
    
    // Ensure indexes are created for optimal performance
    try {
      const Contribution = require('./models/Contribution');
      await Contribution.createIndexes();
      console.log('[DB] Contribution indexes created/verified');
    } catch (indexErr) {
      console.error('[DB] Index creation warning:', indexErr.message);
    }
    
    server.listen(process.env.PORT, () =>
      console.log(`Server running on port ${process.env.PORT}`)
    );

    // Schedule daily recompute (optional). Enable by setting ENABLE_CONTRIBUTION_CRON=true
    if (String(process.env.ENABLE_CONTRIBUTION_CRON || 'false').toLowerCase() === 'true') {
      try {
        cron.schedule('5 2 * * *', async () => {
          try {
            const now = new Date();
            const yest = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
            yest.setUTCDate(yest.getUTCDate() - 1);
            if (typeof contributionRoutes.recomputeContributionsForDate === 'function') {
              const res = await contributionRoutes.recomputeContributionsForDate(yest);
              console.log('[Contributions] Daily recompute complete for', res.dateKey, 'upserts:', res.upserts);
            }
          } catch (e) {
            console.error('[Contributions] Daily recompute failed:', e);
          }
        });
        console.log('[Contributions] Scheduled daily recompute at 02:05');
      } catch (e) {
        console.error('[Contributions] Failed to schedule cron job:', e);
      }
    } else {
      console.log('[Contributions] Cron disabled. Set ENABLE_CONTRIBUTION_CRON=true to enable.');
    }

    // Session reminders (5 minutes before start). Enable by default.
    if (String(process.env.ENABLE_SESSION_REMINDER_CRON || 'true').toLowerCase() === 'true') {
      const parseSessionStart = (sessionDoc) => {
        const dateStr = sessionDoc?.date;
        const timeStr = sessionDoc?.time;
        if (!dateStr || !timeStr) return null;

        // Best-effort parsing based on existing stored strings.
        const isoCandidate = `${dateStr} ${timeStr}`;
        let parsed = new Date(isoCandidate);
        if (!Number.isNaN(parsed.getTime())) return parsed;

        const m = String(dateStr).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (m) {
          const dd = m[1];
          const mm = m[2];
          const yyyy = m[3];
          parsed = new Date(`${yyyy}-${mm}-${dd} ${timeStr}`);
          if (!Number.isNaN(parsed.getTime())) return parsed;
        }

        return null;
      };

      try {
        cron.schedule('* * * * *', async () => {
          try {
            const now = new Date();
            const windowStart = new Date(now.getTime() + 4 * 60 * 1000);
            const windowEnd = new Date(now.getTime() + 6 * 60 * 1000);

            // Broad filter; date/time formats vary so we do parsing in-process.
            const candidateSessions = await Session.find({
              sessionType: 'expert',
              status: 'approved',
              reminderSent: { $ne: true },
            }).limit(200);

            for (const sessionDoc of candidateSessions) {
              const start = parseSessionStart(sessionDoc);
              if (!start) continue;
              if (start < windowStart || start > windowEnd) continue;

              const creator = await User.findById(sessionDoc.creator).select('name email');
              const invited = await User.findById(sessionDoc.invitedSkillMate).select('name email');
              if (!creator || !invited) continue;

              const date = sessionDoc.date;
              const time = sessionDoc.time;
              const subject = sessionDoc.subject || 'Expert Session';
              const topic = sessionDoc.topic || '';

              const creatorNotif = await Notification.create({
                userId: creator._id,
                type: 'expert-session-reminder',
                message: `Reminder: Your expert session with ${invited.name} starts in 5 minutes.`,
                sessionId: sessionDoc._id,
              });
              const invitedNotif = await Notification.create({
                userId: invited._id,
                type: 'expert-session-reminder',
                message: `Reminder: Your expert session with ${creator.name} starts in 5 minutes.`,
                sessionId: sessionDoc._id,
              });

              io.to(String(creator._id)).emit('notification', creatorNotif);
              io.to(String(invited._id)).emit('notification', invitedNotif);

              try {
                const t1 = emailTemplates.expertSessionReminder({
                  recipientName: creator.name,
                  otherPartyName: invited.name,
                  subject,
                  topic,
                  date,
                  time,
                });
                await sendMail({ to: creator.email, subject: t1.subject, html: t1.html });
              } catch (e) {
                console.error('[SessionReminder] Creator email failed:', e && e.message ? e.message : e);
              }

              try {
                const t2 = emailTemplates.expertSessionReminder({
                  recipientName: invited.name,
                  otherPartyName: creator.name,
                  subject,
                  topic,
                  date,
                  time,
                });
                await sendMail({ to: invited.email, subject: t2.subject, html: t2.html });
              } catch (e) {
                console.error('[SessionReminder] Invited email failed:', e && e.message ? e.message : e);
              }

              sessionDoc.reminderSent = true;
              sessionDoc.reminderSentAt = new Date();
              await sessionDoc.save();
            }
          } catch (err) {
            console.error('[SessionReminder] Cron tick failed:', err);
          }
        });
        console.log('[SessionReminder] Scheduled 5-minute reminders (every minute)');
      } catch (e) {
        console.error('[SessionReminder] Failed to schedule cron job:', e);
      }
    } else {
      console.log('[SessionReminder] Cron disabled. Set ENABLE_SESSION_REMINDER_CRON=true to enable.');
    }

    // Interview expiry job - runs every 10 minutes to expire scheduled interviews after 12 hours
    if (String(process.env.ENABLE_INTERVIEW_EXPIRY_CRON || 'true').toLowerCase() === 'true') {
      try {
        cron.schedule('*/10 * * * *', async () => {
          try {
            const expiredCount = await expireOverdueInterviews();
            if (expiredCount > 0) {
              console.log(`[InterviewExpiry] Expired ${expiredCount} overdue interview(s)`);
            }
          } catch (err) {
            console.error('[InterviewExpiry] Cron tick failed:', err);
          }
        });
        console.log('[InterviewExpiry] Scheduled interview expiry check (every 10 minutes)');
      } catch (e) {
        console.error('[InterviewExpiry] Failed to schedule cron job:', e);
      }
    } else {
      console.log('[InterviewExpiry] Cron disabled. Set ENABLE_INTERVIEW_EXPIRY_CRON=true to enable.');
    }
  })
  .catch((err) => console.log(err));
