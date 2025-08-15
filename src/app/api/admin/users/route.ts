import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { sendEmail, generatePasswordResetEmail } from '@/lib/email';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        isPasswordSet: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { username, email, password, role, sendInvite } = body;

    if (!username || !role) {
      return NextResponse.json(
        { error: 'Username and role are required' },
        { status: 400 }
      );
    }

    // Check if email is required for invitation
    if (sendInvite && !email) {
      return NextResponse.json(
        { error: 'Email is required when sending invitation' },
        { status: 400 }
      );
    }

    // Check if password is required for manual creation
    if (!sendInvite && !password) {
      return NextResponse.json(
        { error: 'Password is required when not sending invitation' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { 
          error: `Username "${username}" is already taken. Please choose a different username.`,
          field: 'username'
        },
        { status: 409 }
      );
    }
    
    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });
      
      if (existingEmail) {
        return NextResponse.json(
          { 
            error: `Email "${email}" is already registered to another user.`,
            field: 'email'
          },
          { status: 409 }
        );
      }
    }

    let userData: any = {
      username,
      email: email || null,
      role,
      isActive: true,
    };

    if (sendInvite) {
      // Generate reset token for email invitation
      const resetToken = Buffer.from(Math.random().toString()).toString('base64').substring(0, 32);
      const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      userData = {
        ...userData,
        password: null,
        resetToken,
        resetTokenExpiry,
        isPasswordSet: false,
      };

      // Send welcome email with password setup link
      const resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
      const emailHtml = generatePasswordResetEmail(resetLink, username);
      const emailResult = await sendEmail({
        to: email,
        subject: 'Welcome to DO Tracker - Set Your Password',
        html: emailHtml,
      });

      if (!emailResult.success) {
        console.error('Failed to send welcome email:', emailResult.error);
        // Still create the user even if email fails
      } else {
        console.log('Welcome email sent successfully to:', email);
      }
      
    } else {
      // Hash password for manual creation
      const hashedPassword = await hashPassword(password);
      userData = {
        ...userData,
        password: hashedPassword,
        isPasswordSet: true,
      };
    }

    // Create user
    const user = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        isPasswordSet: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      ...user,
      inviteSent: sendInvite,
      message: sendInvite 
        ? `Invitation sent to ${email}. User can set password using the link sent to their email.`
        : 'User created successfully with the provided password.',
    });
  } catch (error: any) {
    console.error('Create user error:', error);
    
    // Handle Prisma unique constraint errors
    if (error?.code === 'P2002') {
      const field = error?.meta?.target?.[0];
      if (field === 'username') {
        return NextResponse.json(
          { 
            error: 'Username is already taken',
            field: 'username'
          },
          { status: 409 }
        );
      } else if (field === 'email') {
        return NextResponse.json(
          { 
            error: 'Email is already registered',
            field: 'email'
          },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create user. Please try again.' },
      { status: 500 }
    );
  }
}