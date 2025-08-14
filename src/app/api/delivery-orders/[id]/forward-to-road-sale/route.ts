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

    // Only ADMIN or system can forward to Road Sale after dual approval
    if (user.role !== "ADMIN" && user.role !== "PROJECT_OFFICE" && user.role !== "CISF") {
      return NextResponse.json(
        { error: "You don't have permission to forward to Road Sale" },
        { status: 403 }
      );
    }

    const { notes } = await request.json();

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

    // Check if both approvals are complete
    if (!deliveryOrder.projectApproved || !deliveryOrder.cisfApproved) {
      return NextResponse.json(
        { error: "Both Project Office and CISF must approve before forwarding to Road Sale" },
        { status: 400 }
      );
    }

    // Check for open issues
    if (deliveryOrder.issues.length > 0) {
      return NextResponse.json(
        { error: "Cannot forward order with open issues" },
        { status: 400 }
      );
    }

    // Update the delivery order status to at_road_sale
    const updatedOrder = await prisma.deliveryOrder.update({
      where: { id: params.id },
      data: {
        status: "at_road_sale",
        updatedAt: new Date(),
      },
    });

    // Create workflow history entry
    await prisma.workflowHistory.create({
      data: {
        deliveryOrderId: params.id,
        fromStatus: deliveryOrder.status,
        toStatus: "at_road_sale",
        actionById: user.id,
        notes: notes || "Forwarded to Road Sale after dual approval",
      },
    });

    return NextResponse.json({
      message: "Delivery order forwarded to Road Sale successfully",
      deliveryOrder: updatedOrder,
    });
  } catch (error) {
    console.error("Error forwarding to Road Sale:", error);
    return NextResponse.json(
      { error: "Failed to forward to Road Sale" },
      { status: 500 }
    );
  }
}