import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token.value);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const parties = await prisma.party.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(parties);
  } catch (error) {
    console.error('Error fetching parties:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token.value);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Only admin can create parties
    if (payload.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only administrators can create parties' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, contactPerson, phone, email, address } = body;

    // Check if party already exists
    const existingParty = await prisma.party.findUnique({
      where: { name }
    });

    if (existingParty) {
      return NextResponse.json(
        { error: 'Party with this name already exists' },
        { status: 400 }
      );
    }

    const party = await prisma.party.create({
      data: {
        name,
        contactPerson,
        phone,
        email,
        address,
      }
    });

    return NextResponse.json(party, { status: 201 });
  } catch (error) {
    console.error('Error creating party:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}