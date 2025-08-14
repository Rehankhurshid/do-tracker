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

    // Check if party has associated delivery orders
    const doCount = await prisma.deliveryOrder.count({
      where: { partyId: id }
    });

    if (doCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete party. ${doCount} delivery order(s) are associated with this party.` },
        { status: 400 }
      );
    }

    // Delete party
    await prisma.party.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Party deleted successfully' });
  } catch (error) {
    console.error('Error deleting party:', error);
    return NextResponse.json(
      { error: 'Failed to delete party' },
      { status: 500 }
    );
  }
}