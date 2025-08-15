import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Test database connection
    const userCount = await prisma.user.count();
    
    // Get database URL (hide password)
    const dbUrl = process.env.DATABASE_URL || 'not set';
    const urlParts = dbUrl.split('@');
    const safeUrl = urlParts.length > 1 ? 
      urlParts[0].split(':').slice(0, -1).join(':') + ':****@' + urlParts[1] : 
      'invalid format';
    
    return NextResponse.json({
      success: true,
      userCount,
      databaseUrl: safeUrl,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Database test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      errorCode: error.code,
      databaseUrl: process.env.DATABASE_URL ? 'set' : 'not set',
      directUrl: process.env.DIRECT_URL ? 'set' : 'not set',
      environment: process.env.NODE_ENV
    }, { status: 500 });
  }
}