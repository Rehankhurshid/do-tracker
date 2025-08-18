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

    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Fetch statistics using Supabase
    const [
      usersResult,
      dosResult,
      partiesResult,
      openIssuesResult,
      deliveryOrdersResult
    ] = await Promise.all([
      supabase.from('User').select('*', { count: 'exact', head: true }),
      supabase.from('DeliveryOrder').select('*', { count: 'exact', head: true }),
      supabase.from('Party').select('*', { count: 'exact', head: true }),
      supabase.from('Issue').select('*', { count: 'exact', head: true }).eq('status', 'OPEN'),
      supabase.from('DeliveryOrder').select('status')
    ]);

    if (usersResult.error) {
      console.error('Error fetching users count:', usersResult.error);
      throw new Error('Failed to fetch users count');
    }
    if (dosResult.error) {
      console.error('Error fetching DOs count:', dosResult.error);
      throw new Error('Failed to fetch DOs count');
    }
    if (partiesResult.error) {
      console.error('Error fetching parties count:', partiesResult.error);
      throw new Error('Failed to fetch parties count');
    }
    if (openIssuesResult.error) {
      console.error('Error fetching open issues count:', openIssuesResult.error);
      throw new Error('Failed to fetch open issues count');
    }
    if (deliveryOrdersResult.error) {
      console.error('Error fetching delivery orders:', deliveryOrdersResult.error);
      throw new Error('Failed to fetch delivery orders');
    }

    const totalUsers = usersResult.count || 0;
    const totalDOs = dosResult.count || 0;
    const totalParties = partiesResult.count || 0;
    const openIssues = openIssuesResult.count || 0;
    
    const deliveryOrders = deliveryOrdersResult.data || [];
    const inProgress = deliveryOrders.filter(
      (do_: { status: string }) => !['created', 'at_road_sale'].includes(do_.status)
    ).length;

    const completed = deliveryOrders.filter(
      (do_: { status: string }) => do_.status === 'at_road_sale'
    ).length;

    return NextResponse.json({
      totalUsers,
      totalDOs,
      totalParties,
      openIssues,
      inProgress,
      completed,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
