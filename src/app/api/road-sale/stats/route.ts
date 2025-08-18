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

    if (!decoded || decoded.role !== 'ROAD_SALE') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Fetch Road Sale specific statistics via Supabase
    const { data, error } = await supabase
      .from('DeliveryOrder')
      .select(`
        *,
        issues:Issue (*)
      `)
      .eq('status', 'at_road_sale');

    if (error) {
      console.error('Supabase fetch error (road-sale stats):', error);
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }

    const deliveryOrders = (data || []) as Array<{
      updatedAt: string;
      issues?: Array<{ status: string }> | null;
    }>;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalReceived = deliveryOrders.length;
    const receivedToday = deliveryOrders.filter(
      do_ => new Date(do_.updatedAt) >= today
    ).length;
  const withIssues = deliveryOrders.filter((do_) => (do_.issues || []).some((i) => i.status === 'OPEN')).length;
    const totalCompleted = totalReceived; // All at Road Sale are completed

    return NextResponse.json({
      totalReceived,
      receivedToday,
      withIssues,
      totalCompleted,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}