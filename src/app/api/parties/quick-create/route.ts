import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Only Area Office and Admin can create parties quickly
    if (payload.role !== 'AREA_OFFICE' && payload.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only Area Office and Admin can create parties' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Party name is required' },
        { status: 400 }
      );
    }

    // Check if party already exists
    const existingParty = await prisma.party.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive'
        }
      }
    });

    if (existingParty) {
      return NextResponse.json(
        { error: 'Party with this name already exists', party: existingParty },
        { status: 409 }
      );
    }

    // Create the party with minimal details
    const party = await prisma.party.create({
      data: {
        name: name.trim(),
        email: '', // Can be updated later
        phone: '', // Can be updated later
        address: '', // Can be updated later
        contactPerson: '', // Can be updated later
      },
    });

    console.log(`Quick party created:`, {
      partyId: party.id,
      name: party.name,
      createdBy: payload.username,
    });

    return NextResponse.json({
      success: true,
      party,
      message: 'Party created successfully. You can add more details later.',
    });
  } catch (error) {
    console.error('Error creating party:', error);
    return NextResponse.json(
      { error: 'Failed to create party' },
      { status: 500 }
    );
  }
}