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
const questionRoutes = require('./routes/questionRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const chatRoutes = require('./routes/chatRoutes');
const path = require('path');

dotenv.config();
require('./config/passport');

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

const app = express();
const server = http.createServer(app);

const io = socketIO(server, {
  cors: { 
    origin: ['http://localhost:5173', 'http://localhost:5174', 'https://skillswaphub.in', 'https://skill-swap-69nw.onrender.com'],
    credentials: true 
  },
});

app.use(cors({ 
  origin: ['http://localhost:5173', 'http://localhost:5174', 'https://skillswaphub.in', 'https://skill-swap-69nw.onrender.com'],
  credentials: true 
}));
app.use(express.json());
app.use(cookieParser());

app.use(session({
  secret: 'secret_key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    touchAfter: 24 * 3600, // lazy session update (in seconds)
    crypto: {
      secret: 'secret_key'
    }
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // use secure cookies in production
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

app.use(passport.initialize());
app.use(passport.session());
require('./socket')(io);
app.set('io', io);

// Serve uploaded files (resume uploads). Keep compatibility with both 'uploads' and 'Uploads' folders.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));

// Ensure uploads/resumes folder exists to prevent multer write errors
const fs = require('fs');
const uploadsPath = path.join(__dirname, 'uploads', 'resumes');
try {
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.info('[INFO] Ensured uploads directory exists:', uploadsPath);
} catch (e) {
  console.error('[ERROR] Failed to ensure uploads directory:', uploadsPath, e);
}

// Generic error handler that returns JSON for API consumers (avoids HTML error pages)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500);
  // If the request accepts JSON, return JSON
  if (req.headers.accept && req.headers.accept.indexOf('application/json') !== -1) {
    return res.json({ message: err.message || 'Internal Server Error' });
  }
  // Fallback to plain text
  return res.type('txt').send(err.message || 'Internal Server Error');
});
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/session-requests', sessionRequestRoutes);
app.use('/api/skillmates', skillMateRoutes);
app.use('/api', privateProfileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api', skillsRoutes);
app.use('/api', debugRoutes);

// Backwards-compatible alias used in some frontend bundles
const interviewCtrl = require('./controllers/interviewController');
app.get('/api/interview-faqs', interviewCtrl.getFaqs);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected');
    server.listen(process.env.PORT, () =>
      console.log(`Server running on port ${process.env.PORT}`)
    );
  })
  .catch((err) => console.log(err));