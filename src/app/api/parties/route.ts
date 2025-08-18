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

    const { data: parties, error } = await supabase
      .from('Party')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching parties:', error);
      return NextResponse.json(
        { error: 'Failed to fetch parties' },
        { status: 500 }
      );
    }

    return NextResponse.json(parties || []);
  } catch (error) {
    console.error('Error fetching parties:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    // Only admin can create parties
    if (payload.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only administrators can create parties' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, contactPerson, phone, email, address } = body;

    // Check if party already exists
    const { data: existingParty, error: checkError } = await supabase
      .from('Party')
      .select('id')
      .eq('name', name)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking party:', checkError);
      return NextResponse.json(
        { error: 'Failed to check existing party' },
        { status: 500 }
      );
    }

    if (existingParty) {
      return NextResponse.json(
        { error: 'Party with this name already exists' },
        { status: 400 }
      );
    }

    const { data: party, error: createError } = await supabase
      .from('Party')
      .insert({
        name,
        contactPerson,
        phone,
        email,
        address,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating party:', createError);
      return NextResponse.json(
        { error: 'Failed to create party' },
        { status: 500 }
      );
    }

    return NextResponse.json(party, { status: 201 });
  } catch (error) {
    console.error('Error creating party:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
