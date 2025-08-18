import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token.value);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { resolution } = body;

    if (!resolution || resolution.trim() === '') {
      return NextResponse.json(
        { error: 'Resolution is required' },
        { status: 400 }
      );
    }

    // Get the issue
    const { data: issue, error: fetchError } = await supabase
      .from('Issue')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    if (issue.status === 'RESOLVED') {
      return NextResponse.json(
        { error: 'Issue is already resolved' },
        { status: 400 }
      );
    }

    // Update the issue
    const { data: updatedIssue, error: updateError } = await supabase
      .from('Issue')
      .update({
        status: 'RESOLVED',
        resolution,
        resolvedById: payload.userId,
      })
      .eq('id', id)
      .select(`
        *,
        deliveryOrder:DeliveryOrder!deliveryOrderId (
          *,
          party:Party!partyId (*)
        ),
        reportedBy:User!reportedById (id, username, role),
        resolvedBy:User!resolvedById (id, username, role)
      `)
      .single();

    if (updateError) {
      console.error('Error updating issue:', updateError);
      return NextResponse.json(
        { error: 'Failed to resolve issue' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedIssue);
  } catch (error) {
    console.error('Error resolving issue:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
