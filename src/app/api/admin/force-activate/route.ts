import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // This is an emergency endpoint - only use with the secret
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    const username = searchParams.get('username') || 'admin';
    
    // Debug: Check what we're comparing
    console.log('Received secret:', secret);
    console.log('Expected secret exists:', !!process.env.JWT_SECRET);
    console.log('Secrets match:', secret === process.env.JWT_SECRET);
    
    if (secret !== process.env.JWT_SECRET) {
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          debug: {
            receivedSecret: secret ? `${secret.substring(0, 5)}...` : 'none',
            hasJwtSecret: !!process.env.JWT_SECRET,
            nodeEnv: process.env.NODE_ENV
          }
        },
        { status: 401 }
      );
    }

    // First try to update existing user
    const { data: existingUser, error: updateError } = await supabase
      .from('User')
      .update({ 
        isActive: true,
        isPasswordSet: true 
      })
      .eq('username', username)
      .select()
      .single();

    let user;
    
    if (updateError && updateError.code === 'PGRST116') {
      // User doesn't exist, create new one
      const { data: newUser, error: createError } = await supabase
        .from('User')
        .insert({
          username,
          password: '$2a$12$KIGhpe3beG.wF7l3lPfPAOkc5aNdpX0r7Bd5ZL7k3QY1FGYpOsNzK', // hashed 'admin123'
          email: `${username}@example.com`,
          role: username === 'admin' ? 'ADMIN' : 'AREA_OFFICE',
          isActive: true,
          isPasswordSet: true,
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create user: ${createError.message}`);
      }
      
      user = newUser;
    } else if (updateError) {
      throw new Error(`Failed to update user: ${updateError.message}`);
    } else {
      user = existingUser;
    }

    // Also ensure other default users are active
    if (username === 'admin') {
      const { error: updateManyError } = await supabase
        .from('User')
        .update({ isActive: true })
        .in('username', ['area_office', 'project_office', 'road_sale']);
      
      if (updateManyError) {
        console.error('Failed to activate other users:', updateManyError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `User ${username} is now active`,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isPasswordSet: user.isPasswordSet,
      },
    });

  } catch (error) {
    console.error('Force activate error:', error);
    return NextResponse.json(
      { error: 'Failed to activate user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
