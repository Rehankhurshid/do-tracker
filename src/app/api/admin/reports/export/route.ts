import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { format } from 'date-fns';

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

    // Get export type from query params
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'full';

    // Fetch all delivery orders with related data
    const deliveryOrders = await prisma.deliveryOrder.findMany({
      include: {
        party: true,
        issues: {
          include: {
            reportedBy: {
              select: { username: true },
            },
            resolvedBy: {
              select: { username: true },
            },
          },
        },
        createdBy: {
          select: { username: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Create CSV content based on type
    let csvContent = '';
    
    if (type === 'full' || type === 'orders') {
      // Orders report
      csvContent = 'DO Number,Party,Status,Created By,Created At,Valid From,Valid To,Issues Count,Open Issues\n';
      
      deliveryOrders.forEach(order => {
        const openIssues = order.issues.filter(i => i.status === 'OPEN').length;
        csvContent += `"${order.doNumber}","${order.party?.name || ''}","${order.status}","${order.createdBy?.username || ''}","${format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm')}","${format(new Date(order.validFrom), 'yyyy-MM-dd')}","${format(new Date(order.validTo), 'yyyy-MM-dd')}",${order.issues.length},${openIssues}\n`;
      });
    }

    if (type === 'full' || type === 'issues') {
      // Issues report
      if (type === 'issues') {
        csvContent = 'DO Number,Issue Type,Description,Status,Reported By,Reported At,Resolved By,Resolved At,Resolution\n';
      } else {
        csvContent += '\n\nISSUES REPORT\n';
        csvContent += 'DO Number,Issue Type,Description,Status,Reported By,Reported At,Resolved By,Resolved At,Resolution\n';
      }

      deliveryOrders.forEach(order => {
        order.issues.forEach(issue => {
          csvContent += `"${order.doNumber}","${issue.issueType || 'OTHER'}","${issue.description}","${issue.status}","${issue.reportedBy?.username || ''}","${format(new Date(issue.createdAt), 'yyyy-MM-dd HH:mm')}","${issue.resolvedBy?.username || ''}","${issue.resolvedAt ? format(new Date(issue.resolvedAt), 'yyyy-MM-dd HH:mm') : ''}","${issue.resolution || ''}"\n`;
        });
      });
    }

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="orderflow-report-${type}-${format(new Date(), 'yyyy-MM-dd')}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}