import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { generateDOCreatedEmail, sendEmail } from '@/lib/email';

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

    // Build filter conditions based on user role
  const whereConditions: Record<string, unknown> = {};

    // Role-based filtering
    switch (payload.role) {
      case 'AREA_OFFICE':
        whereConditions.createdById = payload.userId;
        break;
      case 'PROJECT_OFFICE':
        whereConditions.status = {
          in: ['at_project_office', 'received_at_project_office', 'at_road_sale']
        };
        break;
      case 'ROAD_SALE':
        whereConditions.status = 'at_road_sale';
        break;
      // Admin can see all
    }

    // Apply additional filters
    if (status) {
      whereConditions.status = status;
    }
    if (partyId) {
      whereConditions.partyId = partyId;
    }

    const deliveryOrders = await prisma.deliveryOrder.findMany({
      where: whereConditions,
      include: {
        party: true,
        createdBy: {
          select: {
            id: true,
            username: true,
            role: true,
          }
        },
        issues: {
          include: {
            reportedBy: {
              select: {
                id: true,
                username: true,
              }
            }
          }
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(deliveryOrders);
  } catch (error) {
    console.error('Error fetching delivery orders:', error);
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

    // Only Area Office can create DOs
    if (payload.role !== 'AREA_OFFICE' && payload.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only Area Office can create delivery orders' },
        { status: 403 }
      );
    }

    const body = await request.json();
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
    const existingDO = await prisma.deliveryOrder.findUnique({
      where: { doNumber }
    });

    if (existingDO) {
      return NextResponse.json(
        { error: `DO number ${doNumber} already exists. Please use a different number.` },
        { status: 400 }
      );
    }

    // Create delivery order
    const deliveryOrder = await prisma.deliveryOrder.create({
      data: {
        doNumber,
        partyId,
        authorizedPerson,
        validFrom: new Date(), // Set validFrom to current date
        validTo: new Date(validTo),
        status: 'at_area_office',
        notes: notes || null, // Handle undefined notes
        createdById: payload.userId,
      },
      include: {
        party: true,
        createdBy: {
          select: {
            id: true,
            username: true,
            role: true,
          }
        }
      }
    });

    // Create workflow history entry
    await prisma.workflowHistory.create({
      data: {
        deliveryOrderId: deliveryOrder.id,
        fromStatus: 'created',
        toStatus: 'at_area_office',
        actionById: payload.userId,
        notes: 'Delivery order created',
      }
    });

    // Fire-and-forget email notification to Area Office
    (async () => {
      try {
        // Preferred recipients via env: comma-separated list
        const configured = process.env.AREA_OFFICE_NOTIFICATION_EMAILS?.split(',').map(e => e.trim()).filter(Boolean) || [];

        let recipients: string[] = configured;
        if (recipients.length === 0) {
          // Fallback: all active AREA_OFFICE users with email
          const areaUsers = await prisma.user.findMany({
            where: { role: 'AREA_OFFICE', isActive: true, email: { not: null } },
            select: { email: true },
          });
          recipients = areaUsers.map(u => u.email!).filter(Boolean);
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

    return NextResponse.json(deliveryOrder, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating delivery order:', error);
    const err = error as { message?: string } | null;
    // Return more detailed error in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? (err?.message || 'Internal server error')
      : 'Internal server error';
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}