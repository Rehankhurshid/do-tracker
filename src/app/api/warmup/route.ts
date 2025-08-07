import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Warmup endpoint to prevent cold starts
export async function GET(request: NextRequest) {
  try {
    // Simple database query to keep connection warm
    await prisma.$queryRaw`SELECT 1`;
    
    const response = NextResponse.json({ 
      status: 'warm',
      timestamp: new Date().toISOString() 
    });
    
    // Don't cache warmup endpoint
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    
    return response;
  } catch (error) {
    return NextResponse.json({ 
      status: 'error',
      timestamp: new Date().toISOString() 
    });
  }
}