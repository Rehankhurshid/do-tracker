import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

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

    if (!decoded || decoded.role !== 'PROJECT_OFFICE') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Fetch Project Office specific statistics via Supabase
    const { data, error } = await supabase
      .from('DeliveryOrder')
      .select(`
        *,
        issues:Issue (*)
      `)
      .in('status', ['at_project_office', 'received_at_project_office', 'at_road_sale']);

    if (error) {
      console.error('Supabase fetch error (project-office stats):', error);
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }

    const deliveryOrders = (data || []) as Array<{
      status: string;
      issues?: Array<{ status: string }> | null;
    }>;

    const pendingReceive = deliveryOrders.filter(
      do_ => do_.status === 'at_project_office'
    ).length;
    
    const received = deliveryOrders.filter(
      do_ => do_.status === 'received_at_project_office'
    ).length;
    
    const forwarded = deliveryOrders.filter(
      do_ => do_.status === 'at_road_sale'
    ).length;
    
    const withIssues = deliveryOrders.filter((do_) => {
      if (do_.status !== 'received_at_project_office') return false;
      const openIssues = (do_.issues || []).filter((i) => i.status === 'OPEN');
      return openIssues.length > 0;
    }).length;

    return NextResponse.json({
      pendingReceive,
      received,
      forwarded,
      withIssues,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}