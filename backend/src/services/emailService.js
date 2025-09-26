const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Configure email transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    console.log('📧 Email service initialized with:', {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      user: process.env.EMAIL_USER,
      hasPassword: !!process.env.EMAIL_PASS
    });
  }

  /**
   * Send lead revert notification to customer
   */
  async sendLeadRevertNotification(leadData, revertReason = '') {
    try {
      const { customerName, email, productType, _id, status } = leadData;
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || '"LeadVault System" <no-reply@leadvault.com>',
        to: email,
        subject: `Action Required: Your ${productType} Application - ID: ${_id.toString().slice(-8)}`,
        html: this.generateRevertEmailTemplate({
          customerName,
          productType,
          leadId: _id.toString().slice(-8),
          status,
          revertReason,
          loginUrl: process.env.CUSTOMER_PORTAL_URL || 'http://localhost:8080/customer/login'
        })
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('📧 Lead revert email sent successfully:', {
        messageId: info.messageId,
        to: email,
        leadId: _id
      });

      return {
        success: true,
        messageId: info.messageId,
        recipientEmail: email
      };

    } catch (error) {
      console.error('❌ Failed to send lead revert email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate HTML email template for lead revert notification
   */
  generateRevertEmailTemplate({ customerName, productType, leadId, status, revertReason, loginUrl }) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Action Required - Lead Update</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f9f9f9;
            }
            .email-container {
                background: white;
                border-radius: 10px;
                padding: 30px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #e74c3c;
            }
            .logo {
                font-size: 24px;
                font-weight: bold;
                color: #e74c3c;
                margin-bottom: 10px;
            }
            .alert-badge {
                background: #e74c3c;
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: bold;
                display: inline-block;
            }
            .lead-info {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
            }
            .info-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                padding: 5px 0;
                border-bottom: 1px solid #eee;
            }
            .info-label {
                font-weight: bold;
                color: #666;
            }
            .info-value {
                color: #333;
            }
            .reason-box {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 5px;
                padding: 15px;
                margin: 20px 0;
            }
            .cta-button {
                display: inline-block;
                background: #e74c3c;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
                text-align: center;
                margin: 20px 0;
            }
            .cta-button:hover {
                background: #c0392b;
            }
            .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                font-size: 12px;
                color: #666;
                text-align: center;
            }
            .next-steps {
                background: #e8f5e8;
                border-left: 4px solid #27ae60;
                padding: 15px;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <div class="logo">🏦 LeadVault</div>
                <div class="alert-badge">⚠️ ACTION REQUIRED</div>
            </div>

            <h2>Dear ${customerName},</h2>
            
            <p>We hope this email finds you well. We are writing to inform you that your <strong>${productType}</strong> application requires additional information or updates from your side.</p>

            <div class="lead-info">
                <h3>📋 Application Details</h3>
                <div class="info-row">
                    <span class="info-label">Application ID:</span>
                    <span class="info-value">${leadId}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Product Type:</span>
                    <span class="info-value">${productType}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Current Status:</span>
                    <span class="info-value">${status}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Date:</span>
                    <span class="info-value">${new Date().toLocaleDateString()}</span>
                </div>
            </div>

            ${revertReason ? `
            <div class="reason-box">
                <h4>📝 Reason for Update Request:</h4>
                <p>${revertReason}</p>
            </div>
            ` : ''}

            <div class="next-steps">
                <h4>🚀 Next Steps:</h4>
                <ol>
                    <li>Review the feedback provided by our team</li>
                    <li>Update your application with the required information</li>
                    <li>Submit the updated application for review</li>
                    <li>Our team will process your application within 2-3 business days</li>
                </ol>
            </div>

            <div style="text-align: center;">
                <a href="${loginUrl}" class="cta-button">
                    🔐 Access Your Application Portal
                </a>
            </div>

            <p><strong>Important:</strong> Please respond to this request within <strong>7 business days</strong> to avoid any delays in processing your application.</p>

            <p>If you have any questions or need assistance, please don't hesitate to contact our customer support team.</p>

            <p>Thank you for choosing our services.</p>

            <p>Best regards,<br>
            <strong>The LeadVault Team</strong><br>
            Customer Support Department</p>

            <div class="footer">
                <p>This is an automated message from LeadVault System. Please do not reply directly to this email.</p>
                <p>📞 Support: 1-800-LEADVAULT | 📧 Email: support@leadvault.com</p>
                <p>© 2025 LeadVault. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>`;
  }

  /**
   * Send application status update notification
   */
  async sendStatusUpdateNotification(leadData, oldStatus, newStatus) {
    try {
      const { customerName, email, productType, _id } = leadData;
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || '"LeadVault System" <no-reply@leadvault.com>',
        to: email,
        subject: `Application Status Update: ${productType} - ID: ${_id.toString().slice(-8)}`,
        html: this.generateStatusUpdateTemplate({
          customerName,
          productType,
          leadId: _id.toString().slice(-8),
          oldStatus,
          newStatus
        })
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('📧 Status update email sent successfully:', {
        messageId: info.messageId,
        to: email,
        leadId: _id,
        statusChange: `${oldStatus} → ${newStatus}`
      });

      return {
        success: true,
        messageId: info.messageId,
        recipientEmail: email
      };

    } catch (error) {
      console.error('❌ Failed to send status update email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate status update email template
   */
  generateStatusUpdateTemplate({ customerName, productType, leadId, oldStatus, newStatus }) {
    const getStatusColor = (status) => {
      const colors = {
        'New': '#3498db',
        'In Progress': '#f39c12',
        'Under Review': '#9b59b6',
        'Approved': '#27ae60',
        'Rejected': '#e74c3c',
        'Completed': '#2c3e50'
      };
      return colors[status] || '#666';
    };

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Application Status Update</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f9f9f9;
            }
            .email-container {
                background: white;
                border-radius: 10px;
                padding: 30px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #3498db;
            }
            .logo {
                font-size: 24px;
                font-weight: bold;
                color: #3498db;
                margin-bottom: 10px;
            }
            .status-change {
                text-align: center;
                margin: 30px 0;
                padding: 20px;
                background: #f8f9fa;
                border-radius: 8px;
            }
            .status-badge {
                display: inline-block;
                padding: 8px 16px;
                border-radius: 20px;
                color: white;
                font-weight: bold;
                margin: 0 10px;
            }
            .arrow {
                font-size: 24px;
                color: #666;
                margin: 0 10px;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <div class="logo">🏦 LeadVault</div>
                <h2>Application Status Update</h2>
            </div>

            <h3>Dear ${customerName},</h3>
            
            <p>We wanted to update you on the status of your <strong>${productType}</strong> application.</p>

            <div style="text-align: center; margin: 20px 0;">
                <p><strong>Application ID:</strong> ${leadId}</p>
            </div>

            <div class="status-change">
                <h4>Status Change:</h4>
                <div style="margin: 20px 0;">
                    <span class="status-badge" style="background-color: ${getStatusColor(oldStatus)}">${oldStatus}</span>
                    <span class="arrow">→</span>
                    <span class="status-badge" style="background-color: ${getStatusColor(newStatus)}">${newStatus}</span>
                </div>
            </div>

            <p>Our team is working diligently to process your application. We will keep you updated as your application progresses through our review process.</p>

            <p>If you have any questions, please feel free to contact our support team.</p>

            <p>Thank you for choosing our services.</p>

            <p>Best regards,<br>
            <strong>The LeadVault Team</strong></p>
        </div>
    </body>
    </html>`;
  }

  /**
   * Send lead update notification to customer
   */
  async sendLeadUpdateNotification(lead, updateDetails) {
    const email = lead.email;
    const customerName = lead.customerName;
    
    if (!email) {
      console.log('⚠️ No email address found for lead:', lead._id);
      return { success: false, error: 'No email address provided' };
    }

    try {
      console.log(`📧 Sending lead update notification to: ${email}`);

      const loginUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
      
      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME || 'BOI Bank Lead Management'} <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: `Lead Update - ${lead.productType} Application`,
        html: this.generateUpdateEmailTemplate({
          customerName,
          productType: lead.productType,
          leadId: lead._id,
          status: lead.status,
          updateDetails,
          loginUrl
        })
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Lead update email sent successfully:', info.messageId);
      
      return {
        success: true,
        messageId: info.messageId,
        recipientEmail: email
      };

    } catch (error) {
      console.error('❌ Failed to send lead update email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate HTML email template for lead update notification
   */
  generateUpdateEmailTemplate({ customerName, productType, leadId, status, updateDetails, loginUrl }) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Lead Update Notification</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f9f9f9;
            }
            .email-container {
                background: white;
                border-radius: 10px;
                padding: 30px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #2c5aa0;
            }
            .logo {
                font-size: 24px;
                font-weight: bold;
                color: #2c5aa0;
                margin-bottom: 10px;
            }
            .title {
                color: #2c5aa0;
                font-size: 20px;
                margin-bottom: 20px;
            }
            .content {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
            }
            .status-badge {
                display: inline-block;
                padding: 8px 16px;
                border-radius: 20px;
                background: #28a745;
                color: white;
                font-weight: bold;
                margin: 10px 0;
            }
            .cta-button {
                display: inline-block;
                padding: 12px 24px;
                background: #2c5aa0;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                font-weight: bold;
                margin: 20px 0;
            }
            .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                font-size: 14px;
                color: #666;
                text-align: center;
            }
            .contact-info {
                background: #e9ecef;
                padding: 15px;
                border-radius: 6px;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <div class="logo">🏦 BOI Bank</div>
                <div class="title">Lead Update Notification</div>
            </div>

            <p>Dear ${customerName},</p>

            <p>We wanted to inform you that your <strong>${productType}</strong> application has been updated.</p>

            <div class="content">
                <h3>📋 Update Details:</h3>
                <p><strong>Lead ID:</strong> ${leadId}</p>
                <p><strong>Current Status:</strong> <span class="status-badge">${status}</span></p>
                <p><strong>Changes Made:</strong> ${updateDetails}</p>
            </div>

            <p>Our team is working diligently to process your application. You can track the progress of your application anytime through our portal.</p>

            <div style="text-align: center;">
                <a href="${loginUrl}/leads/${leadId}" class="cta-button">
                    View Application Status
                </a>
            </div>

            <div class="contact-info">
                <h4>📞 Need Assistance?</h4>
                <p>If you have any questions about your application, please don't hesitate to contact us:</p>
                <p><strong>Phone:</strong> 1800-123-4567 (Toll Free)</p>
                <p><strong>Email:</strong> support@boibank.com</p>
                <p><strong>Business Hours:</strong> Monday to Friday, 9:00 AM to 6:00 PM</p>
            </div>

            <p>Thank you for choosing BOI Bank for your financial needs. We appreciate your patience as we process your application.</p>

            <div class="footer">
                <p><strong>BOI Bank Lead Management System</strong></p>
                <p>This is an automated notification. Please do not reply to this email.</p>
                <p>© 2025 BOI Bank. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Send remarks to customer
   */
  async sendRemarksToCustomer(lead, remarks) {
    const email = lead.email;
    const customerName = lead.customerName;
    
    if (!email) {
      console.log('⚠️ No email address found for lead:', lead._id);
      return { success: false, error: 'No email address provided' };
    }

    try {
      console.log(`📧 Sending remarks to customer: ${email}`);

      const loginUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
      
      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME || 'BOI Bank Lead Management'} <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: `Important Update - ${lead.productType} Application`,
        html: this.generateRemarksEmailTemplate({
          customerName,
          productType: lead.productType,
          leadId: lead._id,
          status: lead.status,
          remarks,
          loginUrl
        })
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Remarks email sent successfully:', info.messageId);
      
      return {
        success: true,
        messageId: info.messageId,
        recipientEmail: email
      };

    } catch (error) {
      console.error('❌ Failed to send remarks email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate HTML email template for remarks notification
   */
  generateRemarksEmailTemplate({ customerName, productType, leadId, status, remarks, loginUrl }) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Important Update - BOI Bank</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f9f9f9;
            }
            .email-container {
                background: white;
                border-radius: 10px;
                padding: 30px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #2c5aa0;
            }
            .logo {
                font-size: 24px;
                font-weight: bold;
                color: #2c5aa0;
                margin-bottom: 10px;
            }
            .title {
                color: #2c5aa0;
                font-size: 20px;
                margin-bottom: 20px;
            }
            .content {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
            }
            .remarks-box {
                background: #e3f2fd;
                border-left: 4px solid #2196f3;
                padding: 15px;
                margin: 20px 0;
                font-style: italic;
            }
            .status-badge {
                display: inline-block;
                padding: 8px 16px;
                border-radius: 20px;
                background: #28a745;
                color: white;
                font-weight: bold;
                margin: 10px 0;
            }
            .cta-button {
                display: inline-block;
                padding: 12px 24px;
                background: #2c5aa0;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                font-weight: bold;
                margin: 20px 0;
            }
            .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                font-size: 14px;
                color: #666;
                text-align: center;
            }
            .contact-info {
                background: #e9ecef;
                padding: 15px;
                border-radius: 6px;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <div class="logo">🏦 BOI Bank</div>
                <div class="title">Important Update on Your Application</div>
            </div>

            <p>Dear ${customerName},</p>

            <p>We have an important update regarding your <strong>${productType}</strong> application.</p>

            <div class="content">
                <h3>📋 Application Details:</h3>
                <p><strong>Application ID:</strong> ${leadId}</p>
                <p><strong>Current Status:</strong> <span class="status-badge">${status}</span></p>
            </div>

            <div class="remarks-box">
                <h4>💬 Message from Our Team:</h4>
                <p>${remarks}</p>
            </div>

            <p>Our team is committed to providing you with the best service. If you have any questions or need to provide additional information, please don't hesitate to contact us.</p>

            <div style="text-align: center;">
                <a href="${loginUrl}/leads/${leadId}" class="cta-button">
                    View Application Details
                </a>
            </div>

            <div class="contact-info">
                <h4>📞 Need Assistance?</h4>
                <p>If you have any questions about this update, please contact us:</p>
                <p><strong>Phone:</strong> 1800-123-4567 (Toll Free)</p>
                <p><strong>Email:</strong> support@boibank.com</p>
                <p><strong>Business Hours:</strong> Monday to Friday, 9:00 AM to 6:00 PM</p>
            </div>

            <p>Thank you for choosing BOI Bank for your financial needs. We appreciate your patience and look forward to serving you.</p>

            <div class="footer">
                <p><strong>BOI Bank Lead Management System</strong></p>
                <p>This is an automated notification. Please do not reply to this email.</p>
                <p>© 2025 BOI Bank. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Test email configuration
   */
  async testEmailConfiguration() {
    try {
      const testMail = {
        from: process.env.EMAIL_FROM || '"LeadVault System" <no-reply@leadvault.com>',
        to: 'test@example.com',
        subject: 'LeadVault Email Configuration Test',
        text: 'This is a test email to verify email configuration.',
        html: '<p>This is a test email to verify email configuration.</p>'
      };

      const info = await this.transporter.sendMail(testMail);
      console.log('✅ Test email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Email configuration test failed:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();