import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the userId from params - await it for Next.js 13+
    const { id: userId } = await params;
    
    const token = request.cookies.get("token")?.value;
    if (!token) {
      console.error("Delete user - No auth token found");
      return NextResponse.json({ error: "Unauthorized - No token" }, { status: 401 });
    }

    const currentUser = await verifyToken(token);
    if (!currentUser) {
      console.error("Delete user - Invalid token or user not found");
      return NextResponse.json({ error: "Unauthorized - Invalid token" }, { status: 401 });
    }
    
    if (currentUser.role !== "ADMIN") {
      console.error("Delete user - Non-admin attempted deletion:", currentUser.username);
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 });
    }

    // Prevent self-deletion
    if (currentUser.id === userId) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    // Check if user exists
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        createdOrders: true,
        reportedIssues: true,
        resolvedIssues: true,
        workflowActions: true,
      },
    });

    if (!userToDelete) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check for data dependencies
    const hasData = 
      userToDelete.createdOrders.length > 0 ||
      userToDelete.reportedIssues.length > 0 ||
      userToDelete.resolvedIssues.length > 0 ||
      userToDelete.workflowActions.length > 0;

    // Check for force delete parameter
    const { searchParams } = new URL(request.url);
    const forceDelete = searchParams.get('force') === 'true';
    
    if (hasData && !forceDelete) {
      // Soft delete - deactivate the user instead of hard delete
      // Only add deleted prefix if not already there
      let newUsername = userToDelete.username;
      if (!newUsername.startsWith('deleted_')) {
        newUsername = `deleted_${Date.now()}_${userToDelete.username}`;
      }
      
      let newEmail = userToDelete.email;
      if (newEmail && !newEmail.startsWith('deleted_')) {
        newEmail = `deleted_${Date.now()}_${userToDelete.email}`;
      }
      
      const deactivatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          isActive: false,
          username: newUsername,
          email: newEmail,
          password: null, // Clear password
          resetToken: null,
          resetTokenExpiry: null,
        },
      });

      // Log the deletion
      console.log(`User soft deleted by admin:`, {
        deletedUserId: userId,
        deletedUsername: userToDelete.username,
        deletedBy: currentUser.username,
        timestamp: new Date().toISOString(),
        reason: "Has associated data - soft delete performed",
      });

      return NextResponse.json({
        message: "User deactivated successfully (has associated data)",
        user: {
          id: deactivatedUser.id,
          username: userToDelete.username, // Return original username for UI
          wasDeactivated: true,
        },
      });
    } else {
      // Hard delete - completely remove the user
      // This happens when:
      // 1. User has no associated data
      // 2. Force delete is requested (for cleaning up corrupted records)
      
      if (forceDelete && hasData) {
        console.warn(`FORCE DELETE: User ${userToDelete.username} has associated data but force delete was requested`);
      }
      
      await prisma.user.delete({
        where: { id: userId },
      });

      // Log the deletion
      console.log(`User permanently deleted by admin:`, {
        deletedUserId: userId,
        deletedUsername: userToDelete.username,
        deletedBy: currentUser.username,
        timestamp: new Date().toISOString(),
        reason: "No associated data - hard delete performed",
      });

      return NextResponse.json({
        message: "User permanently deleted",
        user: {
          id: userId,
          username: userToDelete.username,
          wasDeleted: true,
        },
      });
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}