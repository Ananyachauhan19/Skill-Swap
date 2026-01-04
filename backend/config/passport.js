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

const hasGoogleOauth = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CALLBACK);
if (hasGoogleOauth) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK
      },
      async (_accessToken, _refreshToken, profile, done) => {
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
              bronzeCoins: 100,
              badges: ['Starter', 'Helper'],
              rank: 'Bronze'
            });
          } else {
            let updated = false;
            if (!user.googleId) {
              user.googleId = profile.id;
              user.provider = 'google';
              updated = true;
            }
            if (typeof user.goldCoins !== 'number') {
              user.goldCoins = 0;
              updated = true;
            }
            // Ensure bronze coins are initialized for legacy users (no auto top-up of silver coins)
            if (typeof user.bronzeCoins !== 'number') {
              user.bronzeCoins = 100;
              updated = true;
            }
            if (updated) await user.save();
          }
          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
} else {
  // In local/dev mode without Google OAuth configured, skip strategy to allow server to boot
  console.warn('[passport] Google OAuth env not set; skipping GoogleStrategy setup');
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});
