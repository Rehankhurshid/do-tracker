import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get the delivery order
    const deliveryOrder = await prisma.deliveryOrder.findUnique({
      where: { id },
      include: {
        issues: true,
        workflowHistory: true,
      }
    });

    if (!deliveryOrder) {
      return NextResponse.json({ error: 'Delivery order not found' }, { status: 404 });
    }

    // Check permissions: Only Area Office or Admin can delete
    if (payload.role !== 'AREA_OFFICE' && payload.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only Area Office can delete delivery orders' },
        { status: 403 }
      );
    }

    // Check if DO is still at Area Office stage (not forwarded)
    // Any Area Office user can delete DOs at their stage
    if (deliveryOrder.status !== 'at_area_office' && deliveryOrder.status !== 'created') {
      return NextResponse.json(
        { error: 'Cannot delete delivery order that has been forwarded' },
        { status: 400 }
      );
    }

    // Check if there are any issues or workflow history (beyond creation)
    const hasWorkflowHistory = deliveryOrder.workflowHistory.length > 1; // More than just creation entry
    if (hasWorkflowHistory) {
      return NextResponse.json(
        { error: 'Cannot delete delivery order with workflow history' },
        { status: 400 }
      );
    }

    // Delete related records first (issues if any)
    if (deliveryOrder.issues.length > 0) {
      await prisma.issue.deleteMany({
        where: { deliveryOrderId: id }
      });
    }

    // Delete workflow history
    await prisma.workflowHistory.deleteMany({
      where: { deliveryOrderId: id }
    });

    // Delete the delivery order
    const deletedOrder = await prisma.deliveryOrder.delete({
      where: { id }
    });

    // Log the deletion
    console.log(`Delivery Order deleted:`, {
      doId: id,
      doNumber: deletedOrder.doNumber,
      deletedBy: payload.username,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      message: 'Delivery order deleted successfully',
      deletedOrder: {
        id: deletedOrder.id,
        doNumber: deletedOrder.doNumber,
      }
    });
  } catch (error) {
    console.error('Error deleting delivery order:', error);
    return NextResponse.json(
      { error: 'Failed to delete delivery order' },
      { status: 500 }
    );
  }
}