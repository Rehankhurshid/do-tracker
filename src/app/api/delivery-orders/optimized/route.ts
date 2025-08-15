import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token.value);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const partyId = searchParams.get('partyId');
    const minimal = searchParams.get('minimal') === 'true'; // Add minimal flag

    // Build filter conditions based on user role
    const whereConditions: Record<string, any> = {};

    // Role-based filtering - Department-wide visibility
    switch (payload.role) {
      case 'AREA_OFFICE':
        // Area office can see all DOs at their stage AND those forwarded from their office
        whereConditions.OR = [
          {
            status: {
              in: ['created', 'at_area_office']
            }
          },
          {
            // Also show DOs that were forwarded (beyond Area Office stage)
            status: {
              in: ['at_project_office', 'received_at_project_office', 'at_road_sale']
            }
          }
        ];
        break;
      case 'PROJECT_OFFICE':
        // Project office can see all DOs at their stage and beyond
        whereConditions.status = {
          in: ['at_project_office', 'received_at_project_office', 'project_approved', 'cisf_approved', 'both_approved', 'at_road_sale']
        };
        break;
      case 'CISF':
        // CISF should see all orders at project office stage or beyond
        whereConditions.status = {
          in: ['at_project_office', 'received_at_project_office', 'project_approved', 'cisf_approved', 'both_approved', 'at_road_sale']
        };
        break;
      case 'ROAD_SALE':
        // Road Sale can see all DOs at their stage
        whereConditions.status = 'at_road_sale';
        break;
      // Admin can see all (no filter)
    }

    // Apply additional filters
    // Note: We skip status filter for roles with OR conditions to avoid breaking the logic
    if (status && !whereConditions.OR) {
      whereConditions.status = status;
    }
    if (partyId) {
      whereConditions.partyId = partyId;
    }

    // Optimized query - only include essential data initially
    if (minimal) {
      const deliveryOrders = await prisma.deliveryOrder.findMany({
        where: whereConditions,
        select: {
          id: true,
          doNumber: true,
          status: true,
          authorizedPerson: true,
          validFrom: true,
          validTo: true,
          projectApproved: true,
          cisfApproved: true,
          createdAt: true,
          party: {
            select: {
              id: true,
              name: true,
            }
          },
          // Only count issues, don't fetch all details
          _count: {
            select: {
              issues: {
                where: { status: 'OPEN' }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return NextResponse.json(deliveryOrders);
    }

    // Full query for detailed view
    const deliveryOrders = await prisma.deliveryOrder.findMany({
      where: whereConditions,
      include: {
        party: true,
        createdBy: {
          select: {
            id: true,
            username: true,
            role: true,
          }
        },
        issues: {
          include: {
            reportedBy: {
              select: {
                id: true,
                username: true,
              }
            }
          }
        },
        workflowHistory: {
          include: {
            actionBy: {
              select: {
                id: true,
                username: true,
                role: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5 // Limit history to last 5 entries
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(deliveryOrders);
  } catch (error) {
    console.error('Error fetching delivery orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}