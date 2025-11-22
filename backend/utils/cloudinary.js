const { v2: cloudinary } = require('cloudinary');

// Ensure required env vars exist
const missing = ['CLOUDINARY_CLOUD_NAME','CLOUDINARY_API_KEY','CLOUDINARY_API_SECRET'].filter(k => !process.env[k]);
if (missing.length) {
  console.error(`[cloudinary] Missing required env vars: ${missing.join(', ')}. Set them in .env to enable profile image uploads.`);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

module.exports = cloudinary;