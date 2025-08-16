import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

interface TestResult {
  name: string;
  success: boolean;
  userCount?: number;
  error?: string;
  url?: string;
}

interface Results {
  timestamp: string;
  environment: {
    NODE_ENV: string | undefined;
    DATABASE_URL_EXISTS: boolean;
    DATABASE_URL_LENGTH: number;
    DATABASE_URL_PREFIX: string;
  };
  tests: TestResult[];
}

export async function GET() {
  const results: Results = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
      DATABASE_URL_LENGTH: process.env.DATABASE_URL?.length || 0,
      DATABASE_URL_PREFIX: process.env.DATABASE_URL?.substring(0, 20) || 'not set',
    },
    tests: []
  };

  // Test 1: Current DATABASE_URL
  if (process.env.DATABASE_URL) {
    try {
      const prisma1 = new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_URL
          }
        }
      });
      const count = await prisma1.user.count();
      results.tests.push({
        name: 'Current DATABASE_URL',
        success: true,
        userCount: count
      });
      await prisma1.$disconnect();
    } catch (error) {
      results.tests.push({
        name: 'Current DATABASE_URL',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Test 2: Try with postgres:// protocol (pooler)
  const poolerUrl = 'postgres://postgres.zvszwrgquawnhitshifz:gz3E7EcJaP0aGXFp@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
  try {
    const prisma2 = new PrismaClient({
      datasources: {
        db: {
          url: poolerUrl
        }
      }
    });
    const count = await prisma2.user.count();
    results.tests.push({
      name: 'Pooler with postgres://',
      success: true,
      userCount: count,
      url: 'postgres://[hidden]@pooler.supabase.com:6543/postgres?pgbouncer=true'
    });
    await prisma2.$disconnect();
  } catch (error) {
    results.tests.push({
      name: 'Pooler with postgres://',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      url: 'postgres://[hidden]@pooler.supabase.com:6543/postgres?pgbouncer=true'
    });
  }

  // Test 3: Try with postgresql:// protocol (pooler)
  const poolerUrlPostgresql = 'postgresql://postgres.zvszwrgquawnhitshifz:gz3E7EcJaP0aGXFp@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
  try {
    const prisma3 = new PrismaClient({
      datasources: {
        db: {
          url: poolerUrlPostgresql
        }
      }
    });
    const count = await prisma3.user.count();
    results.tests.push({
      name: 'Pooler with postgresql://',
      success: true,
      userCount: count,
      url: 'postgresql://[hidden]@pooler.supabase.com:6543/postgres?pgbouncer=true'
    });
    await prisma3.$disconnect();
  } catch (error) {
    results.tests.push({
      name: 'Pooler with postgresql://',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      url: 'postgresql://[hidden]@pooler.supabase.com:6543/postgres?pgbouncer=true'
    });
  }

  // Test 4: Try direct connection
  const directUrl = 'postgresql://postgres:gz3E7EcJaP0aGXFp@db.zvszwrgquawnhitshifz.supabase.co:5432/postgres';
  try {
    const prisma4 = new PrismaClient({
      datasources: {
        db: {
          url: directUrl
        }
      }
    });
    const count = await prisma4.user.count();
    results.tests.push({
      name: 'Direct connection',
      success: true,
      userCount: count,
      url: 'postgresql://[hidden]@db.supabase.co:5432/postgres'
    });
    await prisma4.$disconnect();
  } catch (error) {
    results.tests.push({
      name: 'Direct connection',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      url: 'postgresql://[hidden]@db.supabase.co:5432/postgres'
    });
  }

  return NextResponse.json(results);
}
