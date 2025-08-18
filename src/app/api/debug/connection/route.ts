import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface TestResult {
  name: string;
  success: boolean;
  userCount?: number;
  error?: string;
  detail?: string;
}

interface Results {
  timestamp: string;
  environment: {
    NODE_ENV: string | undefined;
    NEXT_PUBLIC_SUPABASE_URL_SET: boolean;
    NEXT_PUBLIC_SUPABASE_ANON_KEY_SET: boolean;
    SUPABASE_URL_PREFIX: string;
  };
  tests: TestResult[];
}

export async function GET() {
  const results: Results = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_SUPABASE_URL_SET: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY_SET: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_URL_PREFIX: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 25) || 'not set',
    },
    tests: []
  };
  // Test 1: Supabase connectivity via count head
  try {
    const { count, error } = await supabase
      .from('User')
      .select('*', { count: 'exact', head: true });
    if (error) throw error;
    results.tests.push({ name: 'Supabase count head', success: true, userCount: count || 0 });
  } catch (error) {
    results.tests.push({ name: 'Supabase count head', success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }

  // Test 2: Supabase select single with no match handling
  try {
  const { error } = await supabase
      .from('User')
      .select('id')
      .eq('id', '00000000-0000-0000-0000-000000000000')
      .single();
  if (error && (error as unknown as { code?: string }).code !== 'PGRST116') throw error;
    results.tests.push({ name: 'Supabase single not-found', success: true });
  } catch (error) {
    results.tests.push({ name: 'Supabase single not-found', success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }

  // Test 3: Verify environment variables sanitized
  results.tests.push({
    name: 'Env vars present',
    success: !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    detail: `URL set: ${!!process.env.NEXT_PUBLIC_SUPABASE_URL}, KEY set: ${!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
  });

  return NextResponse.json(results);
}
