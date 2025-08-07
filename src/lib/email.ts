import { Resend } from 'resend';

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({ to, subject, html, from }: SendEmailOptions) {
  try {
    // Use your verified domain or the default Resend domain
    const fromEmail = from || process.env.EMAIL_FROM || 'DO Tracker <onboarding@resend.dev>';
    
    console.log('Attempting to send email:', {
      from: fromEmail,
      to,
      subject,
      hasApiKey: !!process.env.RESEND_API_KEY,
      apiKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 10) + '...',
    });
    
    type ResendSendResult = { data?: { id?: string | null } | null; error?: unknown | null };
    const result = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    }) as unknown as ResendSendResult;

    // The SDK returns { data, error }
    const sentId = result?.data?.id || undefined;
    if (sentId) {
      console.log('Email sent successfully:', {
        id: sentId,
        to,
        from: fromEmail,
      });
      return { success: true, data: result };
    }

    console.error('Failed to send email - SDK error:', {
      error: result?.error,
      to,
      from: fromEmail,
    });
    return { success: false, error: result?.error };
  } catch (error: unknown) {
    const err = error as { message?: string; name?: string; statusCode?: number };
    console.error('Failed to send email - Exception:', {
      error: err?.message || error,
      statusCode: err?.statusCode,
      name: err?.name,
      to,
      from: from || process.env.EMAIL_FROM || 'DO Tracker <onboarding@resend.dev>',
    });
    return { success: false, error };
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