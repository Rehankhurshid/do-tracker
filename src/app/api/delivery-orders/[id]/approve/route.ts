import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, ok, fail, parseJson } from "@/app/api/_helpers/handler";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
  const { id } = await params;
  const { user, response } = await requireAuth();
  if (!user) return response!;

  const { body, response: parseErr } = await parseJson<{ role: 'PROJECT_OFFICE' | 'CISF'; notes?: string }>(request);
  if (!body) return parseErr!;
  const { role, notes } = body;

    // Validate role
    if (!["PROJECT_OFFICE", "CISF"].includes(role)) {
      return fail("Invalid role for approval", 400);
    }

    // Check if user has the right role
    if (user.role !== role && user.role !== "ADMIN") {
      return fail("You don't have permission to approve as this role", 403);
    }

    // Get the delivery order
    const deliveryOrder = (await prisma.deliveryOrder.findUnique({
      where: { id },
      include: { issues: { where: { status: "OPEN" }, select: { id: true } } },
    })) as unknown as { status: string; projectApproved: boolean; cisfApproved: boolean; issues: { id: string }[] } | null;

    if (!deliveryOrder) {
  return fail("Delivery order not found", 404);
    }

    // Check for open issues
    if (deliveryOrder.issues.length > 0) {
  return fail("Cannot approve order with open issues", 400);
    }

    // Update approval based on role
  const updateData: { projectApproved?: boolean; cisfApproved?: boolean; status?: string; updatedAt: Date } = { updatedAt: new Date() };

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
      where: { id },
      data: updateData,
    });

    // Create workflow history entry
    await prisma.workflowHistory.create({
      data: {
        deliveryOrderId: id,
        fromStatus: deliveryOrder.status,
        toStatus: updatedOrder.status,
  actionById: user.userId,
        notes: notes || `Approved by ${role}`,
      },
    });

    // Auto-forward to Road Sale if both have approved
    if (updatedOrder.status === "both_approved") {
      // Automatically forward to Road Sale
      const finalOrder = await prisma.deliveryOrder.update({
        where: { id },
        data: {
          status: "at_road_sale",
          updatedAt: new Date(),
        },
      });

      // Create workflow history for auto-forward
      await prisma.workflowHistory.create({
        data: {
          deliveryOrderId: id,
          fromStatus: "both_approved",
          toStatus: "at_road_sale",
          actionById: user.userId,
          notes: "Automatically forwarded to Road Sale after dual approval",
        },
      });

      return ok({ message: "Delivery order approved by both departments and automatically forwarded to Road Sale", deliveryOrder: finalOrder });
    }

    return ok({ message: "Delivery order approved successfully", deliveryOrder: updatedOrder });
  } catch (error: unknown) {
    console.error("Error approving delivery order:", error);
    const message = error instanceof Error ? error.message : String(error);
    return fail("Failed to approve delivery order", 500, process.env.NODE_ENV === 'development' ? message : undefined);
  }
}