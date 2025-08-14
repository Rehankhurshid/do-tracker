import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user || (user.role !== "CISF" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get counts for CISF dashboard
    const [pendingApproval, approved, withIssues, totalProcessed] = await Promise.all([
      // Orders pending CISF approval
      prisma.deliveryOrder.count({
        where: {
          OR: [
            { status: "AT_PROJECT_OFFICE" },
            { status: "RECEIVED_AT_PROJECT_OFFICE" },
            { status: "PROJECT_APPROVED" },
          ],
          cisfApproved: false,
        },
      }),
      // Orders approved by CISF
      prisma.deliveryOrder.count({
        where: {
          cisfApproved: true,
        },
      }),
      // Orders with open issues reported by CISF
      prisma.deliveryOrder.count({
        where: {
          issues: {
            some: {
              status: "OPEN",
              reportedBy: {
                role: "CISF",
              },
            },
          },
        },
      }),
      // Total orders processed by CISF (approved or with issues)
      prisma.deliveryOrder.count({
        where: {
          OR: [
            { cisfApproved: true },
            {
              issues: {
                some: {
                  reportedBy: {
                    role: "CISF",
                  },
                },
              },
            },
          ],
        },
      }),
    ]);

    return NextResponse.json({
      pendingApproval,
      approved,
      withIssues,
      totalProcessed,
    });
  } catch (error) {
    console.error("Error fetching CISF dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    );
  }
}