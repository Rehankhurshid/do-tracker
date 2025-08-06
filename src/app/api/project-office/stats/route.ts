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

    if (!decoded || decoded.role !== 'PROJECT_OFFICE') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Fetch Project Office specific statistics
    const deliveryOrders = await prisma.deliveryOrder.findMany({
      where: {
        status: {
          in: ['at_project_office', 'received_at_project_office', 'at_road_sale']
        }
      },
      include: {
        issues: {
          where: { status: 'OPEN' }
        }
      }
    });

    const pendingReceive = deliveryOrders.filter(
      do_ => do_.status === 'at_project_office'
    ).length;
    
    const received = deliveryOrders.filter(
      do_ => do_.status === 'received_at_project_office'
    ).length;
    
    const forwarded = deliveryOrders.filter(
      do_ => do_.status === 'at_road_sale'
    ).length;
    
    const withIssues = deliveryOrders.filter(
      do_ => do_.status === 'received_at_project_office' && do_.issues.length > 0
    ).length;

    return NextResponse.json({
      pendingReceive,
      received,
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