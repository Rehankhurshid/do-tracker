import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const deliveryOrderId = searchParams.get('deliveryOrderId');
    const status = searchParams.get('status');

    // Build filter based on user role
    let whereConditions: any = {};

    if (deliveryOrderId) {
      whereConditions.deliveryOrderId = deliveryOrderId;
    }
    if (status) {
      whereConditions.status = status;
    }

    // Role-based filtering - Department-wide visibility
    if (payload.role === 'AREA_OFFICE') {
      // Area office can see issues for all DOs at their stage
      const relevantDOs = await prisma.deliveryOrder.findMany({
        where: {
          status: {
            in: ['created', 'at_area_office']
          }
        },
        select: { id: true }
      });
      const doIds = relevantDOs.map(d => d.id);
      if (doIds.length > 0) {
        whereConditions.deliveryOrderId = deliveryOrderId 
          ? { equals: deliveryOrderId } 
          : { in: doIds };
      } else {
        return NextResponse.json([]);
      }
    } else if (payload.role === 'PROJECT_OFFICE') {
      // Project office can see issues for all DOs at their stage and beyond
      const relevantDOs = await prisma.deliveryOrder.findMany({
        where: {
          status: {
            in: ['at_project_office', 'received_at_project_office', 'at_road_sale']
          }
        },
        select: { id: true }
      });
      const doIds = relevantDOs.map(d => d.id);
      if (doIds.length > 0) {
        whereConditions.deliveryOrderId = deliveryOrderId 
          ? { equals: deliveryOrderId } 
          : { in: doIds };
      } else {
        return NextResponse.json([]);
      }
    } else if (payload.role === 'CISF') {
      // CISF can see issues for DOs that need their approval or have been approved by them
      const relevantDOs = await prisma.deliveryOrder.findMany({
        where: {
          OR: [
            { status: { in: ['at_project_office', 'received_at_project_office'] } },
            { cisfApproved: true }
          ]
        },
        select: { id: true }
      });
      const doIds = relevantDOs.map(d => d.id);
      if (doIds.length > 0) {
        whereConditions.deliveryOrderId = deliveryOrderId 
          ? { equals: deliveryOrderId } 
          : { in: doIds };
      } else {
        return NextResponse.json([]);
      }
    } else if (payload.role === 'ROAD_SALE') {
      // Road sale can see issues for all DOs at their stage
      const relevantDOs = await prisma.deliveryOrder.findMany({
        where: { status: 'at_road_sale' },
        select: { id: true }
      });
      const doIds = relevantDOs.map(d => d.id);
      if (doIds.length > 0) {
        whereConditions.deliveryOrderId = deliveryOrderId 
          ? { equals: deliveryOrderId } 
          : { in: doIds };
      } else {
        return NextResponse.json([]);
      }
    }
    // Admin can see all issues without filtering

    const issues = await prisma.issue.findMany({
      where: whereConditions,
      include: {
        deliveryOrder: {
          include: {
            party: true
          }
        },
        reportedBy: {
          select: {
            id: true,
            username: true,
            role: true
          }
        },
        resolvedBy: {
          select: {
            id: true,
            username: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(issues);
  } catch (error) {
    console.error('Error fetching issues:', error);
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

    const body = await request.json();
    const { deliveryOrderId, issueType, description } = body;

    console.log('Creating issue with:', { deliveryOrderId, issueType, description, userId: payload.userId });

    // Validate required fields
    if (!deliveryOrderId || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: deliveryOrderId and description are required' },
        { status: 400 }
      );
    }

    // Verify the delivery order exists
    const deliveryOrder = await prisma.deliveryOrder.findUnique({
      where: { id: deliveryOrderId }
    });

    if (!deliveryOrder) {
      console.error('Delivery order not found:', deliveryOrderId);
      return NextResponse.json(
        { error: 'Delivery order not found' },
        { status: 404 }
      );
    }

    console.log('Found delivery order:', deliveryOrder.doNumber);

    // Create the issue
    const issue = await prisma.issue.create({
      data: {
        deliveryOrderId,
        issueType: issueType || 'OTHER',
        description,
        status: 'OPEN',
        reportedById: payload.userId,
      },
      include: {
        deliveryOrder: {
          include: {
            party: true
          }
        },
        reportedBy: {
          select: {
            id: true,
            username: true,
            role: true
          }
        }
      }
    });

    console.log('Issue created successfully:', issue.id);
    return NextResponse.json(issue, { status: 201 });
  } catch (error: any) {
    console.error('Error creating issue:', error);
    console.error('Error details:', error.message);
    
    // Check if it's a Prisma error
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Duplicate issue already exists' },
        { status: 400 }
      );
    }
    
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Invalid foreign key reference. Please check if the user and delivery order exist.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}