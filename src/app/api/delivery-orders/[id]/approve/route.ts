import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
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

    // Get the delivery order with open issues
    const { data: deliveryOrder, error: findError } = await supabase
      .from('DeliveryOrder')
      .select(`
        *,
        issues:Issue!inner(id)
      `)
      .eq('id', id)
      .eq('issues.status', 'OPEN')
      .single();

    // If error is PGRST116, it means no DO with open issues was found
    // We need to check if the DO exists at all
    if (findError && findError.code === 'PGRST116') {
      // Check if DO exists
      const { data: doExists, error: existsError } = await supabase
        .from('DeliveryOrder')
        .select('*')
        .eq('id', id)
        .single();
      
      if (existsError || !doExists) {
        return fail("Delivery order not found", 404);
      }
      
      // DO exists but has no open issues, which is good
    } else if (findError) {
      console.error('Error fetching delivery order:', findError);
      return fail("Failed to fetch delivery order", 500);
    } else if (deliveryOrder) {
      // DO has open issues
      return fail("Cannot approve order with open issues", 400);
    }

    // Get the delivery order details (without open issues filter)
    const { data: doData, error: doError } = await supabase
      .from('DeliveryOrder')
      .select('*')
      .eq('id', id)
      .single();
    
    if (doError || !doData) {
      return fail("Delivery order not found", 404);
    }

    // Update approval based on role
  const updateData: { projectApproved?: boolean; cisfApproved?: boolean; status?: string; updatedAt: string } = { updatedAt: new Date().toISOString() };

    if (role === "PROJECT_OFFICE") {
      updateData.projectApproved = true;
      // If CISF has also approved, mark as both approved
  if (doData.cisfApproved) {
        updateData.status = "both_approved";
      } else {
        updateData.status = "project_approved";
      }
    } else if (role === "CISF") {
      updateData.cisfApproved = true;
      // If Project Office has also approved, mark as both approved
  if (doData.projectApproved) {
        updateData.status = "both_approved";
      } else {
        updateData.status = "cisf_approved";
      }
    }

    // Update the delivery order
    const { data: updatedOrder, error: updateError } = await supabase
      .from('DeliveryOrder')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (updateError || !updatedOrder) {
      console.error('Error updating delivery order:', updateError);
      return fail("Failed to update delivery order", 500);
    }

    // Create workflow history entry
    const { error: historyError } = await supabase
      .from('WorkflowHistory')
      .insert({
        deliveryOrderId: id,
        fromStatus: doData.status,
        toStatus: updatedOrder.status,
        actionById: user.userId,
        notes: notes || `Approved by ${role}`,
      });
    
    if (historyError) {
      console.error('Error creating workflow history:', historyError);
    }

    // Auto-forward to Road Sale if both have approved
    if (updatedOrder.status === "both_approved") {
      // Automatically forward to Road Sale
      const { data: finalOrder, error: finalUpdateError } = await supabase
        .from('DeliveryOrder')
        .update({
          status: "at_road_sale",
          updatedAt: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (finalUpdateError || !finalOrder) {
        console.error('Error auto-forwarding to Road Sale:', finalUpdateError);
        return fail("Failed to auto-forward to Road Sale", 500);
      }

      // Create workflow history for auto-forward
      const { error: autoForwardHistoryError } = await supabase
        .from('WorkflowHistory')
        .insert({
          deliveryOrderId: id,
          fromStatus: "both_approved",
          toStatus: "at_road_sale",
          actionById: user.userId,
          notes: "Automatically forwarded to Road Sale after dual approval",
        });
      
      if (autoForwardHistoryError) {
        console.error('Error creating auto-forward history:', autoForwardHistoryError);
      }

      return ok({ message: "Delivery order approved by both departments and automatically forwarded to Road Sale", deliveryOrder: finalOrder });
    }

    return ok({ message: "Delivery order approved successfully", deliveryOrder: updatedOrder });
  } catch (error: unknown) {
    console.error("Error approving delivery order:", error);
    const message = error instanceof Error ? error.message : String(error);
    return fail("Failed to approve delivery order", 500, process.env.NODE_ENV === 'development' ? message : undefined);
  }
}
