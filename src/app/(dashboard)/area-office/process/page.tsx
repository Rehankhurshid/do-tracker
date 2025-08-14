"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Truck, AlertCircle, Clock, CheckCircle, FileText, Package, Sparkles, ArrowRight, Loader2, Send, MessageSquare, Plus, AlertTriangle, ChevronDown, ChevronUp, XCircle, CheckCircle2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ProcessDOsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [deliveryOrders, setDeliveryOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [showWelcome, setShowWelcome] = useState(false);
  const [forwardingOrderId, setForwardingOrderId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    orderId: string | null;
    orderNumber: string;
    partyName: string;
  }>({ open: false, orderId: null, orderNumber: "", partyName: "" });
  const [forwardNote, setForwardNote] = useState("");
  const [reportIssueDialog, setReportIssueDialog] = useState<{
    open: boolean;
    orderId: string | null;
    orderNumber: string;
    issueType: string;
    description: string;
  }>({ open: false, orderId: null, orderNumber: "", issueType: "OTHER", description: "" });
  const [isReportingIssue, setIsReportingIssue] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [resolveIssueDialog, setResolveIssueDialog] = useState<{
    open: boolean;
    issueId: string | null;
    issueDescription: string;
    issueType: string;
    resolution: string;
  }>({ open: false, issueId: null, issueDescription: "", issueType: "", resolution: "" });
  const [isResolvingIssue, setIsResolvingIssue] = useState(false);
  const [viewDODialog, setViewDODialog] = useState<{
    open: boolean;
    order: any | null;
  }>({ open: false, order: null });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    orderId: string | null;
    orderNumber: string;
  }>({ open: false, orderId: null, orderNumber: "" });
  const [isDeletingOrder, setIsDeletingOrder] = useState(false);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);

  useEffect(() => {
    // Check if coming from create page
    if (searchParams?.get("from") === "create") {
      setShowWelcome(true);
      setTimeout(() => setShowWelcome(false), 3000);
    }
    fetchDeliveryOrders();
  }, [searchParams]);

  const fetchDeliveryOrders = async () => {
    try {
      const response = await fetch("/api/delivery-orders");
      if (response.ok) {
        const data = await response.json();
        setDeliveryOrders(data);
        return data;
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch delivery orders",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
    return [];
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      created: { label: "Created", variant: "secondary" },
      at_area_office: { label: "At Area Office", variant: "default" },
      at_project_office: { label: "At Project Office", variant: "secondary" },
      received_at_project_office: { label: "Received at PO", variant: "secondary" },
      at_road_sale: { label: "At Road Sale", variant: "success" },
    };

    const config = statusConfig[status] || { label: status, variant: "default" };
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  const canForward = (order: any) => {
    // Check if there are any unresolved issues
    const hasUnresolvedIssues = order.issues?.some((issue: any) => issue.status === "OPEN");
    return (order.status === "at_area_office" || order.status === "created") && !hasUnresolvedIssues;
  };

  const openConfirmDialog = (order: any) => {
    setConfirmDialog({
      open: true,
      orderId: order.id,
      orderNumber: order.doNumber,
      partyName: order.party?.name || "",
    });
    setForwardNote("");
  };

  const reportIssue = async () => {
    console.log("Report Issue clicked", reportIssueDialog);
    
    if (!reportIssueDialog.orderId || !reportIssueDialog.description.trim()) {
      toast({
        title: "Error",
        description: "Please provide a description for the issue",
        variant: "destructive",
      });
      return;
    }

    const requestBody = {
      deliveryOrderId: reportIssueDialog.orderId,
      issueType: reportIssueDialog.issueType,
      description: reportIssueDialog.description.trim(),
    };
    
    console.log("Sending request body:", requestBody);

    setIsReportingIssue(true);
    try {
      const response = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log("Issue created:", data);
        toast({
          title: "✅ Issue Reported",
          description: `Issue reported for DO #${reportIssueDialog.orderNumber}`,
        });
        setReportIssueDialog({ open: false, orderId: null, orderNumber: "", issueType: "OTHER", description: "" });
        // Refresh to update issue indicators
        await fetchDeliveryOrders();
      } else {
        let errorMessage = "Failed to report issue";
        let errorData = null;
        try {
          const text = await response.text();
          console.log("Raw response text:", text);
          if (text) {
            errorData = JSON.parse(text);
            console.log("Parsed error data:", errorData);
            errorMessage = errorData.error || errorData.details || errorMessage;
          }
        } catch (e) {
          console.error("Failed to parse error response:", e);
        }
        
        if (response.status === 401) {
          errorMessage = "Session expired. Please log in again.";
          // Optionally redirect to login
          // router.push('/login');
        }
        
        toast({
          title: "❌ Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error reporting issue:", error);
      toast({
        title: "❌ Error",
        description: "Network error. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setIsReportingIssue(false);
    }
  };

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const resolveIssue = async () => {
    if (!resolveIssueDialog.issueId || !resolveIssueDialog.resolution.trim()) {
      toast({
        title: "Error",
        description: "Please provide a resolution",
        variant: "destructive",
      });
      return;
    }

    setIsResolvingIssue(true);
    try {
      const response = await fetch(`/api/issues/${resolveIssueDialog.issueId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resolution: resolveIssueDialog.resolution.trim(),
        }),
      });

      if (response.ok) {
        toast({
          title: "✅ Issue Resolved",
          description: "The issue has been resolved successfully",
        });
        setResolveIssueDialog({ open: false, issueId: null, issueDescription: "", issueType: "", resolution: "" });
        // Refresh to update issue status
        await fetchDeliveryOrders();
      } else {
        const data = await response.json();
        toast({
          title: "❌ Error",
          description: data.error || "Failed to resolve issue",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsResolvingIssue(false);
    }
  };

  const getIssueTypeBadge = (type: string) => {
    const typeConfig: any = {
      QUALITY: { label: "Quality", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300" },
      QUANTITY: { label: "Quantity", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" },
      DOCUMENTATION: { label: "Docs", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300" },
      DAMAGE: { label: "Damage", className: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" },
      DELAY: { label: "Delay", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300" },
      OTHER: { label: "Other", className: "bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300" },
    };
    const config = typeConfig[type] || typeConfig.OTHER;
    return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.className}`}>{config.label}</span>;
  };

  const deleteDeliveryOrder = async () => {
    if (!deleteDialog.orderId) return;

    setIsDeletingOrder(true);
    setDeletingOrderId(deleteDialog.orderId); // Track which order is being deleted
    try {
      const response = await fetch(`/api/delivery-orders/${deleteDialog.orderId}/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "✅ Delivery Order Deleted",
          description: `DO #${deleteDialog.orderNumber} has been deleted successfully`,
        });
        
        // Close dialog
        setDeleteDialog({ open: false, orderId: null, orderNumber: "" });
        
        // Refresh the list
        await fetchDeliveryOrders();
      } else {
        const data = await response.json();
        toast({
          title: "❌ Error",
          description: data.error || "Failed to delete delivery order",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Something went wrong while deleting",
        variant: "destructive",
      });
    } finally {
      setIsDeletingOrder(false);
      setDeletingOrderId(null); // Clear the tracking
    }
  };

  const forwardToProjectOffice = async () => {
    const orderId = confirmDialog.orderId;
    if (!orderId) return;
    // Find the order being forwarded
    const orderToForward = deliveryOrders.find(o => o.id === orderId);
    if (!orderToForward) return;

    // Set loading state for this specific order
    setForwardingOrderId(orderId);

    // Optimistic update - immediately update the UI
    setDeliveryOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId 
          ? { ...order, status: 'at_project_office' }
          : order
      )
    );

    // Show immediate feedback
    toast({
      title: "⏳ Forwarding...",
      description: `Forwarding DO #${orderToForward.doNumber} to Project Office & CISF for approval`,
    });

    try {
      const response = await fetch(`/api/delivery-orders/${orderId}/forward`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          toStatus: "at_project_office",
          notes: forwardNote.trim() || "Forwarded to Project Office and CISF for dual approval"
        }),
      });

      if (response.ok) {
        // Close dialog first
        setConfirmDialog({ open: false, orderId: null, orderNumber: "", partyName: "" });
        setForwardNote("");
        
        toast({
          title: "✅ Success",
          description: `DO #${orderToForward.doNumber} forwarded to Project Office & CISF for approval`,
        });
        
        // Refresh data to ensure consistency
        await fetchDeliveryOrders();
        
        // Clear loading state
        setForwardingOrderId(null);
      } else {
        // Revert optimistic update on error
        setDeliveryOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId 
              ? { ...order, status: 'at_area_office' }
              : order
          )
        );
        
        const data = await response.json();
        toast({
          title: "❌ Error",
          description: data.error || "Failed to forward delivery order",
          variant: "destructive",
        });
        
        // Clear loading state
        setForwardingOrderId(null);
      }
    } catch (error) {
      // Revert optimistic update on error
      setDeliveryOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: 'at_area_office' }
            : order
        )
      );
      
      // Clear loading state
      setForwardingOrderId(null);
      
      toast({
        title: "❌ Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const pendingOrders = deliveryOrders.filter(order => 
    (order.status === "at_area_office" || order.status === "created") && 
    !order.issues?.some((issue: any) => issue.status === "OPEN")
  );

  const ordersWithIssues = deliveryOrders.filter(order => 
    (order.status === "at_area_office" || order.status === "created") && 
    order.issues?.some((issue: any) => issue.status === "OPEN")
  );

  // Show DOs that have been forwarded from Area Office
  const forwardedOrders = deliveryOrders.filter(order => 
    order.status === "at_project_office" || 
    order.status === "received_at_project_office" || 
    order.status === "at_road_sale"
  );

  // Helper function to get who forwarded the DO
  const getForwardedBy = (order: any) => {
    const forwardAction = order.workflowHistory?.find((h: any) => 
      h.toStatus === 'at_project_office' && h.fromStatus === 'at_area_office'
    );
    return forwardAction?.actionBy;
  };

  // Get current user info from token
  const [currentUser, setCurrentUser] = useState<any>(null);
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => setCurrentUser(data.user || data))
      .catch(() => {});
  }, []);

  const renderOrdersTable = (orders: any[], emptyMessage?: string) => {
    if (orders.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          {emptyMessage || "No delivery orders found in this category."}
        </div>
      );
    }

    return (
      <>
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <Table>
        <TableHeader>
          <TableRow>
            <TableHead>DO Number</TableHead>
            <TableHead>Party</TableHead>
            <TableHead>Authorized Person</TableHead>
            <TableHead>Valid To</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Issues</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const isExpanded = expandedOrders.has(order.id);
            const openIssues = order.issues?.filter((i: any) => i.status === "OPEN") || [];
            const resolvedIssues = order.issues?.filter((i: any) => i.status === "RESOLVED") || [];
            
            return (
              <React.Fragment key={order.id}>
                <motion.tr
              key={order.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
            >
              <TableCell className="font-medium">{order.doNumber}</TableCell>
              <TableCell>{order.party?.name}</TableCell>
              <TableCell>{order.authorizedPerson}</TableCell>
              <TableCell>{format(new Date(order.validTo), "dd/MM/yyyy")}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  {getStatusBadge(order.status)}
                  {(order.status === "at_project_office" || order.status === "received_at_project_office" || order.status === "at_road_sale") && (
                    <span className="text-xs text-muted-foreground">
                      {(() => {
                        const forwardedBy = getForwardedBy(order);
                        if (!forwardedBy) return "Forwarded";
                        if (currentUser?.id === forwardedBy.id) return "Forwarded by you";
                        return `Forwarded by ${forwardedBy.username}`;
                      })()}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {order.issues?.length > 0 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleOrderExpansion(order.id)}
                    className="flex items-center gap-1 hover:bg-transparent p-0"
                  >
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <span className="text-sm">
                      {openIssues.length} open
                    </span>
                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </Button>
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewDODialog({ open: true, order })}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {order.status === "at_area_office" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setReportIssueDialog({
                            open: true,
                            orderId: order.id,
                            orderNumber: order.doNumber,
                            issueType: "OTHER",
                            description: "",
                          });
                        }}
                        className="text-yellow-600 hover:text-yellow-700"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDeleteDialog({
                            open: true,
                            orderId: order.id,
                            orderNumber: order.doNumber,
                          });
                        }}
                        disabled={deletingOrderId === order.id}
                        className="text-red-600 hover:text-red-700"
                      >
                        {deletingOrderId === order.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </>
                  )}
                  {canForward(order) ? (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => openConfirmDialog(order)}
                      disabled={forwardingOrderId === order.id}
                      className="group"
                    >
                      {forwardingOrderId === order.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Forwarding...
                        </>
                      ) : (
                        <>
                          <Truck className="h-4 w-4 mr-1 group-hover:translate-x-0.5 transition-transform" />
                          Forward
                          <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </Button>
                  ) : (order.status !== "at_area_office" && order.status !== "created") ? (
                    <span className="text-sm text-muted-foreground">Already forwarded</span>
                  ) : null}
                </div>
              </TableCell>
            </motion.tr>
                
                {/* Expandable Issues Section */}
                <AnimatePresence>
                  {isExpanded && order.issues?.length > 0 && (
                    <motion.tr
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <TableCell colSpan={7} className="p-0">
                        <div className="bg-muted/30 p-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-3">
                              <AlertCircle className="h-4 w-4 text-yellow-600" />
                              <span className="font-medium text-sm">Issues for DO #{order.doNumber}</span>
                            </div>
                            
                            {/* Open Issues */}
                            {openIssues.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Open Issues</h4>
                                {openIssues.map((issue: any) => (
                                  <div key={issue.id} className="bg-background rounded-lg p-3 border border-yellow-200 dark:border-yellow-800">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                          {getIssueTypeBadge(issue.issueType || 'OTHER')}
                                          <span className="text-xs text-muted-foreground">
                                            by {issue.reportedBy?.username} • {format(new Date(issue.createdAt), 'dd/MM/yyyy HH:mm')}
                                          </span>
                                        </div>
                                        <p className="text-sm">{issue.description}</p>
                                      </div>
                                      {order.status === "at_area_office" && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            setResolveIssueDialog({
                                              open: true,
                                              issueId: issue.id,
                                              issueDescription: issue.description,
                                              issueType: issue.issueType || 'OTHER',
                                              resolution: "",
                                            });
                                          }}
                                          className="ml-2"
                                        >
                                          <CheckCircle2 className="h-3 w-3 mr-1" />
                                          Resolve
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* Resolved Issues */}
                            {resolvedIssues.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Resolved Issues</h4>
                                {resolvedIssues.map((issue: any) => (
                                  <div key={issue.id} className="bg-background/50 rounded-lg p-3 border border-green-200 dark:border-green-800 opacity-75">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        {getIssueTypeBadge(issue.issueType || 'OTHER')}
                                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                                        <span className="text-xs text-muted-foreground">
                                          by {issue.reportedBy?.username} • Resolved by {issue.resolvedBy?.username}
                                        </span>
                                      </div>
                                      <p className="text-sm line-through text-muted-foreground">{issue.description}</p>
                                      {issue.resolution && (
                                        <p className="text-sm text-green-700 dark:text-green-400">Resolution: {issue.resolution}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </motion.tr>
                  )}
                </AnimatePresence>
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {orders.map((order) => {
            const isExpanded = expandedOrders.has(order.id);
            const openIssues = order.issues?.filter((i: any) => i.status === "OPEN") || [];
            const resolvedIssues = order.issues?.filter((i: any) => i.status === "RESOLVED") || [];
            
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-lg border p-4 space-y-3"
              >
                {/* Header with DO Number and Status */}
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-base">{order.doNumber}</p>
                    <p className="text-sm text-muted-foreground">{order.party?.name}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {getStatusBadge(order.status)}
                    {(order.status === "at_project_office" || order.status === "received_at_project_office" || order.status === "at_road_sale") && (
                      <span className="text-xs text-muted-foreground">
                        {(() => {
                          const forwardedBy = getForwardedBy(order);
                          if (!forwardedBy) return "Forwarded";
                          if (currentUser?.id === forwardedBy.id) return "by you";
                          return `by ${forwardedBy.username}`;
                        })()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Auth Person:</span>
                    <span className="font-medium">{order.authorizedPerson}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valid To:</span>
                    <span className="font-medium">{format(new Date(order.validTo), "dd/MM/yyyy")}</span>
                  </div>
                </div>

                {/* Issues Section */}
                {order.issues?.length > 0 && (
                  <div className="pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleOrderExpansion(order.id)}
                      className="w-full justify-between p-0 h-auto"
                    >
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        <span className="text-sm">{openIssues.length} open issues</span>
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                    
                    {/* Expanded Issues */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-3 space-y-2"
                        >
                          {openIssues.map((issue: any) => (
                            <div key={issue.id} className="bg-muted/50 rounded p-2 space-y-1">
                              <div className="flex items-center gap-2">
                                {getIssueTypeBadge(issue.issueType || 'OTHER')}
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(issue.createdAt), 'dd/MM HH:mm')}
                                </span>
                              </div>
                              <p className="text-sm">{issue.description}</p>
                              {order.status === "at_area_office" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setResolveIssueDialog({
                                      open: true,
                                      issueId: issue.id,
                                      issueDescription: issue.description,
                                      issueType: issue.issueType || 'OTHER',
                                      resolution: "",
                                    });
                                  }}
                                  className="w-full mt-2"
                                >
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Resolve
                                </Button>
                              )}
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewDODialog({ open: true, order })}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4" />
                    <span className="ml-1">View</span>
                  </Button>
                  {order.status === "at_area_office" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setReportIssueDialog({
                            open: true,
                            orderId: order.id,
                            orderNumber: order.doNumber,
                            issueType: "OTHER",
                            description: "",
                          });
                        }}
                        className="flex-1"
                      >
                        <Plus className="h-3 w-3" />
                        <span className="ml-1">Issue</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDeleteDialog({
                            open: true,
                            orderId: order.id,
                            orderNumber: order.doNumber,
                          });
                        }}
                        disabled={deletingOrderId === order.id}
                        className="text-red-600 hover:text-red-700"
                      >
                        {deletingOrderId === order.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </>
                  )}
                  {canForward(order) && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => openConfirmDialog(order)}
                      disabled={forwardingOrderId === order.id}
                      className="flex-1"
                    >
                      {forwardingOrderId === order.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="ml-1">...</span>
                        </>
                      ) : (
                        <>
                          <Truck className="h-4 w-4" />
                          <span className="ml-1">Forward</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </>
    );
  };

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="mb-4"
          >
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                    <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Your delivery order has been created!</h3>
                    <p className="text-sm text-muted-foreground">
                      You can now process and forward it to the Project Office.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
        
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              <CardTitle>Process Delivery Orders</CardTitle>
            </div>
            <CardDescription>
              Review and forward delivery orders to Project Office
            </CardDescription>
          </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pending" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Ready to Forward
                  {pendingOrders.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {pendingOrders.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="issues" className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  With Issues
                  {ordersWithIssues.length > 0 && (
                    <Badge variant="destructive" className="ml-1">
                      {ordersWithIssues.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="forwarded" className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Forwarded
                  {forwardedOrders.length > 0 && (
                    <Badge variant="outline" className="ml-1">
                      {forwardedOrders.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="pending" className="mt-4">
                {renderOrdersTable(pendingOrders, "No delivery orders ready to forward. Orders with unresolved issues must be resolved first.")}
              </TabsContent>
              <TabsContent value="issues" className="mt-4">
                {renderOrdersTable(ordersWithIssues, "No delivery orders with open issues. All issues have been resolved.")}
              </TabsContent>
              <TabsContent value="forwarded" className="mt-4">
                {renderOrdersTable(forwardedOrders, "No delivery orders have been forwarded yet.")}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
      </motion.div>

      {/* Forward Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => {
        if (!open && !forwardingOrderId) {
          setConfirmDialog({ open: false, orderId: null, orderNumber: "", partyName: "" });
          setForwardNote("");
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <motion.div
                  initial={{ rotate: -180, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <Send className="h-5 w-5 text-primary" />
                </motion.div>
                Forward for Dual Approval
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to forward this delivery order to Project Office & CISF for dual approval?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-4">
              {/* Order Details */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="bg-muted/50 rounded-lg p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">DO Number:</span>
                  <span className="font-medium">{confirmDialog.orderNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Party:</span>
                  <span className="font-medium">{confirmDialog.partyName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Destination:</span>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-xs">
                      Project Office
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      CISF
                    </Badge>
                  </div>
                </div>
              </motion.div>

              {/* Notes Field */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="space-y-2"
              >
                <Label htmlFor="forward-note" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Add Note (Optional)
                </Label>
                <Textarea
                  id="forward-note"
                  placeholder="Add any notes or instructions for the Project Office & CISF..."
                  value={forwardNote}
                  onChange={(e) => setForwardNote(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
              </motion.div>

              {/* Info Message */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg"
              >
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Once forwarded, both Project Office and CISF must approve this delivery order before it can proceed to Road Sale.
                  </p>
                </div>
              </motion.div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setConfirmDialog({ open: false, orderId: null, orderNumber: "", partyName: "" });
                  setForwardNote("");
                }}
                disabled={forwardingOrderId !== null}
              >
                Cancel
              </Button>
              <Button
                onClick={forwardToProjectOffice}
                disabled={forwardingOrderId !== null}
                className="relative overflow-hidden"
              >
                {forwardingOrderId ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Forwarding...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Confirm Forward
                  </>
                )}
                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0"
                  initial={{ x: "-100%" }}
                  animate={forwardingOrderId ? { x: "100%" } : {}}
                  transition={{ duration: 1, repeat: forwardingOrderId ? Infinity : 0 }}
                />
              </Button>
            </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Report Issue Dialog */}
      <Dialog open={reportIssueDialog.open} onOpenChange={(open) => {
        if (!isReportingIssue) {
          setReportIssueDialog({ ...reportIssueDialog, open });
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Report Issue
              </DialogTitle>
              <DialogDescription>
                Report an issue for DO #{reportIssueDialog.orderNumber}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-4">
              <div className="space-y-2">
                <Label htmlFor="issue-type">Issue Type</Label>
                <Select
                  value={reportIssueDialog.issueType}
                  onValueChange={(value) => setReportIssueDialog({ ...reportIssueDialog, issueType: value })}
                >
                  <SelectTrigger id="issue-type">
                    <SelectValue placeholder="Select issue type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="QUALITY">Quality Issue</SelectItem>
                    <SelectItem value="QUANTITY">Quantity Mismatch</SelectItem>
                    <SelectItem value="DOCUMENTATION">Documentation Error</SelectItem>
                    <SelectItem value="DAMAGE">Damage/Defect</SelectItem>
                    <SelectItem value="DELAY">Delay/Timeline Issue</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="issue-description">Issue Description</Label>
                <Textarea
                  id="issue-description"
                  placeholder="Describe the issue in detail..."
                  value={reportIssueDialog.description}
                  onChange={(e) => setReportIssueDialog({ ...reportIssueDialog, description: e.target.value })}
                  className="resize-none"
                  rows={4}
                />
              </div>

              <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Reporting an issue will prevent this DO from being forwarded until the issue is resolved.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setReportIssueDialog({ open: false, orderId: null, orderNumber: "", issueType: "OTHER", description: "" });
                }}
                disabled={isReportingIssue}
              >
                Cancel
              </Button>
              <Button
                onClick={reportIssue}
                disabled={isReportingIssue || !reportIssueDialog.description.trim()}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                {isReportingIssue ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Reporting...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Report Issue
                  </>
                )}
              </Button>
            </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Resolve Issue Dialog */}
      <Dialog open={resolveIssueDialog.open} onOpenChange={(open) => {
        if (!isResolvingIssue) {
          setResolveIssueDialog({ ...resolveIssueDialog, open });
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Resolve Issue
              </DialogTitle>
              <DialogDescription>
                Provide a resolution for this issue
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-4">
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  {getIssueTypeBadge(resolveIssueDialog.issueType)}
                </div>
                <p className="text-sm font-medium">Issue Description:</p>
                <p className="text-sm text-muted-foreground">{resolveIssueDialog.issueDescription}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resolution">Resolution Details</Label>
                <Textarea
                  id="resolution"
                  placeholder="Describe how the issue was resolved..."
                  value={resolveIssueDialog.resolution}
                  onChange={(e) => setResolveIssueDialog({ ...resolveIssueDialog, resolution: e.target.value })}
                  className="resize-none"
                  rows={4}
                />
              </div>

              <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Once resolved, this issue will be marked as completed and the DO can be forwarded if no other open issues remain.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setResolveIssueDialog({ open: false, issueId: null, issueDescription: "", issueType: "", resolution: "" });
                }}
                disabled={isResolvingIssue}
              >
                Cancel
              </Button>
              <Button
                onClick={resolveIssue}
                disabled={isResolvingIssue || !resolveIssueDialog.resolution.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                {isResolvingIssue ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resolving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Resolve Issue
                  </>
                )}
              </Button>
            </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* View DO Dialog */}
      <Dialog open={viewDODialog.open} onOpenChange={(open) => {
        setViewDODialog({ ...viewDODialog, open });
      }}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Delivery Order Details
            </DialogTitle>
            <DialogDescription>
              DO #{viewDODialog.order?.doNumber}
            </DialogDescription>
          </DialogHeader>

          {viewDODialog.order && (
            <div className="space-y-6 my-4">
              {/* Basic Information */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4 bg-muted/50 rounded-lg p-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">DO Number</Label>
                    <p className="font-medium">{viewDODialog.order.doNumber}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <div className="mt-1">{getStatusBadge(viewDODialog.order.status)}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Party</Label>
                    <p className="font-medium">{viewDODialog.order.party?.name}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Authorized Person</Label>
                    <p className="font-medium">{viewDODialog.order.authorizedPerson}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Valid From</Label>
                    <p className="font-medium">{format(new Date(viewDODialog.order.validFrom), 'dd/MM/yyyy')}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Valid To</Label>
                    <p className="font-medium">{format(new Date(viewDODialog.order.validTo), 'dd/MM/yyyy')}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Created By</Label>
                    <p className="font-medium">{viewDODialog.order.createdBy?.username}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Created On</Label>
                    <p className="font-medium">{format(new Date(viewDODialog.order.createdAt), 'dd/MM/yyyy HH:mm')}</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {viewDODialog.order.notes && (
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Notes</h3>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm">{viewDODialog.order.notes}</p>
                  </div>
                </div>
              )}

              {/* Issues */}
              {viewDODialog.order.issues && viewDODialog.order.issues.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
                    Issues ({viewDODialog.order.issues.length})
                  </h3>
                  <div className="space-y-2">
                    {viewDODialog.order.issues.map((issue: any) => (
                      <div 
                        key={issue.id} 
                        className={`rounded-lg p-3 border ${
                          issue.status === 'OPEN' 
                            ? 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800' 
                            : 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              {getIssueTypeBadge(issue.issueType || 'OTHER')}
                              <Badge variant={issue.status === 'OPEN' ? 'destructive' : 'outline'} className={issue.status === 'RESOLVED' ? 'text-green-600' : ''}>
                                {issue.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                by {issue.reportedBy?.username} • {format(new Date(issue.createdAt), 'dd/MM/yyyy HH:mm')}
                              </span>
                            </div>
                            <p className="text-sm">{issue.description}</p>
                            {issue.resolution && (
                              <div className="mt-2 pt-2 border-t">
                                <p className="text-sm text-green-700 dark:text-green-400">
                                  <span className="font-medium">Resolution:</span> {issue.resolution}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Resolved by {issue.resolvedBy?.username}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Statistics */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Statistics</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold">{viewDODialog.order.issues?.filter((i: any) => i.status === 'OPEN').length || 0}</p>
                    <p className="text-xs text-muted-foreground">Open Issues</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold">{viewDODialog.order.issues?.filter((i: any) => i.status === 'RESOLVED').length || 0}</p>
                    <p className="text-xs text-muted-foreground">Resolved Issues</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold">{viewDODialog.order.issues?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Total Issues</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setViewDODialog({ open: false, order: null })}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !isDeletingOrder && setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Delivery Order
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Are you sure you want to delete delivery order <strong>#{deleteDialog.orderNumber}</strong>?
                </p>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    ⚠️ This action cannot be undone
                  </p>
                  <ul className="text-sm text-red-700 dark:text-red-300 space-y-1 ml-5 mt-2">
                    <li className="list-disc">The delivery order will be permanently deleted</li>
                    <li className="list-disc">All associated issues will also be deleted</li>
                    <li className="list-disc">This action cannot be reversed</li>
                  </ul>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Note:</strong> You can only delete delivery orders that haven't been forwarded yet.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingOrder}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteDeliveryOrder}
              disabled={isDeletingOrder}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeletingOrder ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete DO
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}