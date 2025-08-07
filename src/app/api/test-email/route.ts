import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, testType = 'simple' } = body;

    if (!to) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    console.log('Test email endpoint called:', { to, testType });

    let subject = 'Test Email from DO Tracker';
    let html = '';

    if (testType === 'simple') {
      html = `
        <h1>Test Email</h1>
        <p>This is a test email from DO Tracker to verify email delivery.</p>
        <p>If you're receiving this, your email configuration is working!</p>
        <hr>
        <p style="font-size: 12px; color: #666;">
          Sent at: ${new Date().toISOString()}<br>
          From: ${process.env.EMAIL_FROM || 'DO Tracker <onboarding@resend.dev>'}
        </p>
      `;
    } else if (testType === 'welcome') {
      const resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=test-token`;
      html = `
        <h1>Welcome to DO Tracker</h1>
        <p>This is a test of the welcome email template.</p>
        <p>In a real scenario, you would click the link below to set your password:</p>
        <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px;">Set Password (Test Link)</a>
        <p style="color: #666; font-size: 12px; margin-top: 20px;">This is just a test - the link won't actually work.</p>
      `;
      subject = 'Test Welcome Email - DO Tracker';
    }

    // Try with different from addresses to debug
    const fromAddresses = [
      process.env.EMAIL_FROM,
      'DO Tracker <onboarding@resend.dev>',
      'onboarding@resend.dev',
    ];

    console.log('Trying to send with different from addresses:', fromAddresses);

    let lastError = null;
    let successResult = null;

    for (const fromAddress of fromAddresses) {
      if (!fromAddress) continue;
      
      console.log(`Attempting to send from: ${fromAddress}`);
      
      const result = await sendEmail({
        to,
        subject: `${subject} (from: ${fromAddress})`,
        html,
        from: fromAddress,
      });

      if (result.success) {
        successResult = { ...result, usedFrom: fromAddress };
        break;
      } else {
        lastError = result.error;
        console.log(`Failed with ${fromAddress}:`, result.error);
      }
    }

    if (successResult) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully',
        data: successResult,
        debug: {
          hasApiKey: !!process.env.RESEND_API_KEY,
          configuredFrom: process.env.EMAIL_FROM,
          actualFrom: successResult.usedFrom,
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to send test email with any from address',
        lastError,
        debug: {
          hasApiKey: !!process.env.RESEND_API_KEY,
          configuredFrom: process.env.EMAIL_FROM,
          triedAddresses: fromAddresses.filter(Boolean),
        }
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Test email endpoint error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message,
        debug: {
          hasApiKey: !!process.env.RESEND_API_KEY,
          configuredFrom: process.env.EMAIL_FROM,
        }
      },
      { status: 500 }
    );
  }
}