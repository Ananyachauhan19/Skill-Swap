const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// Helper to generate a unique username
async function generateUsername(base) {
  let username = base.toLowerCase().replace(/[^a-z0-9]/g, '');
  let exists = await User.findOne({ username });
  let i = 1;
  while (exists) {
    username = base.toLowerCase().replace(/[^a-z0-9]/g, '') + i;
    exists = await User.findOne({ username });
    i++;
  }
  return username;
}

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK
},
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ email: profile.emails[0].value });
      if (!user) {
        const baseUsername = (profile.name.givenName || 'user') + (profile.name.familyName || '');
        const username = await generateUsername(baseUsername);
        user = await User.create({
          googleId: profile.id,
          email: profile.emails[0].value,
          firstName: profile.name.givenName || 'Google',
          lastName: profile.name.familyName || 'User',
          username,
          provider: 'google',
          skillsToTeach: [],
          skillsToLearn: [],
          bio: '',
          country: '',
          profilePic: profile.photos?.[0]?.value || '',
          education: [],
          experience: [],
          certificates: [],
          linkedin: '',
          website: '',
          github: '',
          twitter: '',
          credits: 1200,
          goldCoins: 0,
          silverCoins: 0,
          badges: ['Starter', 'Helper'],
          rank: 'Bronze'
        });
      } else if (!user.googleId) {
        user.googleId = profile.id;
        user.provider = 'google';
        await user.save();
      }
      return done(null, user);
    } catch (err) {
      if (err.code === 11000) {
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
