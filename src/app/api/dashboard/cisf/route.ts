import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
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
    const [pendingRes, approvedRes] = await Promise.all([
      supabase
        .from('DeliveryOrder')
        .select('*', { count: 'exact', head: true })
        .in('status', ["at_project_office", "received_at_project_office", "project_approved"]) 
        .eq('cisfApproved', false),
      supabase
        .from('DeliveryOrder')
        .select('*', { count: 'exact', head: true })
        .eq('cisfApproved', true),
    ]);

    if (pendingRes.error) throw pendingRes.error;
    if (approvedRes.error) throw approvedRes.error;

    const pendingApproval = pendingRes.count || 0;
    const approved = approvedRes.count || 0;

    // Orders with open issues reported by CISF: need join-like query
  const { data: issuesDOs, error: issuesErr } = await supabase
      .from('Issue')
      .select('delivery_order_id, status, reportedBy:User(role)')
      .eq('status', 'OPEN')
      .eq('reportedBy.role', 'CISF');
    if (issuesErr) throw issuesErr;
  type IssueRow = { delivery_order_id: string };
  const withIssues = new Set((issuesDOs as IssueRow[] | null | undefined || []).map(i => i.delivery_order_id)).size;

    // Total processed: approved or with issues
    const totalProcessed = approved + withIssues;

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