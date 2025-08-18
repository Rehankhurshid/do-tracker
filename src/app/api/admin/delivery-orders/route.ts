import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

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

    // Get delivery orders with party and createdBy user data
    const { data: deliveryOrders, error } = await supabase
      .from('DeliveryOrder')
      .select(`
        *,
        party:Party!partyId(*),
        createdBy:User!createdBy(id, username, role)
      `)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch delivery orders' },
        { status: 500 }
      );
    }

    // Get issue counts for each delivery order
    const deliveryOrderIds = deliveryOrders?.map((deliveryOrder) => deliveryOrder.id) || [];
    
    if (deliveryOrderIds.length > 0) {
      const { data: issueCounts, error: issueError } = await supabase
        .from('Issue')
        .select('deliveryOrderId')
        .in('deliveryOrderId', deliveryOrderIds)
        .eq('status', 'OPEN');

      if (!issueError && issueCounts) {
        // Count issues per delivery order
        const issueCountMap = issueCounts.reduce((acc, issue) => {
          acc[issue.deliveryOrderId] = (acc[issue.deliveryOrderId] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Add _count property to match Prisma response format
        deliveryOrders?.forEach((deliveryOrder) => {
          const doWithCount = deliveryOrder as any;
          doWithCount._count = {
            issues: issueCountMap[deliveryOrder.id] || 0
          };
        });
      }
    } else {
      // No delivery orders, but still add _count for consistency
      deliveryOrders?.forEach((deliveryOrder) => {
        const doWithCount = deliveryOrder as any;
        doWithCount._count = {
          issues: 0
        };
      });
    }

    return NextResponse.json(deliveryOrders || []);
  } catch (error) {
    console.error('Get delivery orders error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
