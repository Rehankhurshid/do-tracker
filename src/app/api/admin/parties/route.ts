import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get query parameter to include archived parties
    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get('includeArchived') === 'true';

    const parties = await prisma.party.findMany({
      where: includeArchived ? {} : { isArchived: false },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            deliveryOrders: true
          }
        }
      }
    });

    return NextResponse.json(parties);
  } catch (error) {
    console.error('Get parties error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, contactPerson, phone, email, address } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Party name is required' },
        { status: 400 }
      );
    }

    // Check if party name already exists
    const existingParty = await prisma.party.findUnique({
      where: { name },
    });

    if (existingParty) {
      return NextResponse.json(
        { error: 'Party name already exists' },
        { status: 400 }
      );
    }

    // Create party
    const party = await prisma.party.create({
      data: {
        name,
        contactPerson: contactPerson || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
      },
    });

    return NextResponse.json(party);
  } catch (error) {
    console.error('Create party error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}