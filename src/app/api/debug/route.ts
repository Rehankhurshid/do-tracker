import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Check if environment variables are set
    const envCheck = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      JWT_SECRET: !!process.env.JWT_SECRET,
      NODE_ENV: process.env.NODE_ENV,
    };

    // Try to connect to database and count users
    let dbStatus = 'not connected';
    let userCount = 0;
    
    try {
      userCount = await prisma.user.count();
      dbStatus = 'connected';
    } catch (error: any) {
      dbStatus = `error: ${error.message}`;
    }

    return NextResponse.json({
      environment: envCheck,
      database: {
        status: dbStatus,
        userCount: userCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        error: 'Debug endpoint error',
        message: error.message,
      },
      { status: 500 }
    );
  }
}