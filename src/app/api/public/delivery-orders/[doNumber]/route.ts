import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { doNumber: string } }
) {
  try {
    const deliveryOrder = await prisma.deliveryOrder.findUnique({
      where: {
        doNumber: params.doNumber,
      },
      include: {
        party: {
          select: {
            id: true,
            name: true,
          },
        },
        issues: {
          select: {
            id: true,
            description: true,
            status: true,
            resolution: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        workflowHistory: {
          select: {
            id: true,
            fromStatus: true,
            toStatus: true,
            comments: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!deliveryOrder) {
      return NextResponse.json(
        { error: 'Delivery order not found' },
        { status: 404 }
      );
    }

    // Remove sensitive information
    const publicData = {
      id: deliveryOrder.id,
      doNumber: deliveryOrder.doNumber,
      party: deliveryOrder.party,
      authorizedPerson: deliveryOrder.authorizedPerson,
      validFrom: deliveryOrder.validFrom,
      validTo: deliveryOrder.validTo,
      status: deliveryOrder.status,
      notes: deliveryOrder.notes,
      createdAt: deliveryOrder.createdAt,
      issues: deliveryOrder.issues,
      workflowHistory: deliveryOrder.workflowHistory,
    };

    return NextResponse.json(publicData);
  } catch (error) {
    console.error('Get delivery order error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}