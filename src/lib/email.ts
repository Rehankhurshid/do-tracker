const brevo = require('@getbrevo/brevo');

// Initialize Brevo API client
const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY || '');

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({ to, subject, html, from }: SendEmailOptions) {
  try {
    // Use your verified sender or the default
    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@yourdomain.com';
    const senderName = process.env.BREVO_SENDER_NAME || 'DO Tracker';
    
    console.log('Attempting to send email via Brevo:', {
      from: `${senderName} <${senderEmail}>`,
      to,
      subject,
      hasApiKey: !!process.env.BREVO_API_KEY,
      apiKeyPrefix: process.env.BREVO_API_KEY?.substring(0, 10) + '...',
    });

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = html;
    sendSmtpEmail.sender = { 
      name: senderName, 
      email: senderEmail 
    };
    sendSmtpEmail.to = [{ 
      email: to 
    }];
    
    // Optional: Add reply-to
    if (process.env.BREVO_REPLY_TO_EMAIL) {
      sendSmtpEmail.replyTo = { 
        email: process.env.BREVO_REPLY_TO_EMAIL,
        name: process.env.BREVO_REPLY_TO_NAME || 'DO Tracker Support'
      };
    }

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    
    console.log('Email sent successfully via Brevo:', {
      messageId: result.messageId,
      to,
      from: `${senderName} <${senderEmail}>`,
    });
    
    return { 
      success: true, 
      data: { 
        id: result.messageId,
        ...result 
      } 
    };
    
  } catch (error: any) {
    console.error('Failed to send email via Brevo:', {
      error: error?.response?.body || error?.message || error,
      statusCode: error?.response?.statusCode,
      to,
      from: from || `${process.env.BREVO_SENDER_NAME} <${process.env.BREVO_SENDER_EMAIL}>`,
    });
    
    return { 
      success: false, 
      error: error?.response?.body || error?.message || error 
    };
  }
}

export function generatePasswordResetEmail(resetLink: string, username: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #f0f0f0;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            text-decoration: none;
          }
          h1 {
            color: #1f2937;
            font-size: 24px;
            margin: 20px 0;
          }
          .content {
            margin: 20px 0;
            color: #4b5563;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #2563eb;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 20px 0;
          }
          .button:hover {
            background-color: #1d4ed8;
          }
          .warning {
            background-color: #fef3c7;
            border: 1px solid #fcd34d;
            border-radius: 6px;
            padding: 12px;
            margin: 20px 0;
            color: #92400e;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
          }
          .link {
            color: #2563eb;
            word-break: break-all;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}" class="logo">
              📦 DO Tracker
            </a>
          </div>
          
          <h1>Password Reset Request</h1>
          
          <div class="content">
            <p>Hi ${username},</p>
            
            <p>We received a request to reset your password for your DO Tracker account. Click the button below to create a new password:</p>
            
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </div>
            
            <div class="warning">
              <strong>⚠️ Important:</strong> This link will expire in 24 hours for security reasons. If you didn't request this password reset, please ignore this email.
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p class="link">${resetLink}</p>
          </div>
          
          <div class="footer">
            <p>This email was sent by DO Tracker - Order Management System</p>
            <p>© ${new Date().getFullYear()} DO Tracker. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function generateDOCreatedEmail(params: {
  doNumber: string;
  partyName?: string | null;
  authorizedPerson: string;
  validFrom: Date | string;
  validTo: Date | string;
  createdBy: string;
  notes?: string | null;
}) {
  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const validFrom = new Date(params.validFrom);
  const validTo = new Date(params.validTo);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Delivery Order Created</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
          .container { background-color: white; border-radius: 8px; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.08); }
          .header { text-align: center; margin-bottom: 16px; }
          .logo { font-size: 20px; font-weight: 700; color: #2563eb; text-decoration: none; }
          .meta { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0; }
          .row { display: flex; justify-content: space-between; gap: 12px; }
          .label { color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; }
          .value { color: #111827; font-weight: 600; }
          .button { display: inline-block; padding: 10px 16px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; margin-top: 12px; }
          .footer { margin-top: 20px; text-align: center; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <a href="${appUrl}" class="logo">📦 DO Tracker</a>
          </div>
          <h2 style="margin: 0 0 8px;">New Delivery Order Created</h2>
          <p style="margin: 0 0 8px;">A new Delivery Order has been created and is now at <strong>Area Office</strong>.</p>

          <div class="meta">
            <div class="row"><span class="label">DO Number</span><span class="value">${params.doNumber}</span></div>
            <div class="row"><span class="label">Party</span><span class="value">${params.partyName || '-'}</span></div>
            <div class="row"><span class="label">Authorized Person</span><span class="value">${params.authorizedPerson}</span></div>
            <div class="row"><span class="label">Valid From</span><span class="value">${validFrom.toLocaleDateString()}</span></div>
            <div class="row"><span class="label">Valid To</span><span class="value">${validTo.toLocaleDateString()}</span></div>
            <div class="row"><span class="label">Created By</span><span class="value">${params.createdBy}</span></div>
          </div>

          ${params.notes ? `<p style="margin: 0 0 8px;"><span class="label" style="display:block; margin-bottom:4px;">Notes</span>${params.notes}</p>` : ''}

          <a href="${appUrl}/area-office/process" class="button">View in Area Office</a>

          <div class="footer">
            <p>You're receiving this because you're subscribed to Area Office notifications.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function generateWelcomeEmail(params: {
  username: string;
  email: string;
  role: string;
  tempPassword?: string;
  resetLink?: string;
}) {
  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to DO Tracker</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #f0f0f0;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            text-decoration: none;
          }
          h1 {
            color: #1f2937;
            font-size: 24px;
            margin: 20px 0;
          }
          .content {
            margin: 20px 0;
            color: #4b5563;
          }
          .credentials {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 16px;
            margin: 20px 0;
          }
          .credential-row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
          }
          .credential-label {
            font-weight: 600;
            color: #374151;
          }
          .credential-value {
            color: #1f2937;
            font-family: monospace;
            background-color: #fff;
            padding: 2px 8px;
            border-radius: 4px;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #2563eb;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 20px 0;
          }
          .button:hover {
            background-color: #1d4ed8;
          }
          .warning {
            background-color: #fef3c7;
            border: 1px solid #fcd34d;
            border-radius: 6px;
            padding: 12px;
            margin: 20px 0;
            color: #92400e;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <a href="${appUrl}" class="logo">
              📦 DO Tracker
            </a>
          </div>
          
          <h1>Welcome to DO Tracker!</h1>
          
          <div class="content">
            <p>Hi ${params.username},</p>
            
            <p>Your account has been successfully created in the DO Tracker system. You can now log in and start managing delivery orders.</p>
            
            <div class="credentials">
              <h3 style="margin-top: 0;">Your Account Details:</h3>
              <div class="credential-row">
                <span class="credential-label">Username:</span>
                <span class="credential-value">${params.username}</span>
              </div>
              <div class="credential-row">
                <span class="credential-label">Email:</span>
                <span class="credential-value">${params.email}</span>
              </div>
              <div class="credential-row">
                <span class="credential-label">Role:</span>
                <span class="credential-value">${params.role.replace('_', ' ')}</span>
              </div>
              ${params.tempPassword ? `
              <div class="credential-row">
                <span class="credential-label">Temporary Password:</span>
                <span class="credential-value">${params.tempPassword}</span>
              </div>
              ` : ''}
            </div>
            
            ${params.resetLink ? `
            <div class="warning">
              <strong>⚠️ Action Required:</strong> Please set your password by clicking the button below. This link will expire in 24 hours.
            </div>
            
            <div style="text-align: center;">
              <a href="${params.resetLink}" class="button">Set Your Password</a>
            </div>
            ` : `
            <div style="text-align: center;">
              <a href="${appUrl}/login" class="button">Login to DO Tracker</a>
            </div>
            `}
            
            <h3>What you can do with your ${params.role.replace('_', ' ')} role:</h3>
            <ul>
              ${params.role === 'ADMIN' ? `
                <li>Manage all users and their permissions</li>
                <li>View and manage all delivery orders</li>
                <li>Access system reports and analytics</li>
                <li>Configure system settings</li>
              ` : params.role === 'AREA_OFFICE' ? `
                <li>Create new delivery orders</li>
                <li>Forward orders to Project Office and CISF</li>
                <li>Track and resolve issues</li>
                <li>View order status and history</li>
              ` : params.role === 'PROJECT_OFFICE' ? `
                <li>Review and approve delivery orders</li>
                <li>Forward approved orders to Road Sale</li>
                <li>Report and manage issues</li>
                <li>Track order processing status</li>
              ` : params.role === 'CISF' ? `
                <li>Review delivery orders for security clearance</li>
                <li>Approve or reject orders based on security requirements</li>
                <li>Report security-related issues</li>
                <li>Track security approval status</li>
              ` : params.role === 'ROAD_SALE' ? `
                <li>Receive approved delivery orders</li>
                <li>Mark orders as received</li>
                <li>Report delivery issues</li>
                <li>View order details and history</li>
              ` : ''}
            </ul>
          </div>
          
          <div class="footer">
            <p>If you have any questions or need assistance, please contact your system administrator.</p>
            <p>© ${new Date().getFullYear()} DO Tracker. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}