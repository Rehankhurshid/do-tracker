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

    if (!decoded || decoded.role !== 'ROAD_SALE') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Fetch Road Sale specific statistics
    const deliveryOrders = await prisma.deliveryOrder.findMany({
      where: {
        status: 'AT_ROAD_SALE'
      },
      include: {
        issues: {
          where: { status: 'OPEN' }
        }
      }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalReceived = deliveryOrders.length;
    const receivedToday = deliveryOrders.filter(
      do_ => new Date(do_.updatedAt) >= today
    ).length;
    const withIssues = deliveryOrders.filter(
      do_ => do_.issues.length > 0
    ).length;
    const totalCompleted = totalReceived; // All at Road Sale are completed

    return NextResponse.json({
      totalReceived,
      receivedToday,
      withIssues,
      totalCompleted,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}