const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const passport = require('passport');
const session = require('express-session');
const cors = require('cors');
const socketIO = require('socket.io');
const cookieParser = require('cookie-parser');

dotenv.config();
require('./config/passport');

const authRoutes = require('./routes/authRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const privateProfileRoutes = require('./routes/privateProfileRoutes');

const app = express();
const server = http.createServer(app);

const io = socketIO(server, {
  cors: { 
    origin: true, // Allow all origins
    credentials: true 
  },
});

app.use(cors({ 
  origin: true, // Allow all origins
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

app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes); 
app.use('/api', privateProfileRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected');
    server.listen(process.env.PORT, () =>
      console.log(`Server running on port ${process.env.PORT}`)
    );
  })
  .catch((err) => console.log(err));
