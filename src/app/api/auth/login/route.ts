import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  console.log('Login attempt started');
  
  try {
    const body = await request.json();
    const { username, password } = body;

    console.log('Login attempt for username:', username);

    if (!username || !password) {
      console.log('Missing username or password');
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Find user by username
    console.log('Looking up user in database...');
    const user = await prisma.user.findUnique({
      where: { username },
    });

    console.log('User found:', user ? 'Yes' : 'No');
    console.log('User active:', user?.isActive);

    if (!user || !user.isActive) {
      console.log('User not found or inactive');
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if password is set
    console.log('Password set:', user.isPasswordSet);
    console.log('Has password:', !!user.password);
    
    if (!user.password || !user.isPasswordSet) {
      console.log('Password not set for user');
      return NextResponse.json(
        { error: 'Password not set. Please use the password reset link sent to your email.' },
        { status: 401 }
      );
    }

    // Verify password
    console.log('Verifying password...');
    const isValidPassword = await verifyPassword(password, user.password);
    console.log('Password valid:', isValidPassword);

    if (!isValidPassword) {
      console.log('Invalid password');
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken(user.id, user.username, user.role as any);

    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });

    // Set HTTP-only cookie with proper production settings
    const isProduction = process.env.NODE_ENV === 'production';
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax', // 'none' for production to work with HTTPS
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    
    console.log('Cookie set with settings:', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/'
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Check if it's a database connection error
    if (error.message?.includes('connect') || error.message?.includes('ECONNREFUSED')) {
      return NextResponse.json(
        { error: 'Database connection error. Please check server logs.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}