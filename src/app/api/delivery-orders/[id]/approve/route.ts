import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, notes } = await request.json();

    // Validate role
    if (!["PROJECT_OFFICE", "CISF"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role for approval" },
        { status: 400 }
      );
    }

    // Check if user has the right role
    if (user.role !== role && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "You don't have permission to approve as this role" },
        { status: 403 }
      );
    }

    // Get the delivery order
    const deliveryOrder = await prisma.deliveryOrder.findUnique({
      where: { id: params.id },
      include: {
        issues: {
          where: { status: "OPEN" },
        },
      },
    });

    if (!deliveryOrder) {
      return NextResponse.json(
        { error: "Delivery order not found" },
        { status: 404 }
      );
    }

    // Check for open issues
    if (deliveryOrder.issues.length > 0) {
      return NextResponse.json(
        { error: "Cannot approve order with open issues" },
        { status: 400 }
      );
    }

    // Update approval based on role
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (role === "PROJECT_OFFICE") {
      updateData.projectApproved = true;
      // If CISF has also approved, mark as both approved
      if (deliveryOrder.cisfApproved) {
        updateData.status = "both_approved";
      } else {
        updateData.status = "project_approved";
      }
    } else if (role === "CISF") {
      updateData.cisfApproved = true;
      // If Project Office has also approved, mark as both approved
      if (deliveryOrder.projectApproved) {
        updateData.status = "both_approved";
      } else {
        updateData.status = "cisf_approved";
      }
    }

    // Update the delivery order
    const updatedOrder = await prisma.deliveryOrder.update({
      where: { id: params.id },
      data: updateData,
    });

    // Create workflow history entry
    await prisma.workflowHistory.create({
      data: {
        deliveryOrderId: params.id,
        fromStatus: deliveryOrder.status,
        toStatus: updatedOrder.status,
        actionById: user.id,
        notes: notes || `Approved by ${role}`,
      },
    });

    return NextResponse.json({
      message: "Delivery order approved successfully",
      deliveryOrder: updatedOrder,
    });
  } catch (error) {
    console.error("Error approving delivery order:", error);
    return NextResponse.json(
      { error: "Failed to approve delivery order" },
      { status: 500 }
    );
  }
}