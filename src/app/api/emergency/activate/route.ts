import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth';

type AdminUser = {
  username: string;
  email: string | null;
  role: string;
  isActive: boolean;
};

// Emergency endpoint - use with caution
export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    
    // Simple emergency code check
    if (code !== 'EMERGENCY-ACTIVATE-2024') {
      return NextResponse.json(
        { error: 'Invalid emergency code' },
        { status: 401 }
      );
    }

    // Hash the default password
    const hashedPassword = await hashPassword('admin123');

    // Upsert-like logic for admin user with Supabase
    // 1) Try to update existing admin by username
    const { data: existingAdmins, error: findErr } = await supabase
      .from('User')
      .select('id, username')
      .eq('username', 'admin');

    if (findErr) {
      console.error('Find admin error:', findErr);
      return NextResponse.json({ error: 'Failed to query users' }, { status: 500 });
    }

  let adminUser: AdminUser | null = null;
    if (existingAdmins && existingAdmins.length > 0) {
      const { data: updated, error: updateErr } = await supabase
        .from('User')
        .update({
          isActive: true,
          isPasswordSet: true,
          password: hashedPassword,
          role: 'ADMIN',
          email: 'admin@example.com',
        })
        .eq('username', 'admin')
        .select('username, email, role, isActive')
        .single();
      if (updateErr) {
        console.error('Update admin error:', updateErr);
        return NextResponse.json({ error: 'Failed to update admin' }, { status: 500 });
      }
      adminUser = updated;
    } else {
      const { data: created, error: createErr } = await supabase
        .from('User')
        .insert({
          username: 'admin',
          password: hashedPassword,
          email: 'admin@example.com',
          role: 'ADMIN',
          isActive: true,
          isPasswordSet: true,
        })
        .select('username, email, role, isActive')
        .single();
      if (createErr) {
        console.error('Create admin error:', createErr);
        return NextResponse.json({ error: 'Failed to create admin' }, { status: 500 });
      }
      adminUser = created;
    }

    // Also reactivate all other users
    const { data: reactivatedUsers, error: reactivateErr } = await supabase
      .from('User')
      .update({ isActive: true })
      .eq('isActive', false)
      .select('id');
    if (reactivateErr) {
      console.error('Reactivate users error:', reactivateErr);
      return NextResponse.json({ error: 'Failed to reactivate users' }, { status: 500 });
    }

    // Get all users to verify
    const { data: allUsers, error: listErr } = await supabase
      .from('User')
      .select('username, email, role, isActive, isPasswordSet');
    if (listErr) {
      console.error('List users error:', listErr);
      return NextResponse.json({ error: 'Failed to list users' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Emergency activation complete',
      adminUser: {
        username: adminUser.username,
        email: adminUser.email,
        role: adminUser.role,
        isActive: adminUser.isActive,
      },
  reactivatedCount: (reactivatedUsers || []).length,
      allUsers,
      note: 'All users with password "admin123" are now active',
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Emergency activation error:', error);
    return NextResponse.json(
      { error: 'Emergency activation failed', details: message },
      { status: 500 }
    );
  }
}