const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs').promises;

/**
 * Generate QR code for certificate verification
 * @param {string} url - The URL to encode in QR
 * @param {string} filename - Output filename
 * @returns {Promise<string>} - Path to the QR code image
 */
async function generateQRCode(url, filename) {
  try {
    const qrDir = path.join(__dirname, '../public/qrcodes');
    
    // Ensure directory exists
    try {
      await fs.access(qrDir);
    } catch {
      await fs.mkdir(qrDir, { recursive: true });
    }

    const qrPath = path.join(qrDir, filename);
    
    await QRCode.toFile(qrPath, url, {
      errorCorrectionLevel: 'H',
      type: 'png',
      width: 300,
      margin: 1,
    });

    return qrPath;
  } catch (error) {
    console.error('QR Code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Generate QR code as base64 data URL
 * @param {string} url - The URL to encode in QR
 * @returns {Promise<string>} - Base64 data URL
 */
async function generateQRCodeDataURL(url) {
  try {
    const dataURL = await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'H',
      width: 300,
      margin: 1,
    });
    return dataURL;
  } catch (error) {
    console.error('QR Code data URL generation error:', error);
    throw new Error('Failed to generate QR code data URL');
  }
}

module.exports = {
  generateQRCode,
  generateQRCodeDataURL,
};
