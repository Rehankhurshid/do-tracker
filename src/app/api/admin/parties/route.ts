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

    // Get query parameter to include archived parties
    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get('includeArchived') === 'true';

    // Build query based on includeArchived parameter
    let query = supabase
      .from('Party')
      .select('*')
      .order('createdAt', { ascending: false });

    if (!includeArchived) {
      query = query.eq('isArchived', false);
    }

    const { data: parties, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch parties' },
        { status: 500 }
      );
    }

    // Get delivery order counts for each party
    const partyIds = parties?.map((party) => party.id) || [];
    
    if (partyIds.length > 0) {
      const { data: deliveryOrderCounts, error: countError } = await supabase
        .from('DeliveryOrder')
        .select('partyId')
        .in('partyId', partyIds);

      if (!countError && deliveryOrderCounts) {
        // Count delivery orders per party
        const countMap = deliveryOrderCounts.reduce((acc, do_) => {
          acc[do_.partyId] = (acc[do_.partyId] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Add _count property to match Prisma response format
        parties?.forEach((party) => {
          const partyWithCount = party as any;
          partyWithCount._count = {
            deliveryOrders: countMap[party.id] || 0
          };
        });
      }
    } else {
      // No parties, but still add _count for consistency
      parties?.forEach((party) => {
        const partyWithCount = party as any;
        partyWithCount._count = {
          deliveryOrders: 0
        };
      });
    }

    return NextResponse.json(parties || []);
  } catch (error) {
    console.error('Get parties error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { name, contactPerson, phone, email, address } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Party name is required' },
        { status: 400 }
      );
    }

    // Check if party name already exists
    const { data: existingParty, error: checkError } = await supabase
      .from('Party')
      .select('id')
      .eq('name', name)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Check party error:', checkError);
      return NextResponse.json(
        { error: 'Failed to check existing party' },
        { status: 500 }
      );
    }

    if (existingParty) {
      return NextResponse.json(
        { error: 'Party name already exists' },
        { status: 400 }
      );
    }

    // Create party
    const { data: party, error: createError } = await supabase
      .from('Party')
      .insert({
        name,
        contactPerson: contactPerson || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
      })
      .select()
      .single();

    if (createError) {
      console.error('Create party error:', createError);
      return NextResponse.json(
        { error: 'Failed to create party' },
        { status: 500 }
      );
    }

    return NextResponse.json(party);
  } catch (error) {
    console.error('Create party error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
