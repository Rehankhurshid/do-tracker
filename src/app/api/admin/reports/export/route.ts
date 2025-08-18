import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

type IssueRow = {
  status: string;
  issueType?: string;
  description: string;
  createdAt: string;
  resolvedAt?: string | null;
  resolution?: string | null;
  reportedBy?: { username?: string | null } | null;
  resolvedBy?: { username?: string | null } | null;
};

type OrderRow = {
  doNumber: string;
  party?: { name?: string | null } | null;
  status: string;
  createdAt: string;
  validFrom: string;
  validTo: string;
  issues: IssueRow[];
  createdBy?: { username?: string | null; role?: string | null } | null;
};

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'full';

    const { data, error } = await supabase
      .from('DeliveryOrder')
      .select(`
        *,
        party:Party(*),
        issues:Issue (*,
          reportedBy:User!reportedById (username),
          resolvedBy:User!resolvedById (username)
        ),
        createdBy:User!createdById (username, role)
      `)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Export fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }

    const orders = (data || []) as unknown as OrderRow[];

    let csvContent = '';

    if (type === 'full' || type === 'orders') {
      csvContent = 'DO Number,Party,Status,Created By,Created At,Valid From,Valid To,Issues Count,Open Issues\n';
      orders.forEach((order) => {
        const openIssues = (order.issues || []).filter((i: IssueRow) => i.status === 'OPEN').length;
        csvContent += `"${order.doNumber}","${order.party?.name || ''}","${order.status}","${order.createdBy?.username || ''}","${format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm')}","${format(new Date(order.validFrom), 'yyyy-MM-dd')}","${format(new Date(order.validTo), 'yyyy-MM-dd')}",${order.issues.length},${openIssues}\n`;
      });
    }

    if (type === 'full' || type === 'issues') {
      if (type === 'issues') {
        csvContent = 'DO Number,Issue Type,Description,Status,Reported By,Reported At,Resolved By,Resolved At,Resolution\n';
      } else {
        csvContent += '\n\nISSUES REPORT\n';
        csvContent += 'DO Number,Issue Type,Description,Status,Reported By,Reported At,Resolved By,Resolved At,Resolution\n';
      }
      orders.forEach((order) => {
        (order.issues || []).forEach((issue: IssueRow) => {
          csvContent += `"${order.doNumber}","${issue.issueType || 'OTHER'}","${issue.description}","${issue.status}","${issue.reportedBy?.username || ''}","${format(new Date(issue.createdAt), 'yyyy-MM-dd HH:mm')}","${issue.resolvedBy?.username || ''}","${issue.resolvedAt ? format(new Date(issue.resolvedAt), 'yyyy-MM-dd HH:mm') : ''}","${issue.resolution || ''}"\n`;
        });
      });
    }

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="orderflow-report-${type}-${format(new Date(), 'yyyy-MM-dd')}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}