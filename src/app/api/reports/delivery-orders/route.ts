import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const partyId = searchParams.get('partyId');

    // Build where clause based on user role and filters
    const whereClause: any = {};

    // Role-based filtering
    if (payload.role === 'AREA_OFFICE') {
      whereClause.createdById = payload.userId;
    } else if (payload.role === 'PROJECT_OFFICE') {
      whereClause.status = {
        in: ['at_project_office', 'received_at_project_office', 'at_road_sale']
      };
    }

    // Date range filter
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate + 'T23:59:59.999Z')
      };
    }

    // Status filter
    if (status && status !== 'all') {
      whereClause.status = status;
    }

    // Party filter
    if (partyId && partyId !== 'all') {
      whereClause.partyId = partyId;
    }

    // Fetch delivery orders with all related data
    const deliveryOrders = await prisma.deliveryOrder.findMany({
      where: whereClause,
      include: {
        party: true,
        createdBy: {
          select: {
            username: true,
            email: true,
          }
        },
        issues: {
          include: {
            reportedBy: {
              select: {
                username: true,
              }
            },
            resolvedBy: {
              select: {
                username: true,
              }
            }
          }
        },
        workflowHistory: {
          include: {
            actionBy: {
              select: {
                username: true,
              }
            }
          },
          orderBy: {
            timestamp: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate statistics
    const stats = {
      total: deliveryOrders.length,
      byStatus: {
        created: deliveryOrders.filter(d => d.status === 'created').length,
        at_area_office: deliveryOrders.filter(d => d.status === 'at_area_office').length,
        at_project_office: deliveryOrders.filter(d => d.status === 'at_project_office').length,
        received_at_project_office: deliveryOrders.filter(d => d.status === 'received_at_project_office').length,
        at_road_sale: deliveryOrders.filter(d => d.status === 'at_road_sale').length,
      },
      withIssues: deliveryOrders.filter(d => d.issues.length > 0).length,
      resolvedIssues: deliveryOrders.filter(d => 
        d.issues.length > 0 && d.issues.every(i => i.status === 'RESOLVED')
      ).length,
      pendingIssues: deliveryOrders.filter(d => 
        d.issues.some(i => i.status === 'OPEN')
      ).length,
      avgProcessingTime: calculateAvgProcessingTime(deliveryOrders),
      topParties: getTopParties(deliveryOrders),
    };

    return NextResponse.json({
      deliveryOrders,
      stats,
      filters: {
        startDate,
        endDate,
        status,
        partyId,
      }
    });
  } catch (error) {
    console.error('Error fetching report data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report data' },
      { status: 500 }
    );
  }
}

function calculateAvgProcessingTime(orders: any[]): number {
  const completedOrders = orders.filter(o => o.status === 'at_road_sale');
  if (completedOrders.length === 0) return 0;

  const totalTime = completedOrders.reduce((sum, order) => {
    const created = new Date(order.createdAt).getTime();
    const completed = order.workflowHistory.find((h: any) => h.toStatus === 'at_road_sale');
    if (completed) {
      const completedTime = new Date(completed.timestamp).getTime();
      return sum + (completedTime - created);
    }
    return sum;
  }, 0);

  return Math.round(totalTime / completedOrders.length / (1000 * 60 * 60)); // Return in hours
}

function getTopParties(orders: any[]): any[] {
  const partyCount: { [key: string]: { name: string; count: number } } = {};
  
  orders.forEach(order => {
    if (order.party) {
      if (!partyCount[order.party.id]) {
        partyCount[order.party.id] = {
          name: order.party.name,
          count: 0
        };
      }
      partyCount[order.party.id].count++;
    }
  });

  return Object.values(partyCount)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}