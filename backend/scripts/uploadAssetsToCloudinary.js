const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Store all uploaded URLs for reference
const uploadedUrls = {};

async function uploadImageToCloudinary(imagePath, publicId) {
  try {
    console.log(`Uploading ${imagePath}...`);
    const result = await cloudinary.uploader.upload(imagePath, {
      folder: 'webimages',
      public_id: publicId,
      resource_type: 'image',
      overwrite: true,
    });
    console.log(`✅ Uploaded: ${publicId} -> ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error(`❌ Error uploading ${imagePath}:`, error.message);
    return null;
  }
}

async function uploadAllAssets() {
  const assetsPath = path.resolve(__dirname, '../../frontend/public/assets');
  
  // Define all images to upload with their paths
  const images = [
    // Root assets
    { path: 'expert-connect-illustration.webp', publicId: 'expert-connect-illustration' },
    { path: 'group-discussion-illustration.webp', publicId: 'group-discussion-illustration' },
    { path: 'interview-illustration.webp', publicId: 'interview-illustration' },
    { path: 'session.webp', publicId: 'session' },
    { path: 'skillchoose.webp', publicId: 'skillchoose' },
    { path: 'skillswap-hero.webp', publicId: 'skillswap-hero' },
    { path: 'skillswap-logo.webp', publicId: 'skillswap-logo' },
    
    // activesession folder
    { path: 'activesession/activeusers.webp', publicId: 'activesession/activeusers' },
    { path: 'activesession/availableexpert.webp', publicId: 'activesession/availableexpert' },
    { path: 'activesession/completesession.webp', publicId: 'activesession/completesession' },
    
    // exploreopportunities folder
    { path: 'exploreopportunities/livesession.webp', publicId: 'exploreopportunities/livesession' },
    { path: 'exploreopportunities/mockinterview.webp', publicId: 'exploreopportunities/mockinterview' },
    { path: 'exploreopportunities/peertopeer.webp', publicId: 'exploreopportunities/peertopeer' },
    
    // team folder
    { path: 'team/abhishek.jpeg', publicId: 'team/abhishek' },
    { path: 'team/akshit.jpeg', publicId: 'team/akshit' },
    { path: 'team/Ananya.jpg', publicId: 'team/Ananya' },
    { path: 'team/anubhav.jpeg', publicId: 'team/anubhav' },
    { path: 'team/vivek.jpeg', publicId: 'team/vivek' },
  ];

  console.log('🚀 Starting upload of assets to Cloudinary (webimages folder)...\n');

  for (const image of images) {
    const fullPath = path.join(assetsPath, image.path);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${fullPath}`);
      continue;
    }

    const url = await uploadImageToCloudinary(fullPath, image.publicId);
    if (url) {
      uploadedUrls[image.path] = url;
    }
  }

  // Save the mapping to a JSON file
  const mappingPath = path.resolve(__dirname, 'cloudinary-urls-mapping.json');
  fs.writeFileSync(mappingPath, JSON.stringify(uploadedUrls, null, 2));
  console.log(`\n✅ All uploads complete! URL mapping saved to: ${mappingPath}`);
  
  // Print summary
  console.log('\n📋 Upload Summary:');
  console.log(`Total images: ${images.length}`);
  console.log(`Successfully uploaded: ${Object.keys(uploadedUrls).length}`);
  console.log(`Failed: ${images.length - Object.keys(uploadedUrls).length}`);
}

uploadAllAssets()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
