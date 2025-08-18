import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('DeliveryOrder')
      .select('*, party:Party(*), issues:Issue(*), workflowHistory:WorkflowHistory(*)')
      .order('createdAt', { ascending: false });
    if (error) throw error;
    // Sort nested arrays client-side by createdAt desc
    type Issue = { createdAt: string } & Record<string, unknown>;
    type Workflow = { createdAt: string } & Record<string, unknown>;
    const deliveryOrders = (data || []).map((d: Record<string, unknown> & { issues?: Issue[]; workflowHistory?: Workflow[] }) => ({
      ...d,
      issues: (d.issues || []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      workflowHistory: (d.workflowHistory || []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    }));

    return NextResponse.json(deliveryOrders);
  } catch (error) {
    console.error('Error fetching delivery orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery orders' },
      { status: 500 }
    );
  }
}