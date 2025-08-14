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

    // Fetch Area Office specific statistics - Department-wide visibility
    // Get all DOs currently at Area Office stage
    const deliveryOrdersAtStage = await prisma.deliveryOrder.findMany({
      where: {
        status: {
          in: ['created', 'at_area_office']
        }
      },
      include: {
        issues: {
          where: { status: 'OPEN' }
        }
      }
    });

    // Get total count of all DOs ever created
    const totalCreated = await prisma.deliveryOrder.count();

    // Get count of forwarded DOs (beyond Area Office stage)
    const forwarded = await prisma.deliveryOrder.count({
      where: {
        status: {
          notIn: ['created', 'at_area_office']
        }
      }
    });

    // Pending forward are those currently at Area Office stage
    const pendingForward = deliveryOrdersAtStage.length;

    // Count DOs with open issues at Area Office stage
    const withIssues = deliveryOrdersAtStage.filter(
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