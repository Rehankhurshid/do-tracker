import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Check if running in production - require a secret key
    const { secret } = await request.json();
    
    if (process.env.NODE_ENV === 'production' && secret !== process.env.JWT_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all users first
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        isPasswordSet: true,
      },
    });

    // Reactivate all deactivated users
    const reactivatedUsers = await prisma.user.updateMany({
      where: { isActive: false },
      data: { isActive: true },
    });

    // Get updated users
    const updatedUsers = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        isPasswordSet: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User status fixed',
      beforeFix: allUsers,
      reactivatedCount: reactivatedUsers.count,
      afterFix: updatedUsers,
    });

  } catch (error: any) {
    console.error('Fix users error:', error);
    return NextResponse.json(
      { error: 'Failed to fix users', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if running in production - require a secret key in query params
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    
    if (process.env.NODE_ENV === 'production' && secret !== process.env.JWT_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all users
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
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      success: true,
      totalUsers: users.length,
      activeUsers: users.filter(u => u.isActive).length,
      inactiveUsers: users.filter(u => !u.isActive).length,
      users,
    });

  } catch (error: any) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Failed to get users', details: error.message },
      { status: 500 }
    );
  }
}