import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function DELETE(request: NextRequest) {
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

    // Only Admin can clear DOs
    if (payload.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only administrators can clear delivery orders' },
        { status: 403 }
      );
    }

    // Delete in the correct order to respect foreign key constraints
    // 1. First delete workflow history
    const deletedHistory = await prisma.workflowHistory.deleteMany({});
    
    // 2. Then delete issues
    const deletedIssues = await prisma.issue.deleteMany({});
    
    // 3. Finally delete delivery orders
    const deletedOrders = await prisma.deliveryOrder.deleteMany({});

    return NextResponse.json({
      message: 'All delivery orders and related data have been cleared successfully',
      deleted: {
        deliveryOrders: deletedOrders.count,
        issues: deletedIssues.count,
        workflowHistory: deletedHistory.count,
      }
    });
  } catch (error) {
    console.error('Error clearing delivery orders:', error);
    return NextResponse.json(
      { error: 'Failed to clear delivery orders' },
      { status: 500 }
    );
  }
}