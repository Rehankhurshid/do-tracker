import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
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
    const existingUsers = await prisma.user.count();
    if (existingUsers > 0) {
      return NextResponse.json({
        message: 'Database already has users',
        userCount: existingUsers
      });
    }

    // Hash the default password
    const hashedPassword = await hashPassword('admin123');

    // Create default users
    const users = await prisma.$transaction([
      // Admin user
      prisma.user.create({
        data: {
          username: 'admin',
          password: hashedPassword,
          email: 'admin@example.com',
          role: 'ADMIN',
          isActive: true,
          isPasswordSet: true,
        },
      }),
      // Area Office user
      prisma.user.create({
        data: {
          username: 'area_office',
          password: hashedPassword,
          email: 'area@example.com',
          role: 'AREA_OFFICE',
          isActive: true,
          isPasswordSet: true,
        },
      }),
      // Project Office user
      prisma.user.create({
        data: {
          username: 'project_office',
          password: hashedPassword,
          email: 'project@example.com',
          role: 'PROJECT_OFFICE',
          isActive: true,
          isPasswordSet: true,
        },
      }),
      // Road Sale user
      prisma.user.create({
        data: {
          username: 'road_sale',
          password: hashedPassword,
          email: 'road@example.com',
          role: 'ROAD_SALE',
          isActive: true,
          isPasswordSet: true,
        },
      }),
    ]);

    // Create some sample parties
    const parties = await prisma.$transaction([
      prisma.party.create({
        data: {
          name: 'ABC Construction Ltd',
          contactPerson: 'John Doe',
          phone: '+1234567890',
          email: 'contact@abc-construction.com',
          address: '123 Construction Ave, Builder City, BC 12345',
        },
      }),
      prisma.party.create({
        data: {
          name: 'XYZ Builders Inc',
          contactPerson: 'Jane Smith',
          phone: '+0987654321',
          email: 'info@xyz-builders.com',
          address: '456 Builder Street, Construction Town, CT 67890',
        },
      }),
      prisma.party.create({
        data: {
          name: 'Global Infrastructure Corp',
          contactPerson: 'Robert Johnson',
          phone: '+1122334455',
          email: 'contact@global-infra.com',
          address: '789 Infrastructure Blvd, Metro City, MC 13579',
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      data: {
        usersCreated: users.length,
        partiesCreated: parties.length,
        users: users.map(u => ({
          username: u.username,
          role: u.role,
          email: u.email
        })),
        defaultPassword: 'admin123'
      }
    });

  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Failed to seed database', details: error.message },
      { status: 500 }
    );
  }
}