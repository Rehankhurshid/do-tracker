"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Eye, 
  Truck, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  Package, 
  ArrowRight, 
  Loader2, 
  Send, 
  MessageSquare, 
  Plus, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2,
  PackageCheck,
  FileCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

export default function ProjectOfficeProcessPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [deliveryOrders, setDeliveryOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [receivingOrderId, setReceivingOrderId] = useState<string | null>(null);
  
  // Issue management states
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [reportIssueDialog, setReportIssueDialog] = useState<{
    open: boolean;
    orderId: string | null;
    orderNumber: string;
    issueType: string;
    description: string;
  }>({ open: false, orderId: null, orderNumber: "", issueType: "OTHER", description: "" });
  const [isReportingIssue, setIsReportingIssue] = useState(false);
  
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
  
  // Approval dialog state
  const [approvalDialog, setApprovalDialog] = useState<{
    open: boolean;
    orderId: string;
    orderNumber: string;
    notes: string;
  }>({ open: false, orderId: "", orderNumber: "", notes: "" });
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    fetchDeliveryOrders();
  }, []);

  const fetchDeliveryOrders = async () => {
    try {
      const response = await fetch("/api/delivery-orders");
      if (response.ok) {
        const data = await response.json();
        // API already filters based on PROJECT_OFFICE role - no need for client-side filtering
        setDeliveryOrders(data);
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
  };

  const receiveOrder = async (orderId: string) => {
    setReceivingOrderId(orderId);
    try {
      const response = await fetch(`/api/delivery-orders/${orderId}/receive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        toast({
          title: "✅ Order Received",
          description: "Delivery order has been marked as received",
        });
        await fetchDeliveryOrders();
      } else {
        const data = await response.json();
        toast({
          title: "❌ Error",
          description: data.error || "Failed to receive delivery order",
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
      setReceivingOrderId(null);
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

  const reportIssue = async () => {
    if (!reportIssueDialog.orderId || !reportIssueDialog.description.trim()) {
      toast({
        title: "Error",
        description: "Please provide a description for the issue",
        variant: "destructive",
      });
      return;
    }

    setIsReportingIssue(true);
    try {
      const response = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryOrderId: reportIssueDialog.orderId,
          issueType: reportIssueDialog.issueType,
          description: reportIssueDialog.description.trim(),
        }),
      });

      if (response.ok) {
        toast({
          title: "✅ Issue Reported",
          description: `Issue reported for DO #${reportIssueDialog.orderNumber}`,
        });
        setReportIssueDialog({ open: false, orderId: null, orderNumber: "", issueType: "OTHER", description: "" });
        await fetchDeliveryOrders();
      } else {
        const data = await response.json();
        toast({
          title: "❌ Error",
          description: data.error || "Failed to report issue",
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
      setIsReportingIssue(false);
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const response = await fetch(`/api/delivery-orders/${approvalDialog.orderId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "PROJECT_OFFICE",
          notes: approvalDialog.notes,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "✅ Order Approved",
          description: `DO #${approvalDialog.orderNumber} has been approved by Project Office`,
        });
        
        // Update local state immediately
        setDeliveryOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === approvalDialog.orderId 
              ? { ...order, projectApproved: true, status: result.deliveryOrder?.status || order.status }
              : order
          )
        );
        
        setApprovalDialog({ open: false, orderId: "", orderNumber: "", notes: "" });
        
        // Fetch fresh data
        setTimeout(() => {
          fetchDeliveryOrders();
        }, 500);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to approve order",
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
      setIsApproving(false);
    }
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

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      at_project_office: { label: "Pending Receipt", variant: "secondary" },
      received_at_project_office: { label: "Received", variant: "default" },
      at_road_sale: { label: "Forwarded to Road Sale", variant: "success" },
    };

    const config = statusConfig[status] || { label: status, variant: "default" };
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
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


  const pendingReceipt = deliveryOrders.filter(order => order.status === "at_project_office");
  const receivedOrders = deliveryOrders.filter(order => 
    order.status === "received_at_project_office" || 
    order.status === "project_approved" || 
    order.status === "cisf_approved" || 
    order.status === "both_approved"
  );
  const forwardedOrders = deliveryOrders.filter(order => order.status === "at_road_sale");

  const renderOrdersTable = (orders: any[], showReceiveButton: boolean = false) => {
    if (orders.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No delivery orders found in this category.
        </div>
      );
    }

    return (
      <>
        {/* Mobile view - Cards */}
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
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-card rounded-lg border p-4 space-y-3"
              >
                {/* Header with DO Number and Status */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-base">{order.doNumber}</p>
                    <p className="text-sm text-muted-foreground">{order.party?.name}</p>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    {getStatusBadge(order.status)}
                    <div className="flex gap-1">
                      {order.projectApproved && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          PO
                        </Badge>
                      )}
                      {order.cisfApproved && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          CISF
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Authorized:</span>
                    <span className="font-medium">{order.authorizedPerson}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valid To:</span>
                    <span className="font-medium">{format(new Date(order.validTo), "dd/MM/yyyy")}</span>
                  </div>
                  {order.issues?.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleOrderExpansion(order.id)}
                      className="w-full flex items-center justify-between p-2 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        <span>{openIssues.length} open issue{openIssues.length !== 1 ? 's' : ''}</span>
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  )}
                </div>

                {/* Expandable Issues Section */}
                <AnimatePresence>
                  {isExpanded && order.issues?.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-2 pt-2 border-t"
                    >
                      {/* Open Issues */}
                      {openIssues.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground uppercase">Open Issues</p>
                          {openIssues.map((issue: any) => (
                            <div key={issue.id} className="bg-yellow-50 dark:bg-yellow-900/20 rounded p-2 space-y-1">
                              <div className="flex items-center gap-2">
                                {getIssueTypeBadge(issue.issueType || 'OTHER')}
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(issue.createdAt), 'dd/MM HH:mm')}
                                </span>
                              </div>
                              <p className="text-sm">{issue.description}</p>
                              {order.status === "received_at_project_office" && (
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
                                  className="w-full mt-1"
                                >
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Resolve
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Resolved Issues */}
                      {resolvedIssues.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground uppercase">Resolved Issues</p>
                          {resolvedIssues.map((issue: any) => (
                            <div key={issue.id} className="bg-green-50 dark:bg-green-900/20 rounded p-2 opacity-75">
                              <div className="flex items-center gap-2">
                                {getIssueTypeBadge(issue.issueType || 'OTHER')}
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                              </div>
                              <p className="text-sm line-through text-muted-foreground">{issue.description}</p>
                              {issue.resolution && (
                                <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                                  Resolution: {issue.resolution}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewDODialog({ open: true, order })}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  
                  {showReceiveButton && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => receiveOrder(order.id)}
                      disabled={receivingOrderId === order.id}
                      className="flex-1"
                    >
                      {receivingOrderId === order.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Receiving
                        </>
                      ) : (
                        <>
                          <PackageCheck className="h-4 w-4 mr-1" />
                          Receive
                        </>
                      )}
                    </Button>
                  )}
                  
                  {(order.status === "received_at_project_office" || order.status === "cisf_approved") && !order.projectApproved && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        setApprovalDialog({
                          open: true,
                          orderId: order.id,
                          orderNumber: order.doNumber,
                          notes: "",
                        });
                      }}
                      disabled={isApproving}
                      className="flex-1"
                    >
                      <FileCheck className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  )}
                  
                  {order.status === "received_at_project_office" && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
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
                        <Plus className="h-4 w-4" />
                      </Button>
                      
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Desktop view - Table */}
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
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="border-b transition-colors hover:bg-muted/50"
                >
                  <TableCell className="font-medium">{order.doNumber}</TableCell>
                  <TableCell>{order.party?.name}</TableCell>
                  <TableCell>{order.authorizedPerson}</TableCell>
                  <TableCell>{format(new Date(order.validTo), "dd/MM/yyyy")}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
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
                      
                      {showReceiveButton && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => receiveOrder(order.id)}
                          disabled={receivingOrderId === order.id}
                        >
                          {receivingOrderId === order.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              Receiving...
                            </>
                          ) : (
                            <>
                              <PackageCheck className="h-4 w-4 mr-1" />
                              Receive
                            </>
                          )}
                        </Button>
                      )}
                      
                      {order.status === "received_at_project_office" && (
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
                      )}
                      
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
                                      {order.status === "received_at_project_office" && (
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
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              <CardTitle>Process Delivery Orders</CardTitle>
            </div>
            <CardDescription>
              Receive and forward delivery orders to Road Sale
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="pending" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Pending Receipt ({pendingReceipt.length})
                  </TabsTrigger>
                  <TabsTrigger value="received" className="flex items-center gap-2">
                    <PackageCheck className="h-4 w-4" />
                    Received ({receivedOrders.length})
                  </TabsTrigger>
                  <TabsTrigger value="forwarded" className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Forwarded ({forwardedOrders.length})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="pending" className="mt-4">
                  {renderOrdersTable(pendingReceipt, true)}
                </TabsContent>
                <TabsContent value="received" className="mt-4">
                  {renderOrdersTable(receivedOrders)}
                </TabsContent>
                <TabsContent value="forwarded" className="mt-4">
                  {renderOrdersTable(forwardedOrders)}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </motion.div>


      {/* Report Issue Dialog */}
      <Dialog open={reportIssueDialog.open} onOpenChange={(open) => {
        if (!isReportingIssue) {
          setReportIssueDialog({ ...reportIssueDialog, open });
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
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
              <select
                id="issue-type"
                value={reportIssueDialog.issueType}
                onChange={(e) => setReportIssueDialog({ ...reportIssueDialog, issueType: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="QUALITY">Quality Issue</option>
                <option value="QUANTITY">Quantity Mismatch</option>
                <option value="DOCUMENTATION">Documentation Error</option>
                <option value="DAMAGE">Damage/Defect</option>
                <option value="DELAY">Delay/Timeline Issue</option>
                <option value="OTHER">Other</option>
              </select>
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
        </DialogContent>
      </Dialog>

      {/* Resolve Issue Dialog */}
      <Dialog open={resolveIssueDialog.open} onOpenChange={(open) => {
        if (!isResolvingIssue) {
          setResolveIssueDialog({ ...resolveIssueDialog, open });
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
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
        </DialogContent>
      </Dialog>

      {/* View DO Dialog */}
      <Dialog open={viewDODialog.open} onOpenChange={(open) => setViewDODialog({ open, order: viewDODialog.order })}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[600px] max-h-[80vh] overflow-y-auto mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Delivery Order Details
            </DialogTitle>
            <DialogDescription>
              View complete details of DO #{viewDODialog.order?.doNumber}
            </DialogDescription>
          </DialogHeader>

          {viewDODialog.order && (
            <div className="space-y-6 my-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Basic Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">DO Number</p>
                    <p className="font-medium">{viewDODialog.order.doNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="mt-1">{getStatusBadge(viewDODialog.order.status)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Party</p>
                    <p className="font-medium">{viewDODialog.order.party?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Authorized Person</p>
                    <p className="font-medium">{viewDODialog.order.authorizedPerson}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valid From</p>
                    <p className="font-medium">{format(new Date(viewDODialog.order.validFrom), "dd/MM/yyyy")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valid To</p>
                    <p className="font-medium">{format(new Date(viewDODialog.order.validTo), "dd/MM/yyyy")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created By</p>
                    <p className="font-medium">{viewDODialog.order.createdBy?.username}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created At</p>
                    <p className="font-medium">{format(new Date(viewDODialog.order.createdAt), "dd/MM/yyyy HH:mm")}</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {viewDODialog.order.notes && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Notes</h3>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm">{viewDODialog.order.notes}</p>
                  </div>
                </div>
              )}

              {/* Issues */}
              {viewDODialog.order.issues && viewDODialog.order.issues.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Issues</h3>
                  <div className="space-y-2">
                    {viewDODialog.order.issues.map((issue: any) => (
                      <div 
                        key={issue.id} 
                        className={`border rounded-lg p-3 ${
                          issue.status === 'OPEN' 
                            ? 'border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-900/20' 
                            : 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/20'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {getIssueTypeBadge(issue.issueType || 'OTHER')}
                              <Badge variant={issue.status === 'OPEN' ? 'destructive' : 'outline'} className={issue.status === 'RESOLVED' ? 'text-green-600' : ''}>
                                {issue.status === 'OPEN' ? 'Open' : 'Resolved'}
                              </Badge>
                            </div>
                            <p className="text-sm">{issue.description}</p>
                            <p className="text-xs text-muted-foreground">
                              Reported by {issue.reportedBy?.username} on {format(new Date(issue.createdAt), 'dd/MM/yyyy HH:mm')}
                            </p>
                            {issue.status === 'RESOLVED' && issue.resolution && (
                              <div className="mt-2 pt-2 border-t">
                                <p className="text-sm text-green-700 dark:text-green-400">
                                  <span className="font-medium">Resolution:</span> {issue.resolution}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Resolved by {issue.resolvedBy?.username} on {issue.resolvedAt && format(new Date(issue.resolvedAt), 'dd/MM/yyyy HH:mm')}
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
              <div className="space-y-2">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Statistics</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold">{viewDODialog.order.issues?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Total Issues</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">
                      {viewDODialog.order.issues?.filter((i: any) => i.status === 'OPEN').length || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Open Issues</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {viewDODialog.order.issues?.filter((i: any) => i.status === 'RESOLVED').length || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Resolved</p>
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

      {/* Approval Dialog */}
      <Dialog open={approvalDialog.open} onOpenChange={(open) => !isApproving && setApprovalDialog({ ...approvalDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Delivery Order</DialogTitle>
            <DialogDescription>
              Approve DO #{approvalDialog.orderNumber} for Project Office
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="approval-notes">Approval Notes (Optional)</Label>
              <Textarea
                id="approval-notes"
                placeholder="Add any approval notes..."
                value={approvalDialog.notes}
                onChange={(e) => setApprovalDialog({ ...approvalDialog, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setApprovalDialog({ open: false, orderId: "", orderNumber: "", notes: "" })} 
              disabled={isApproving}
            >
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={isApproving}>
              {isApproving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve Order
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}