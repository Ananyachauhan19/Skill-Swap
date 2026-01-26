const cron = require('node-cron');
const Intern = require('../models/Intern');
const CertificateTemplate = require('../models/CertificateTemplate');
const { generatePDF } = require('../services/pdfService');
const { generateQRCodeDataURL } = require('../services/qrService');
const { sendTemplatedEmail, replaceTemplateVariables } = require('../services/emailService');

/**
 * Daily cron job to check for completed internships and generate completion certificates
 * Runs every day at 2:00 AM
 */
function startCompletionCertificateCron() {
  cron.schedule('0 2 * * *', async () => {
    console.log('[CRON] Running completion certificate generation job...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find all active interns whose expected completion date has passed
      const completedInterns = await Intern.find({
        status: 'active',
      });

      const internsToComplete = completedInterns.filter((intern) => {
        const expectedCompletion = new Date(intern.joiningDate);
        expectedCompletion.setDate(expectedCompletion.getDate() + intern.internshipDuration);
        expectedCompletion.setHours(0, 0, 0, 0);
        return today >= expectedCompletion;
      });

      console.log(`[CRON] Found ${internsToComplete.length} interns to complete`);

      for (const intern of internsToComplete) {
        try {
          // Fetch completion certificate template
          const template = await CertificateTemplate.findOne({
            type: 'completion_certificate',
            isActive: true,
          });

          if (!template) {
            console.error('[CRON] No active completion certificate template found');
            continue;
          }

          // Generate QR code
          const qrURL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/completioncertificate/${intern.internEmployeeId}`;
          const qrDataURL = await generateQRCodeDataURL(qrURL);

          // Replace variables in template
          const completionDate = new Date();
          const variables = {
            name: intern.name,
            role: intern.role,
            joiningDate: new Date(intern.joiningDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            completionDate: completionDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            duration: `${intern.internshipDuration} days`,
            internEmployeeId: intern.internEmployeeId,
            qrCode: qrDataURL,
          };

          const htmlContent = replaceTemplateVariables(template.htmlContent, variables);

          // Generate PDF
          const pdfFilename = `completion_${intern.internEmployeeId}_${Date.now()}.pdf`;
          const pdfPath = await generatePDF(htmlContent, pdfFilename);

          // Update intern status
          intern.status = 'completed';
          intern.completionDate = completionDate;
          intern.completionCertificatePath = `/certificates/${pdfFilename}`;
          await intern.save();

          // Send completion email
          try {
            await sendTemplatedEmail({
              to: intern.email,
              templateType: 'intern_completion',
              variables: {
                ...variables,
                certificateLink: qrURL,
              },
              attachments: [
                {
                  filename: 'Completion_Certificate.pdf',
                  path: pdfPath,
                },
              ],
            });
            console.log(`[CRON] Completion certificate sent to ${intern.email}`);
          } catch (emailError) {
            console.error(`[CRON] Failed to send completion email to ${intern.email}:`, emailError);
          }
        } catch (error) {
          console.error(`[CRON] Failed to process intern ${intern.internEmployeeId}:`, error);
        }
      }

      console.log('[CRON] Completion certificate generation job finished');
    } catch (error) {
      console.error('[CRON] Completion certificate job error:', error);
    }
  });

  console.log('[CRON] Completion certificate cron job started (runs daily at 2:00 AM)');
}

module.exports = { startCompletionCertificateCron };
