import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { subDays, subMonths } from 'date-fns';

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

    // Get date range from query params
    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range') || '7days';

    let dateFilterStart: Date | undefined;
    const now = new Date();

    switch (range) {
      case '7days':
        dateFilterStart = subDays(now, 7);
        break;
      case '30days':
        dateFilterStart = subDays(now, 30);
        break;
      case '3months':
        dateFilterStart = subMonths(now, 3);
        break;
      // 'all' has no date filter
    }

    // Build delivery orders query
    let deliveryOrdersQuery = supabase
      .from('DeliveryOrder')
      .select(`
        *,
        party:Party!partyId(*),
        createdBy:User!createdBy(username, role)
      `);

    if (dateFilterStart) {
      deliveryOrdersQuery = deliveryOrdersQuery.gte('createdAt', dateFilterStart.toISOString());
    }

    const { data: deliveryOrders, error: doError } = await deliveryOrdersQuery;

    if (doError) {
      throw doError;
    }

    // Fetch issues separately for each delivery order
    const deliveryOrdersWithIssues = await Promise.all((deliveryOrders || []).map(async (order) => {
      const { data: issues } = await supabase
        .from('Issue')
        .select('*')
        .eq('deliveryOrderId', order.id);
      return { ...order, issues: issues || [] };
    }));

    // Build issues query
    let issuesQuery = supabase
      .from('Issue')
      .select(`
        *,
        reportedBy:User!reportedBy(username),
        resolvedBy:User!resolvedBy(username)
      `);

    if (dateFilterStart) {
      issuesQuery = issuesQuery.gte('createdAt', dateFilterStart.toISOString());
    }

    const { data: issues, error: issuesError } = await issuesQuery;

    if (issuesError) {
      throw issuesError;
    }

    // Calculate statistics
    const totalOrders = deliveryOrders?.length || 0;
    const completedOrders = deliveryOrders?.filter((o: any) => o.status === 'at_road_sale').length || 0;
    const pendingOrders = deliveryOrders?.filter((o: any) => o.status !== 'at_road_sale').length || 0;

    const totalIssues = issues?.length || 0;
    const resolvedIssues = issues?.filter((i: any) => i.status === 'RESOLVED').length || 0;
    const openIssues = issues?.filter((i: any) => i.status === 'OPEN').length || 0;

    // Calculate average processing time (in hours)
    const completedOrdersWithTime = deliveryOrders?.filter((o: any) => o.status === 'at_road_sale') || [];
    const avgProcessingTime = completedOrdersWithTime.length > 0
      ? completedOrdersWithTime.reduce((acc: number, order: any) => {
          const createdAt = new Date(order.createdAt).getTime();
          const now = new Date().getTime();
          return acc + (now - createdAt) / (1000 * 60 * 60); // Convert to hours
        }, 0) / completedOrdersWithTime.length
      : 0;

    // Group orders by status
    const ordersByStatus = (deliveryOrders || []).reduce((acc: Record<string, number>, order: any) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    // Group orders by office (based on creator role)
    const ordersByOffice = (deliveryOrders || []).reduce((acc: Record<string, number>, order: any) => {
      const office = order.createdBy?.role || 'Unknown';
      acc[office] = (acc[office] || 0) + 1;
      return acc;
    }, {});

    // Group issues by type
    const issuesByType = (issues || []).reduce((acc: Record<string, number>, issue: any) => {
      const type = issue.issueType || 'OTHER';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // Get recent activity (last 10 workflow entries)
    let workflowQuery = supabase
      .from('WorkflowHistory')
      .select(`
        *,
        actionBy:User!actionBy(username),
        deliveryOrder:DeliveryOrder!deliveryOrderId(doNumber)
      `)
      .order('timestamp', { ascending: false })
      .limit(10);

    if (dateFilterStart) {
      workflowQuery = workflowQuery.gte('timestamp', dateFilterStart.toISOString());
    }

    const { data: recentWorkflow, error: workflowError } = await workflowQuery;

    if (workflowError) {
      throw workflowError;
    }

    const recentActivity = (recentWorkflow || []).map((w: any) => ({
      timestamp: w.timestamp,
      type: 'Workflow',
      description: `DO #${w.deliveryOrder?.doNumber}: ${w.fromStatus} → ${w.toStatus}`,
      user: w.actionBy?.username || 'System',
    }));

    // Calculate performance metrics by office
    const performanceMetrics = {
      areaOffice: {
        total: deliveryOrders?.filter((o: any) => o.createdBy?.role === 'AREA_OFFICE').length || 0,
        avgTime: 0, // Placeholder - would need more complex calculation
      },
      projectOffice: {
        total: deliveryOrders?.filter((o: any) => 
          o.status === 'at_project_office' || 
          o.status === 'received_at_project_office' || 
          o.status === 'at_road_sale'
        ).length || 0,
        avgTime: 0,
      },
      roadSale: {
        total: deliveryOrders?.filter((o: any) => o.status === 'at_road_sale').length || 0,
        avgTime: 0,
      },
    };

    return NextResponse.json({
      totalOrders,
      completedOrders,
      pendingOrders,
      totalIssues,
      resolvedIssues,
      openIssues,
      avgProcessingTime,
      ordersByStatus,
      ordersByOffice,
      issuesByType,
      recentActivity,
      performanceMetrics,
    });
  } catch (error) {
    console.error('Reports error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
