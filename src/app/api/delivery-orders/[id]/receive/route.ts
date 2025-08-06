import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token.value);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Only Project Office can receive orders
    if (payload.role !== 'PROJECT_OFFICE' && payload.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only Project Office can receive delivery orders' },
        { status: 403 }
      );
    }

    // Get the delivery order
    const deliveryOrder = await prisma.deliveryOrder.findUnique({
      where: { id },
      include: {
        issues: {
          where: { status: 'OPEN' }
        }
      }
    });

    if (!deliveryOrder) {
      return NextResponse.json(
        { error: 'Delivery order not found' },
        { status: 404 }
      );
    }

    // Check if the order is at project office
    if (deliveryOrder.status !== 'at_project_office') {
      return NextResponse.json(
        { error: 'Delivery order is not available for receipt' },
        { status: 400 }
      );
    }

    // Update the delivery order status
    const updatedOrder = await prisma.deliveryOrder.update({
      where: { id },
      data: {
        status: 'received_at_project_office'
      },
      include: {
        party: true,
        createdBy: {
          select: {
            id: true,
            username: true,
            role: true
          }
        },
        issues: true
      }
    });

    // Create workflow history entry
    await prisma.workflowHistory.create({
      data: {
        deliveryOrderId: id,
        fromStatus: 'at_project_office',
        toStatus: 'received_at_project_office',
        actionById: payload.userId,
        notes: 'Received at Project Office'
      }
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error receiving delivery order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}