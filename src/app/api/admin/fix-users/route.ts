import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Check if running in production - require a secret key
    const { secret } = await request.json();
    
    if (process.env.NODE_ENV === 'production' && secret !== process.env.JWT_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all users first
    const { data: allUsers, error: getAllError } = await supabase
      .from('User')
      .select('id, username, email, role, isActive, isPasswordSet');

    if (getAllError) {
      throw new Error(`Failed to get users: ${getAllError.message}`);
    }

    // Reactivate all deactivated users
    const { data: reactivatedUsers, error: updateError } = await supabase
      .from('User')
      .update({ isActive: true })
      .eq('isActive', false)
      .select();

    if (updateError) {
      throw new Error(`Failed to reactivate users: ${updateError.message}`);
    }

    // Get updated users
    const { data: updatedUsers, error: getUpdatedError } = await supabase
      .from('User')
      .select('id, username, email, role, isActive, isPasswordSet');

    if (getUpdatedError) {
      throw new Error(`Failed to get updated users: ${getUpdatedError.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'User status fixed',
      beforeFix: allUsers || [],
      reactivatedCount: reactivatedUsers?.length || 0,
      afterFix: updatedUsers || [],
    });

  } catch (error) {
    console.error('Fix users error:', error);
    return NextResponse.json(
      { error: 'Failed to fix users', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if running in production - require a secret key in query params
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    
    if (process.env.NODE_ENV === 'production' && secret !== process.env.JWT_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all users
    const { data: users, error } = await supabase
      .from('User')
      .select('id, username, email, role, isActive, isPasswordSet, createdAt, updatedAt')
      .order('createdAt', { ascending: true });

    if (error) {
      throw new Error(`Failed to get users: ${error.message}`);
    }

    const usersList = users || [];

    return NextResponse.json({
      success: true,
      totalUsers: usersList.length,
      activeUsers: usersList.filter(u => u.isActive).length,
      inactiveUsers: usersList.filter(u => !u.isActive).length,
      users: usersList,
    });

  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Failed to get users', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
