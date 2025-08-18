import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

  const body = await request.json();
  const { email } = body as { email?: string };

    // Check if email is already taken by another user
    if (email) {
      const { data: existingUser, error: findError } = await supabase
        .from('User')
        .select('id')
        .eq('email', email)
        .neq('id', decoded.userId)
        .single();
      if (findError && findError.code !== 'PGRST116') {
        console.error('Error checking existing email:', findError);
        return NextResponse.json(
          { error: 'Database error' },
          { status: 500 }
        );
      }
      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        );
      }
    }

    // Update user profile
  const update: Partial<{ email: string; updatedAt: string }> = {
      updatedAt: new Date().toISOString(),
    };
    if (email) update.email = email;
    // if (fullName) update.fullName = fullName;

    const { data: updatedUser, error: updateError } = await supabase
      .from('User')
      .update(update)
      .eq('id', decoded.userId)
      .select('id, username, email, role, isActive, createdAt, updatedAt')
      .single();
    if (updateError) {
      console.error('Profile update DB error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}