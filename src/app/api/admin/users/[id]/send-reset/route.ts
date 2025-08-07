import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail, generatePasswordResetEmail } from '@/lib/email';
import { verifyToken } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const user = verifyToken(token);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Find the user to send reset email to
    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!targetUser.email) {
      return NextResponse.json(
        { error: 'User does not have an email address' },
        { status: 400 }
      );
    }

    // Generate reset token
    const resetToken = Buffer.from(Math.random().toString()).toString('base64').substring(0, 32);
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with reset token
    await prisma.user.update({
      where: { id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // Generate reset link
    const resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    // Send password reset email
    const emailHtml = generatePasswordResetEmail(resetLink, targetUser.username);
    const emailResult = await sendEmail({
      to: targetUser.email,
      subject: targetUser.isPasswordSet 
        ? 'Password Reset Request - DO Tracker'
        : 'Welcome to DO Tracker - Set Your Password',
      html: emailHtml,
    });

    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
      return NextResponse.json(
        { error: 'Failed to send email. Please check email configuration.' },
        { status: 500 }
      );
    }

    // Log admin action
    console.log(`Admin ${user.username} sent password reset to user ${targetUser.username}`);

    return NextResponse.json({
      success: true,
      message: targetUser.isPasswordSet 
        ? 'Password reset email sent successfully'
        : 'Welcome email with password setup link sent successfully',
    });
  } catch (error) {
    console.error('Send reset error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}