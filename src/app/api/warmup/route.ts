import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Warmup endpoint to prevent cold starts
export async function GET() {
  try {
    // Simple lightweight query to keep Supabase/PostgREST warm
    const { error } = await supabase
      .from('User')
      .select('*', { count: 'exact', head: true });
    if (error) throw error;
    
    const response = NextResponse.json({ 
      status: 'warm',
      timestamp: new Date().toISOString() 
    });
    
    // Don't cache warmup endpoint
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    
    return response;
  } catch {
    return NextResponse.json({ 
      status: 'error',
      timestamp: new Date().toISOString() 
    });
  }
}