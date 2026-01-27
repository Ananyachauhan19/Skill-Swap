const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load backend .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('[resetCoinsToBronze] MONGO_URI is not set in backend/.env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('[resetCoinsToBronze] Connected to MongoDB');

    const result = await User.updateMany({}, {
      $set: {
        silverCoins: 0,
        bronzeCoins: 100,
      },
    });

    console.log('[resetCoinsToBronze] Update complete:', {
      matched: result.matchedCount ?? result.n,
      modified: result.modifiedCount ?? result.nModified,
    });
  } catch (err) {
    console.error('[resetCoinsToBronze] Error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
