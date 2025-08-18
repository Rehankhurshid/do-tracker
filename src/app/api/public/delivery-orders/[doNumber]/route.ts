import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: { doNumber: string } }
) {
  try {
    const { doNumber } = params;
  const { data: deliveryOrders, error } = await supabase
      .from('DeliveryOrder')
      .select('*, party:Party(id, name), issues:Issue(id, description, status, resolution, createdAt), workflowHistory:WorkflowHistory(id, fromStatus, toStatus, comments, createdAt)')
      .eq('doNumber', doNumber)
      .limit(1);
    if (error) throw error;
    const deliveryOrder = deliveryOrders?.[0];

    if (!deliveryOrder) {
      return NextResponse.json(
        { error: 'Delivery order not found' },
        { status: 404 }
      );
    }

    // Remove sensitive information
    type Issue = { id: string; description: string; status: string; resolution?: string | null; createdAt: string };
    type Hist = { id: string; fromStatus: string; toStatus: string; comments?: string | null; createdAt: string };
    const publicData = {
  id: deliveryOrder.id,
  doNumber: deliveryOrder.doNumber,
  party: deliveryOrder.party,
  authorizedPerson: deliveryOrder.authorizedPerson,
  validFrom: deliveryOrder.validFrom,
  validTo: deliveryOrder.validTo,
  status: deliveryOrder.status,
      notes: (deliveryOrder as unknown as { notes?: string | null }).notes,
  createdAt: deliveryOrder.createdAt,
      issues: (deliveryOrder.issues as Issue[] | undefined || []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      workflowHistory: (deliveryOrder.workflowHistory as Hist[] | undefined || []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    };

    return NextResponse.json(publicData);
  } catch (error) {
    console.error('Get delivery order error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}