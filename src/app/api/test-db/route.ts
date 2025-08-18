import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Test database connection
    const { count, error } = await supabase
      .from('User')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      throw error;
    }
    
    // Get Supabase URL (hide sensitive parts)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'not set';
    const safeUrl = supabaseUrl !== 'not set' ? 
      supabaseUrl.replace(/^(https?:\/\/[^.]+).*/, '$1.****') : 
      'not set';
    
    return NextResponse.json({
      success: true,
      userCount: count || 0,
      supabaseUrl: safeUrl,
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'not set',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database test error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCode = error instanceof Error && 'code' in error ? (error as { code: string }).code : 'UNKNOWN';
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      errorCode,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'not set',
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'not set',
      environment: process.env.NODE_ENV
    }, { status: 500 });
  }
}
