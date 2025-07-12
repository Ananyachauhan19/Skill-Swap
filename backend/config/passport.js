const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK
},
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Always try to find user by email first
      let user = await User.findOne({ email: profile.emails[0].value });

      if (!user) {
        // If not found, create new user
        user = await User.create({
          googleId: profile.id,
          email: profile.emails[0].value,
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          provider: 'google'
        });
      } else if (!user.googleId) {
        // If found but no googleId, update user
        user.googleId = profile.id;
        user.provider = 'google';
        await user.save();
      }

      return done(null, user);
    } catch (err) {
      // Handle duplicate key error gracefully
      if (err.code === 11000) {
        // Fetch the user by email
        const user = await User.findOne({ email: profile.emails[0].value });
        return done(null, user);
      }
      return done(err, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});
