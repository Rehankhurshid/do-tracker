import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // This is an emergency endpoint - only use with the secret
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    const username = searchParams.get('username') || 'admin';
    
    // Debug: Check what we're comparing
    console.log('Received secret:', secret);
    console.log('Expected secret exists:', !!process.env.JWT_SECRET);
    console.log('Secrets match:', secret === process.env.JWT_SECRET);
    
    if (secret !== process.env.JWT_SECRET) {
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          debug: {
            receivedSecret: secret ? `${secret.substring(0, 5)}...` : 'none',
            hasJwtSecret: !!process.env.JWT_SECRET,
            nodeEnv: process.env.NODE_ENV
          }
        },
        { status: 401 }
      );
    }

    // Force update the admin user to be active
    const user = await prisma.user.upsert({
      where: { username },
      update: { 
        isActive: true,
        isPasswordSet: true 
      },
      create: {
        username,
        password: '$2a$12$KIGhpe3beG.wF7l3lPfPAOkc5aNdpX0r7Bd5ZL7k3QY1FGYpOsNzK', // hashed 'admin123'
        email: `${username}@example.com`,
        role: username === 'admin' ? 'ADMIN' : 'AREA_OFFICE',
        isActive: true,
        isPasswordSet: true,
      },
    });

    // Also ensure other default users are active
    if (username === 'admin') {
      await prisma.user.updateMany({
        where: { 
          username: { in: ['area_office', 'project_office', 'road_sale'] }
        },
        data: { isActive: true }
      });
    }

    return NextResponse.json({
      success: true,
      message: `User ${username} is now active`,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isPasswordSet: user.isPasswordSet,
      },
    });

  } catch (error: any) {
    console.error('Force activate error:', error);
    return NextResponse.json(
      { error: 'Failed to activate user', details: error.message },
      { status: 500 }
    );
  }
}