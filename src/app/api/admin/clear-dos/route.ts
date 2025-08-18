import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
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
    const { error: historyError, count: historyCount } = await supabase
      .from('WorkflowHistory')
      .delete()
      .gte('id', 0); // This ensures all records are deleted
    
    if (historyError) {
      throw new Error(`Failed to delete workflow history: ${historyError.message}`);
    }
    
    // 2. Then delete issues
    const { error: issuesError, count: issuesCount } = await supabase
      .from('Issue')
      .delete()
      .gte('id', 0); // This ensures all records are deleted
    
    if (issuesError) {
      throw new Error(`Failed to delete issues: ${issuesError.message}`);
    }
    
    // 3. Finally delete delivery orders
    const { error: ordersError, count: ordersCount } = await supabase
      .from('DeliveryOrder')
      .delete()
      .gte('id', 0); // This ensures all records are deleted
    
    if (ordersError) {
      throw new Error(`Failed to delete delivery orders: ${ordersError.message}`);
    }

    return NextResponse.json({
      message: 'All delivery orders and related data have been cleared successfully',
      deleted: {
        deliveryOrders: ordersCount || 0,
        issues: issuesCount || 0,
        workflowHistory: historyCount || 0,
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
