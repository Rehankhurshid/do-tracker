import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth';

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

    // Check if users already exist
    const { count: existingUsers, error: countErr } = await supabase
      .from('User')
      .select('*', { count: 'exact', head: true });
    if (countErr) {
      console.error('Seed count error:', countErr);
      return NextResponse.json({ error: 'Failed to check users' }, { status: 500 });
    }
    if ((existingUsers || 0) > 0) {
      return NextResponse.json({
        message: 'Database already has users',
        userCount: existingUsers
      });
    }

    // Hash the default password
    const hashedPassword = await hashPassword('admin123');

    // Create default users
    const { data: users, error: usersErr } = await supabase
      .from('User')
      .insert([
        {
          username: 'admin',
          password: hashedPassword,
          email: 'admin@example.com',
          role: 'ADMIN',
          isActive: true,
          isPasswordSet: true,
        },
        {
          username: 'area_office',
          password: hashedPassword,
          email: 'area@example.com',
          role: 'AREA_OFFICE',
          isActive: true,
          isPasswordSet: true,
        },
        {
          username: 'project_office',
          password: hashedPassword,
          email: 'project@example.com',
          role: 'PROJECT_OFFICE',
          isActive: true,
          isPasswordSet: true,
        },
        {
          username: 'road_sale',
          password: hashedPassword,
          email: 'road@example.com',
          role: 'ROAD_SALE',
          isActive: true,
          isPasswordSet: true,
        },
      ])
      .select('username, role, email');
    if (usersErr) {
      console.error('Seed users insert error:', usersErr);
      return NextResponse.json({ error: 'Failed to create users' }, { status: 500 });
    }

    // Create some sample parties
    const { data: parties, error: partiesErr } = await supabase
      .from('Party')
      .insert([
        {
          name: 'ABC Construction Ltd',
          contactPerson: 'John Doe',
          phone: '+1234567890',
          email: 'contact@abc-construction.com',
          address: '123 Construction Ave, Builder City, BC 12345',
        },
        {
          name: 'XYZ Builders Inc',
          contactPerson: 'Jane Smith',
          phone: '+0987654321',
          email: 'info@xyz-builders.com',
          address: '456 Builder Street, Construction Town, CT 67890',
        },
        {
          name: 'Global Infrastructure Corp',
          contactPerson: 'Robert Johnson',
          phone: '+1122334455',
          email: 'contact@global-infra.com',
          address: '789 Infrastructure Blvd, Metro City, MC 13579',
        },
      ])
      .select('id');
    if (partiesErr) {
      console.error('Seed parties insert error:', partiesErr);
      return NextResponse.json({ error: 'Failed to create parties' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      data: {
        usersCreated: (users || []).length,
        partiesCreated: (parties || []).length,
        users: (users || []).map(u => ({
          username: u.username,
          role: u.role,
          email: u.email
        })),
        defaultPassword: 'admin123'
      }
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Failed to seed database', details: message }, { status: 500 });
  }
}