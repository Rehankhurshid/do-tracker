import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

// Emergency endpoint - use with caution
export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    
    // Simple emergency code check
    if (code !== 'EMERGENCY-ACTIVATE-2024') {
      return NextResponse.json(
        { error: 'Invalid emergency code' },
        { status: 401 }
      );
    }

    // Hash the default password
    const hashedPassword = await hashPassword('admin123');

    // Force create/update admin user
    const adminUser = await prisma.user.upsert({
      where: { username: 'admin' },
      update: { 
        isActive: true,
        isPasswordSet: true,
        password: hashedPassword,
      },
      create: {
        username: 'admin',
        password: hashedPassword,
        email: 'admin@example.com',
        role: 'ADMIN',
        isActive: true,
        isPasswordSet: true,
      },
    });

    // Also reactivate all other users
    const reactivated = await prisma.user.updateMany({
      where: { isActive: false },
      data: { isActive: true },
    });

    // Get all users to verify
    const allUsers = await prisma.user.findMany({
      select: {
        username: true,
        email: true,
        role: true,
        isActive: true,
        isPasswordSet: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Emergency activation complete',
      adminUser: {
        username: adminUser.username,
        email: adminUser.email,
        role: adminUser.role,
        isActive: adminUser.isActive,
      },
      reactivatedCount: reactivated.count,
      allUsers,
      note: 'All users with password "admin123" are now active',
    });

  } catch (error: any) {
    console.error('Emergency activation error:', error);
    return NextResponse.json(
      { error: 'Emergency activation failed', details: error.message },
      { status: 500 }
    );
  }
}