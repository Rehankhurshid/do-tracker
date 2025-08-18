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

    if (!decoded || decoded.role !== 'AREA_OFFICE') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Fetch Area Office specific statistics - Department-wide visibility
    // Get all DOs currently at Area Office stage
    const { data: stageDOs, error: stageErr } = await supabase
      .from('DeliveryOrder')
      .select('id, issues:Issue(status)')
      .in('status', ['created', 'at_area_office']);
    if (stageErr) throw stageErr;

    // Get total count of all DOs ever created
    const { count: totalCreated, error: totalErr } = await supabase
      .from('DeliveryOrder')
      .select('*', { count: 'exact', head: true });
    if (totalErr) throw totalErr;

    // Get count of forwarded DOs (beyond Area Office stage)
    const { count: forwarded, error: fwdErr } = await supabase
      .from('DeliveryOrder')
      .select('*', { count: 'exact', head: true })
      .not('status', 'in', '(created,at_area_office)');
    if (fwdErr) throw fwdErr;

    // Pending forward are those currently at Area Office stage
  const pendingForward = (stageDOs || []).length;

    // Count DOs with open issues at Area Office stage
    type Issue = { status: string };
    type StageDO = { issues?: Issue[] };
    const withIssues = (stageDOs as StageDO[] | null | undefined || [])
      .filter(do_ => Array.isArray(do_.issues) && (do_.issues as Issue[]).some(i => i.status === 'OPEN')).length;

    const response = NextResponse.json({
      totalCreated,
      pendingForward,
      forwarded,
      withIssues,
    });
    
    // Prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}