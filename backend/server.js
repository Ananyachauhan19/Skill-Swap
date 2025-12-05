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

// Load environment variables FIRST before any other imports that use them
// Use an explicit path to avoid CWD issues in PM2/systemd
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
const testimonialRoutes = require('./routes/testimonialRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const skillsRoutes = require('./routes/skillsRoutes');
const debugRoutes = require('./routes/debugRoutes');
const contributionRoutes = require('./routes/contributionRoutes');
const tutorRoutes = require('./routes/tutorRoutes');
const userRoutes = require('./routes/userRoutes');
const cron = require('node-cron');

const app = express();
const server = http.createServer(app);

// Trust reverse proxy (needed for secure cookies behind Nginx/ALB)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

const io = socketIO(server, {
  cors: { 
    origin: ['http://localhost:5173', 'http://localhost:5174','https://www.skillswaphub.in', 'https://skillswaphub.in', 'https://skill-swap-69nw.onrender.com'],
    credentials: true 
  },
});

app.use(cors({ 
  origin: ['http://localhost:5173', 'http://localhost:5174','https://www.skillswaphub.in', 'https://skillswaphub.in', 'https://skill-swap-69nw.onrender.com'],
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
require('./socket')(io);
app.set('io', io);

// Local /uploads serving removed (resumes now stored in Supabase). If other local assets needed, re-add selectively.

app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/session-requests', sessionRequestRoutes);
app.use('/api/skillmates', skillMateRoutes);
app.use('/api', privateProfileRoutes);
app.use('/api/admin', adminRoutes);
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
  .then(() => {
    console.log('MongoDB Connected');
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
  })
  .catch((err) => console.log(err));
