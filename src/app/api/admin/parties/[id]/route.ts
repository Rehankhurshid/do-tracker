import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// Update party
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, contactPerson, phone, email, address } = body;

    // Check if party exists
    const existingParty = await prisma.party.findUnique({
      where: { id }
    });

    if (!existingParty) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 });
    }

    // Update party
    const updatedParty = await prisma.party.update({
      where: { id },
      data: {
        name,
        contactPerson,
        phone,
        email,
        address
      }
    });

    return NextResponse.json(updatedParty);
  } catch (error) {
    console.error('Error updating party:', error);
    return NextResponse.json(
      { error: 'Failed to update party' },
      { status: 500 }
    );
  }
}

// Delete party
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Archive the party instead of deleting
    const party = await prisma.party.update({
      where: { id },
      data: { 
        isArchived: true,
        archivedAt: new Date()
      }
    });

    return NextResponse.json({ 
      message: 'Party archived successfully',
      party
    });
  } catch (error) {
    console.error('Error archiving party:', error);
    return NextResponse.json(
      { error: 'Failed to archive party' },
      { status: 500 }
    );
  }
}

// Restore archived party
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    if (action !== 'restore') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Restore the party
    const party = await prisma.party.update({
      where: { id },
      data: { 
        isArchived: false,
        archivedAt: null
      }
    });

    return NextResponse.json({ 
      message: 'Party restored successfully',
      party
    });
  } catch (error) {
    console.error('Error restoring party:', error);
    return NextResponse.json(
      { error: 'Failed to restore party' },
      { status: 500 }
    );
  }
}