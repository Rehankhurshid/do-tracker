import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const { data: user, error: findError } = await supabase
      .from('User')
      .select('id, username, email, isPasswordSet')
      .eq('resetToken', token)
      .gt('resetTokenExpiry', new Date().toISOString())
      .single();

    if (findError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      valid: true,
      user: {
        username: user.username,
        isPasswordSet: user.isPasswordSet,
      }
    });
  } catch (error) {
    console.error('Validate token error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
