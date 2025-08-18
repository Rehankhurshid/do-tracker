import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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
      const { count, error } = await supabase
        .from('User')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      userCount = count || 0;
      dbStatus = 'connected';
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      dbStatus = `error: ${message}`;
    }

    return NextResponse.json({
      environment: envCheck,
      database: {
        status: dbStatus,
        userCount: userCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { 
        error: 'Debug endpoint error',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}