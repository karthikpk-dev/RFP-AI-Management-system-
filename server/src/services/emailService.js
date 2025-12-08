const nodemailer = require('nodemailer');

// Create transporter using environment variables
// For testing, use Ethereal Email (ethereal.email)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Generate HTML email template for RFP
 * @param {Object} rfp - The RFP object with structured data
 * @returns {string} - HTML email content
 */
function generateRfpEmailTemplate(rfp) {
  const data = rfp.structured_json_data || {};
  const lineItems = data.lineItems || [];

  const lineItemsHtml = lineItems.length > 0
    ? `
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #3b82f6; color: white;">
            <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Item</th>
            <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Quantity</th>
            <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Specifications</th>
          </tr>
        </thead>
        <tbody>
          ${lineItems.map((item, index) => `
            <tr style="background-color: ${index % 2 === 0 ? '#f8fafc' : '#ffffff'};">
              <td style="padding: 12px; border: 1px solid #ddd;">${item.item || 'N/A'}</td>
              <td style="padding: 12px; text-align: center; border: 1px solid #ddd;">${item.quantity || 'N/A'}</td>
              <td style="padding: 12px; border: 1px solid #ddd;">${item.specs || 'N/A'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `
    : '<p style="color: #666;">No line items specified.</p>';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">📄 Request for Proposal</h1>
      </div>
      
      <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1e40af; margin-top: 0;">${rfp.title}</h2>
        
        <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0; color: #0369a1;"><strong>RFP ID:</strong> ${rfp.id}</p>
          <p style="margin: 5px 0 0 0; color: #0369a1;"><strong>Status:</strong> ${rfp.status}</p>
        </div>

        <h3 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">📋 Required Items</h3>
        ${lineItemsHtml}

        <h3 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">💰 Budget & Terms</h3>
        <table style="width: 100%; margin-bottom: 20px;">
          <tr>
            <td style="padding: 8px 0;"><strong>Budget:</strong></td>
            <td style="padding: 8px 0;">${data.budget ? `$${Number(data.budget).toLocaleString()}` : 'To be discussed'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Delivery Date:</strong></td>
            <td style="padding: 8px 0;">${data.deliveryDate || 'To be discussed'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Payment Terms:</strong></td>
            <td style="padding: 8px 0;">${data.paymentTerms || 'To be discussed'}</td>
          </tr>
        </table>

        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; color: #92400e;">
            <strong>📌 Next Steps:</strong> Please review the requirements above and submit your proposal at your earliest convenience.
          </p>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #6b7280; font-size: 12px; margin: 0;">
          This is an automated message from the RFP Management System. Please do not reply directly to this email.
        </p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send RFP email to a vendor
 * @param {Object} vendor - Vendor object with email
 * @param {Object} rfp - RFP object with details
 * @returns {Promise<Object>} - Email send result
 */
async function sendRfpEmail(vendor, rfp) {
  const htmlContent = generateRfpEmailTemplate(rfp);

  const mailOptions = {
    from: `"RFP Management System" <${process.env.EMAIL_USER}>`,
    to: vendor.email,
    subject: `Request for Proposal: ${rfp.title} - RFP #${rfp.id}`,
    html: htmlContent
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return {
      success: true,
      messageId: info.messageId,
      vendorEmail: vendor.email,
      previewUrl: nodemailer.getTestMessageUrl(info) // For Ethereal testing
    };
  } catch (error) {
    console.error(`Failed to send email to ${vendor.email}:`, error);
    return {
      success: false,
      error: error.message,
      vendorEmail: vendor.email
    };
  }
}

/**
 * Send RFP to multiple vendors
 * @param {Array} vendors - Array of vendor objects
 * @param {Object} rfp - RFP object
 * @returns {Promise<Object>} - Results for all sends
 */
async function sendRfpToVendors(vendors, rfp) {
  const results = await Promise.all(
    vendors.map(vendor => sendRfpEmail(vendor, rfp))
  );

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  return {
    totalSent: successful.length,
    totalFailed: failed.length,
    successful,
    failed
  };
}

module.exports = {
  sendRfpEmail,
  sendRfpToVendors,
  generateRfpEmailTemplate
};
