const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

/**
 * Generate PDF from HTML content
 * @param {string} htmlContent - The HTML content to convert to PDF
 * @param {string} filename - Output filename
 * @returns {Promise<string>} - Path to the generated PDF
 */
async function generatePDF(htmlContent, filename) {
  let browser;
  try {
    const pdfDir = path.join(__dirname, '../public/certificates');
    
    // Ensure directory exists
    try {
      await fs.access(pdfDir);
    } catch {
      await fs.mkdir(pdfDir, { recursive: true });
    }

    const pdfPath = path.join(pdfDir, filename);

    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
    });

    await browser.close();
    
    return pdfPath;
  } catch (error) {
    if (browser) await browser.close();
    console.error('PDF generation error:', error);
    throw new Error('Failed to generate PDF');
  }
}

/**
 * Generate PDF as buffer
 * @param {string} htmlContent - The HTML content to convert to PDF
 * @returns {Promise<Buffer>} - PDF buffer
 */
async function generatePDFBuffer(htmlContent) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
    });

    await browser.close();
    
    return pdfBuffer;
  } catch (error) {
    if (browser) await browser.close();
    console.error('PDF buffer generation error:', error);
    throw new Error('Failed to generate PDF buffer');
  }
}

module.exports = {
  generatePDF,
  generatePDFBuffer,
};
