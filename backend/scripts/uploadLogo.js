const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const cloudinary = require('../utils/cloudinary');

async function uploadLogo() {
  try {
    console.log('Uploading logo to Cloudinary...');
    
    const logoPath = path.join(__dirname, '../../frontend/dist/skillswaphub-logo.png');
    
    const result = await cloudinary.uploader.upload(logoPath, {
      folder: 'webimages',
      public_id: 'skillswaphub-logo',
      overwrite: true,
      resource_type: 'image'
    });

    console.log('✅ Logo uploaded successfully!');
    console.log('New Logo URL:', result.secure_url);
    console.log('\nReplace all instances of the old URL with:');
    console.log(result.secure_url);
    
    return result.secure_url;
  } catch (error) {
    console.error('❌ Error uploading logo:', error.message);
    process.exit(1);
  }
}

uploadLogo();
