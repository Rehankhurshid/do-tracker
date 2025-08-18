import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
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

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const partyId = searchParams.get('partyId');
    const minimal = searchParams.get('minimal') === 'true'; // Add minimal flag

    // Build Supabase query base with role-based filters
    let query = supabase
      .from('DeliveryOrder')
      .select(`
        id, doNumber, status, authorizedPerson, validFrom, validTo, projectApproved, cisfApproved, createdAt,
        party:Party (id, name),
        issues:Issue (*),
        createdBy:User!createdById (id, username, role),
        workflowHistory:WorkflowHistory (*, actionBy:User!actionById (id, username, role))
      `);

    // Role filters
    if (payload.role === 'AREA_OFFICE') {
      query = query.in('status', [
        'created',
        'at_area_office',
        'at_project_office',
        'received_at_project_office',
        'at_road_sale',
      ]);
    } else if (payload.role === 'PROJECT_OFFICE' || payload.role === 'CISF') {
      query = query.in('status', [
        'at_project_office',
        'received_at_project_office',
        'project_approved',
        'cisf_approved',
        'both_approved',
        'at_road_sale',
      ]);
    } else if (payload.role === 'ROAD_SALE') {
      query = query.eq('status', 'at_road_sale');
    }

    // Additional filters
    if (status) {
      query = query.eq('status', status);
    }
    if (partyId) {
      query = query.eq('partyId', partyId);
    }

    // Ordering
    query = query.order('createdAt', { ascending: false });

    const { data, error } = await query;
    if (error) {
      console.error('Supabase fetch error (optimized DO):', error);
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }

    const allOrders = (data as unknown as Array<{
      id: string;
      doNumber: string;
      status: string;
      authorizedPerson: string | null;
      validFrom: string;
      validTo: string;
      projectApproved: boolean | null;
      cisfApproved: boolean | null;
      createdAt: string;
      party?: { id: string; name: string } | { id: string; name: string }[] | null;
      createdBy?: { id: string; username: string; role: string } | { id: string; username: string; role: string }[] | null;
      issues?: Array<{ status: string }> | null;
      workflowHistory?: Array<{
        createdAt: string;
        actionBy?: { id: string; username: string; role: string } | { id: string; username: string; role: string }[] | null;
      }> | null;
    }> ) || [];

    const normalizeOne = <T>(value: T | T[] | null | undefined): T | null => {
      if (Array.isArray(value)) return (value[0] as T) ?? null;
      return (value as T) ?? null;
    };

    if (minimal) {
      // Map to minimal shape and compute open issues count
      const minimalRows = allOrders.map((o) => {
        const party = normalizeOne(o.party);
        return ({
        id: o.id,
        doNumber: o.doNumber,
        status: o.status,
        authorizedPerson: o.authorizedPerson,
        validFrom: o.validFrom,
        validTo: o.validTo,
        projectApproved: o.projectApproved,
        cisfApproved: o.cisfApproved,
        createdAt: o.createdAt,
        party: party ? { id: party.id, name: party.name } : null,
        _count: {
          issues: (o.issues || []).filter((i) => i.status === 'OPEN').length,
        },
      });
      });
      return NextResponse.json(minimalRows);
    }

    // Full view: sort workflowHistory client-side and take last 5
    const fullRows = allOrders.map((o) => {
      const party = normalizeOne(o.party);
      const createdBy = normalizeOne(o.createdBy);
      const workflowHistory = (o.workflowHistory || [])
        .map((h) => ({ ...h, actionBy: normalizeOne(h.actionBy) }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      return {
        ...o,
        party,
        createdBy,
        workflowHistory,
      };
    });

    return NextResponse.json(fullRows);
  } catch (error) {
    console.error('Error fetching delivery orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}