import { NextRequest, NextResponse } from 'next/server';
import { generateDOCreatedEmail, sendEmail } from '@/lib/email';
import { requireAuth, ok, fail, parseJson } from '@/app/api/_helpers/handler';
import { createDO, listForUser } from '@/services/deliveryOrders';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
  const { user, response } = await requireAuth();
  if (!user) return response!;

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const partyId = searchParams.get('partyId');

  const deliveryOrders = await listForUser(user, { status, partyId });
  return ok(deliveryOrders);
  } catch (error) {
    console.error('Error fetching delivery orders:', error);
  return fail('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
  const { user, response } = await requireAuth();
  if (!user) return response!;

    // Only Area Office can create DOs
    if (user.role !== 'AREA_OFFICE' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only Area Office can create delivery orders' }, { status: 403 });
    }

  type CreateBody = { doNumber: string; partyId: string; authorizedPerson: string; validTo: string; notes?: string | null };
  const { body, response: parseErr } = await parseJson<CreateBody>(request);
    if (!body) return parseErr!;
    const { doNumber, partyId, authorizedPerson, validTo, notes } = body;

    // Validate required fields
    if (!doNumber || !partyId || !authorizedPerson || !validTo) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          details: {
            doNumber: !doNumber ? 'DO Number is required' : null,
            partyId: !partyId ? 'Party is required' : null,
            authorizedPerson: !authorizedPerson ? 'Authorized Person is required' : null,
            validTo: !validTo ? 'Valid To date is required' : null,
          }
        },
        { status: 400 }
      );
    }

    // Check if DO number already exists
  // Create via service
  const deliveryOrder = await createDO(user, { doNumber, partyId, authorizedPerson, validTo, notes });

    // Fire-and-forget email notification to Area Office
    (async () => {
      try {
        // Preferred recipients via env: comma-separated list
        const configured = process.env.AREA_OFFICE_NOTIFICATION_EMAILS?.split(',').map(e => e.trim()).filter(Boolean) || [];

        let recipients: string[] = configured;
        if (recipients.length === 0) {
          // Fallback: all active AREA_OFFICE users with email
          const { data: areaUsers, error } = await supabase
            .from('User')
            .select('email')
            .eq('role', 'AREA_OFFICE')
            .eq('isActive', true)
            .not('email', 'is', null);
          
          if (error) {
            console.error('[DO Created Email] Error fetching area office users:', error);
            recipients = [];
          } else {
            recipients = (areaUsers || []).map(u => u.email).filter(Boolean);
          }
        }

        if (recipients.length === 0) {
          console.warn('[DO Created Email] No recipients configured or found. Skipping email.');
          return;
        }

        const html = generateDOCreatedEmail({
          doNumber: deliveryOrder.doNumber,
          partyName: deliveryOrder.party?.name,
          authorizedPerson: deliveryOrder.authorizedPerson,
          validFrom: deliveryOrder.validFrom,
          validTo: deliveryOrder.validTo,
          createdBy: deliveryOrder.createdBy?.username || 'Unknown',
          notes: deliveryOrder.notes,
        });

        const subject = `New DO #${deliveryOrder.doNumber} created`;

        // Send individually to avoid revealing recipients
        for (const to of recipients) {
          const res = await sendEmail({ to, subject, html });
          if (!res.success) {
            console.error('[DO Created Email] Failed for', to, res.error);
          }
        }
      } catch (err) {
        console.error('[DO Created Email] Notification error:', err);
      }
    })();

  return ok(deliveryOrder, 201);
  } catch (error: unknown) {
    console.error('Error creating delivery order:', error);
    const err = error as { message?: string } | null;
    // Return more detailed error in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? (err?.message || 'Internal server error')
      : 'Internal server error';
  return fail(errorMessage, 500, process.env.NODE_ENV === 'development' ? String(error) : undefined);
  }
}
