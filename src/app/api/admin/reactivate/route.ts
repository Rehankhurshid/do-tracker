import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Check if running in production - require a secret key
    const { username, secret } = await request.json();
    
    if (process.env.NODE_ENV === 'production' && secret !== process.env.JWT_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Find and reactivate the user
    const { data: user, error } = await supabase
      .from('User')
      .update({ isActive: true })
      .eq('username', username)
      .select('*')
      .single();

    if (error || !user) {
      if (error?.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      throw error || new Error('User not found');
    }

    return NextResponse.json({
      success: true,
      message: `User ${username} has been reactivated`,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });

  } catch (error) {
    console.error('Reactivate error:', error);
    
    return NextResponse.json(
      { error: 'Failed to reactivate user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
