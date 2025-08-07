import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    
    const response: any = {
      hasToken: !!token,
      tokenLength: token?.length || 0,
      cookies: request.cookies.getAll().map(c => ({ name: c.name, hasValue: !!c.value })),
      env: {
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        nodeEnv: process.env.NODE_ENV,
      }
    };

    if (token) {
      try {
        const decoded = verifyToken(token);
        response.tokenValid = !!decoded;
        response.tokenData = decoded ? {
          userId: decoded.userId,
          username: decoded.username,
          role: decoded.role,
          exp: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : null,
        } : null;
      } catch (error) {
        response.tokenValid = false;
        response.tokenError = 'Failed to verify token';
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug endpoint error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}