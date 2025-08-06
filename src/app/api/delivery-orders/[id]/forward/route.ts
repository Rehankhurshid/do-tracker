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

    const body = await request.json();
    const { toStatus } = body;

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
      return NextResponse.json({ error: 'Delivery order not found' }, { status: 404 });
    }

    // Check for unresolved issues
    if (deliveryOrder.issues.length > 0) {
      return NextResponse.json(
        { error: 'Cannot forward DO with unresolved issues' },
        { status: 400 }
      );
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      at_area_office: ['at_project_office'],
      at_project_office: ['received_at_project_office'],
      received_at_project_office: ['at_road_sale'],
    };

    if (!validTransitions[deliveryOrder.status]?.includes(toStatus)) {
      return NextResponse.json(
        { error: 'Invalid status transition' },
        { status: 400 }
      );
    }

    // Update delivery order status
    const updatedOrder = await prisma.deliveryOrder.update({
      where: { id },
      data: { status: toStatus },
      include: {
        party: true,
        issues: true,
      }
    });

    // Create workflow history entry
    await prisma.workflowHistory.create({
      data: {
        deliveryOrderId: id,
        fromStatus: deliveryOrder.status,
        toStatus: toStatus,
        actionById: payload.userId,
        notes: `Forwarded from ${deliveryOrder.status} to ${toStatus}`,
      }
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error forwarding delivery order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}