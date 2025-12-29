const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function main() {
  const imgPath = path.resolve(__dirname, '../../frontend/public/campus_1on1.png');

  if (!fs.existsSync(imgPath)) {
    console.error(`File not found: ${imgPath}`);
    process.exit(1);
  }

  const result = await cloudinary.uploader.upload(imgPath, {
    folder: 'webimages/campus',
    public_id: 'oneonone-hero',
    resource_type: 'image',
    overwrite: true,
  });

  console.log(`CAMPUS_ONEONONE_HERO_URL=${result.secure_url}`);
}

main().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
