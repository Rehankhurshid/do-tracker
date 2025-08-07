"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Package, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Eye, 
  Plus, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Loader2,
  CheckCircle2,
  Truck,
  Calendar,
  Building
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

export default function RoadSaleProcessPage() {
  const { toast } = useToast();
  const [deliveryOrders, setDeliveryOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  
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
  
  const [viewDODialog, setViewDODialog] = useState<{
    open: boolean;
    order: any | null;
  }>({ open: false, order: null });

  useEffect(() => {
    fetchDeliveryOrders();
  }, []);

  const fetchDeliveryOrders = async () => {
    try {
      const response = await fetch("/api/delivery-orders");
      if (response.ok) {
        const data = await response.json();
        // Filter for Road Sale - only show orders that reached road sale
        const roadSaleOrders = data.filter((order: any) => 
          order.status === 'at_road_sale'
        );
        setDeliveryOrders(roadSaleOrders);
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

  // Filter orders based on issues
  const allOrders = deliveryOrders;
  const ordersWithIssues = deliveryOrders.filter(order => 
    order.issues?.some((issue: any) => issue.status === "OPEN")
  );
  const ordersWithoutIssues = deliveryOrders.filter(order => 
    !order.issues?.length || order.issues.every((issue: any) => issue.status === "RESOLVED")
  );

  const renderOrdersTable = (orders: any[]) => {
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
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Authorized:</span>
                    <span className="font-medium">{order.authorizedPerson}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Received:</span>
                    <span className="font-medium">{format(new Date(order.updatedAt), "dd/MM/yyyy")}</span>
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
                    className="flex-1 text-yellow-600 hover:text-yellow-700"
                  >
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Report Issue
                  </Button>
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
                <TableHead>Received Date</TableHead>
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
                      <TableCell>{format(new Date(order.updatedAt), "dd/MM/yyyy")}</TableCell>
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
                          <TableCell colSpan={6} className="p-0">
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
              <Truck className="h-5 w-5" />
              <CardTitle>Received Delivery Orders</CardTitle>
            </div>
            <CardDescription>
              View completed delivery orders and report any issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Loading delivery orders...</p>
              </div>
            ) : (
              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="all" className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    All Orders ({allOrders.length})
                  </TabsTrigger>
                  <TabsTrigger value="with-issues" className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    With Issues ({ordersWithIssues.length})
                  </TabsTrigger>
                  <TabsTrigger value="no-issues" className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    No Issues ({ordersWithoutIssues.length})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-4">
                  {renderOrdersTable(allOrders)}
                </TabsContent>
                <TabsContent value="with-issues" className="mt-4">
                  {renderOrdersTable(ordersWithIssues)}
                </TabsContent>
                <TabsContent value="no-issues" className="mt-4">
                  {renderOrdersTable(ordersWithoutIssues)}
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
                    <Badge variant="default" className="bg-green-600 mt-1">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      At Road Sale
                    </Badge>
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
                    <p className="text-sm text-muted-foreground">Received At</p>
                    <p className="font-medium">{format(new Date(viewDODialog.order.updatedAt), "dd/MM/yyyy HH:mm")}</p>
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
    </div>
  );
}