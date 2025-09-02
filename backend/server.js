const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const passport = require('passport');
const session = require('express-session');
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

const app = express();
const server = http.createServer(app);

const io = socketIO(server, {
  cors: { 
    origin: ['http://localhost:5173', 'https://skillswaphub.in', 'https://skill-swap-69nw.onrender.com'],
    credentials: true 
  },
});

app.use(cors({ 
  origin: ['http://localhost:5173', 'https://skillswaphub.in', 'https://skill-swap-69nw.onrender.com'],
  credentials: true 
}));
app.use(express.json());
app.use(cookieParser());

app.use(session({
  secret: 'secret_key',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
require('./socket')(io);
app.set('io', io);

app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/session-requests', sessionRequestRoutes);
app.use('/api/skillmates', skillMateRoutes);
app.use('/api', privateProfileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected');
    server.listen(process.env.PORT, () =>
      console.log(`Server running on port ${process.env.PORT}`)
    );
  })
  .catch((err) => console.log(err));