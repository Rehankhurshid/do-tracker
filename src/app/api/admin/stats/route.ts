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

    // Fetch statistics
    const [
      totalUsers,
      totalDOs,
      totalParties,
      openIssues,
      deliveryOrders
    ] = await Promise.all([
      prisma.user.count(),
      prisma.deliveryOrder.count(),
      prisma.party.count(),
      prisma.issue.count({ where: { status: 'OPEN' } }),
      prisma.deliveryOrder.findMany({ select: { status: true } })
    ]);

    const inProgress = deliveryOrders.filter(
      do_ => !['CREATED', 'AT_ROAD_SALE'].includes(do_.status)
    ).length;

    const completed = deliveryOrders.filter(
      do_ => do_.status === 'AT_ROAD_SALE'
    ).length;

    return NextResponse.json({
      totalUsers,
      totalDOs,
      totalParties,
      openIssues,
      inProgress,
      completed,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}