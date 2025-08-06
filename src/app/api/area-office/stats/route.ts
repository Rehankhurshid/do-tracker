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

    if (!decoded || decoded.role !== 'AREA_OFFICE') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Fetch Area Office specific statistics
    const deliveryOrders = await prisma.deliveryOrder.findMany({
      where: { createdById: decoded.userId },
      include: {
        issues: {
          where: { status: 'OPEN' }
        }
      }
    });

    const totalCreated = deliveryOrders.length;
    const pendingForward = deliveryOrders.filter(
      do_ => do_.status === 'created' || do_.status === 'at_area_office'
    ).length;
    const forwarded = deliveryOrders.filter(
      do_ => !['created', 'at_area_office'].includes(do_.status)
    ).length;
    const withIssues = deliveryOrders.filter(
      do_ => do_.issues.length > 0
    ).length;

    return NextResponse.json({
      totalCreated,
      pendingForward,
      forwarded,
      withIssues,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}