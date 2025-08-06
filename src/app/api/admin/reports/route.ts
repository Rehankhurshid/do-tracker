import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/db';
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

    let dateFilter = {};
    const now = new Date();

    switch (range) {
      case '7days':
        dateFilter = { gte: subDays(now, 7) };
        break;
      case '30days':
        dateFilter = { gte: subDays(now, 30) };
        break;
      case '3months':
        dateFilter = { gte: subMonths(now, 3) };
        break;
      // 'all' has no date filter
    }

    // Fetch all delivery orders with issues
    const deliveryOrders = await prisma.deliveryOrder.findMany({
      where: dateFilter.gte ? { createdAt: dateFilter } : {},
      include: {
        issues: true,
        party: true,
        createdBy: {
          select: {
            username: true,
            role: true,
          },
        },
      },
    });

    // Fetch all issues
    const issues = await prisma.issue.findMany({
      where: dateFilter.gte ? { createdAt: dateFilter } : {},
      include: {
        reportedBy: {
          select: { username: true },
        },
        resolvedBy: {
          select: { username: true },
        },
      },
    });

    // Calculate statistics
    const totalOrders = deliveryOrders.length;
    const completedOrders = deliveryOrders.filter(o => o.status === 'at_road_sale').length;
    const pendingOrders = deliveryOrders.filter(o => o.status !== 'at_road_sale').length;

    const totalIssues = issues.length;
    const resolvedIssues = issues.filter(i => i.status === 'RESOLVED').length;
    const openIssues = issues.filter(i => i.status === 'OPEN').length;

    // Calculate average processing time (in hours)
    const completedOrdersWithTime = deliveryOrders.filter(o => o.status === 'at_road_sale');
    const avgProcessingTime = completedOrdersWithTime.length > 0
      ? completedOrdersWithTime.reduce((acc, order) => {
          const createdAt = new Date(order.createdAt).getTime();
          const now = new Date().getTime();
          return acc + (now - createdAt) / (1000 * 60 * 60); // Convert to hours
        }, 0) / completedOrdersWithTime.length
      : 0;

    // Group orders by status
    const ordersByStatus = deliveryOrders.reduce((acc: Record<string, number>, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    // Group orders by office (based on creator role)
    const ordersByOffice = deliveryOrders.reduce((acc: Record<string, number>, order) => {
      const office = order.createdBy?.role || 'Unknown';
      acc[office] = (acc[office] || 0) + 1;
      return acc;
    }, {});

    // Group issues by type
    const issuesByType = issues.reduce((acc: Record<string, number>, issue) => {
      const type = issue.issueType || 'OTHER';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // Get recent activity (last 10 workflow entries)
    const recentWorkflow = await prisma.workflowHistory.findMany({
      where: dateFilter.gte ? { timestamp: dateFilter } : {},
      orderBy: { timestamp: 'desc' },
      take: 10,
      include: {
        actionBy: {
          select: { username: true },
        },
        deliveryOrder: {
          select: { doNumber: true },
        },
      },
    });

    const recentActivity = recentWorkflow.map(w => ({
      timestamp: w.timestamp,
      type: 'Workflow',
      description: `DO #${w.deliveryOrder.doNumber}: ${w.fromStatus} → ${w.toStatus}`,
      user: w.actionBy?.username || 'System',
    }));

    // Calculate performance metrics by office
    const performanceMetrics = {
      areaOffice: {
        total: deliveryOrders.filter(o => o.createdBy?.role === 'AREA_OFFICE').length,
        avgTime: 0, // Placeholder - would need more complex calculation
      },
      projectOffice: {
        total: deliveryOrders.filter(o => 
          o.status === 'at_project_office' || 
          o.status === 'received_at_project_office' || 
          o.status === 'at_road_sale'
        ).length,
        avgTime: 0,
      },
      roadSale: {
        total: deliveryOrders.filter(o => o.status === 'at_road_sale').length,
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