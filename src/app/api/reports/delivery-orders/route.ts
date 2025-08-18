import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
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

    // Build Supabase query with role/date/status/party filters
    let query = supabase
      .from('DeliveryOrder')
      .select(`
        *,
        party:Party(*),
        createdBy:User!createdById (username, email),
        issues:Issue (*,
          reportedBy:User!reportedById (username),
          resolvedBy:User!resolvedById (username)
        ),
        workflowHistory:WorkflowHistory (*,
          actionBy:User!actionById (username)
        )
      `)
      .order('createdAt', { ascending: false });

    // Role-based filtering - Department-wide visibility
    if (payload.role === 'AREA_OFFICE') {
      query = query.in('status', ['created', 'at_area_office']);
    } else if (payload.role === 'PROJECT_OFFICE') {
      query = query.in('status', ['at_project_office', 'received_at_project_office', 'at_road_sale']);
    } else if (payload.role === 'CISF') {
      // At stage or already approved by CISF
      query = query.or('status.in.(at_project_office,received_at_project_office),cisfApproved.eq.true');
    } else if (payload.role === 'ROAD_SALE') {
      query = query.eq('status', 'at_road_sale');
    }

    // Date range filter
    if (startDate && endDate) {
      const startIso = new Date(startDate).toISOString();
      const endIso = new Date(endDate + 'T23:59:59.999Z').toISOString();
      query = query.gte('createdAt', startIso).lte('createdAt', endIso);
    }

    // Status filter overrides role-based status when provided
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Party filter
    if (partyId && partyId !== 'all') {
      query = query.eq('partyId', partyId);
    }

    const { data: deliveryOrders, error } = await query;
    if (error) {
      console.error('Supabase reports query error:', error);
      return NextResponse.json({ error: 'Failed to fetch report data' }, { status: 500 });
    }

    // Narrow types for stats calculation
    type IssueLite = { status: 'OPEN' | 'RESOLVED' };
    type PartyLite = { id: string; name: string };
    type WorkflowLite = { toStatus: string; createdAt?: string; timestamp?: string };
    type OrderLite = {
      status: string;
      createdAt: string;
      issues: IssueLite[];
      party?: PartyLite | null;
      workflowHistory: WorkflowLite[];
    };
    const orders = (deliveryOrders || []) as unknown as OrderLite[];

    // Calculate statistics
    const stats = {
      total: orders.length,
      byStatus: {
        created: orders.filter(d => d.status === 'created').length,
        at_area_office: orders.filter(d => d.status === 'at_area_office').length,
        at_project_office: orders.filter(d => d.status === 'at_project_office').length,
        received_at_project_office: orders.filter(d => d.status === 'received_at_project_office').length,
        at_road_sale: orders.filter(d => d.status === 'at_road_sale').length,
      },
      withIssues: orders.filter(d => d.issues && d.issues.length > 0).length,
      resolvedIssues: orders.filter(d => 
        d.issues && d.issues.length > 0 && d.issues.every((i: IssueLite) => i.status === 'RESOLVED')
      ).length,
      pendingIssues: orders.filter(d => 
        (d.issues || []).some((i: IssueLite) => i.status === 'OPEN')
      ).length,
      avgProcessingTime: calculateAvgProcessingTime(orders),
      topParties: getTopParties(orders),
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

function calculateAvgProcessingTime(orders: { status: string; createdAt: string; workflowHistory: { toStatus: string; createdAt?: string; timestamp?: string }[] }[]): number {
  const completedOrders = orders.filter(o => o.status === 'at_road_sale');
  if (completedOrders.length === 0) return 0;

  const totalTime = completedOrders.reduce((sum, order) => {
    const created = new Date(order.createdAt).getTime();
  // Prefer createdAt for workflow history entries (consistent with other routes)
  const completed = order.workflowHistory.find((h) => h.toStatus === 'at_road_sale');
    if (completed) {
      const completedIso = completed.createdAt ?? completed.timestamp ?? order.createdAt;
      const completedTime = new Date(completedIso).getTime();
      return sum + (completedTime - created);
    }
    return sum;
  }, 0);

  return Math.round(totalTime / completedOrders.length / (1000 * 60 * 60)); // Return in hours
}

function getTopParties(orders: { party?: { id: string; name: string } | null }[]): { name: string; count: number }[] {
  const partyCount: Record<string, { name: string; count: number }> = {};
  
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