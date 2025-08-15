"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Shield, 
  Package, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  ChevronRight,
  Loader2,
  Search,
  Filter,
  Eye,
  MessageSquare,
  CheckSquare,
  Truck
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CISFProcessPage() {
  const { toast } = useToast();
  const [deliveryOrders, setDeliveryOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDO, setSelectedDO] = useState<any>(null);
  
  // Issue Dialog State
  const [issueDialog, setIssueDialog] = useState({
    open: false,
    doId: "",
    doNumber: "",
  });
  const [issueForm, setIssueForm] = useState({
    issueType: "OTHER",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Approval Dialog State
  const [approvalDialog, setApprovalDialog] = useState({
    open: false,
    doId: "",
    doNumber: "",
  });
  const [approvalNotes, setApprovalNotes] = useState("");

  useEffect(() => {
    fetchDeliveryOrders();
  }, []);

  const fetchDeliveryOrders = async () => {
    try {
      const response = await fetch("/api/delivery-orders");
      if (response.ok) {
        const data = await response.json();
        // API already filters based on CISF role - no need for client-side filtering
        setDeliveryOrders(data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch delivery orders",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/delivery-orders/${approvalDialog.doId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "CISF",
          notes: approvalNotes,
        }),
      });

      if (response.ok) {
        const updatedOrder = await response.json();
        toast({
          title: "✅ Order Approved",
          description: `DO #${approvalDialog.doNumber} has been approved by CISF`,
        });
        setApprovalDialog({ open: false, doId: "", doNumber: "" });
        setApprovalNotes("");
        
        // Update the order in the local state immediately for instant feedback
        setDeliveryOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === approvalDialog.doId 
              ? { ...order, cisfApproved: true, status: updatedOrder.deliveryOrder?.status || order.status }
              : order
          )
        );
        
        // Also fetch fresh data from server
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
      setIsSubmitting(false);
    }
  };

  const handleReportIssue = async () => {
    if (!issueForm.description.trim()) {
      toast({
        title: "Error",
        description: "Please provide issue description",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryOrderId: issueDialog.doId,
          issueType: issueForm.issueType,
          description: issueForm.description,
        }),
      });

      if (response.ok) {
        toast({
          title: "⚠️ Issue Reported",
          description: `Issue reported for DO #${issueDialog.doNumber}`,
        });
        setIssueDialog({ open: false, doId: "", doNumber: "" });
        setIssueForm({ issueType: "OTHER", description: "" });
        fetchDeliveryOrders();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to report issue",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (order: any) => {
    if (order.cisfApproved) {
      return <Badge className="bg-green-100 text-green-700">CISF Approved</Badge>;
    }
    if (order.projectApproved && !order.cisfApproved) {
      return <Badge className="bg-yellow-100 text-yellow-700">Awaiting CISF Approval</Badge>;
    }
    if (!order.projectApproved && !order.cisfApproved) {
      return <Badge className="bg-blue-100 text-blue-700">Pending Both Approvals</Badge>;
    }
    return <Badge variant="outline">Pending</Badge>;
  };

  const filteredOrders = deliveryOrders.filter(order => {
    const matchesSearch = order.doNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.party?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "pending") {
      return matchesSearch && !order.cisfApproved;
    } else if (activeTab === "approved") {
      return matchesSearch && order.cisfApproved;
    }
    return matchesSearch;
  });

  const pendingOrders = deliveryOrders.filter(order => !order.cisfApproved);
  const approvedOrders = deliveryOrders.filter(order => order.cisfApproved);

  return (
    <div className="container mx-auto py-6 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <CardTitle>CISF - Process Delivery Orders</CardTitle>
              </div>
              <Badge variant="outline" className="text-lg px-3 py-1">
                {pendingOrders.length} Pending Approval
              </Badge>
            </div>
            <CardDescription>
              Review and approve delivery orders or report security concerns
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by DO number or party name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All ({deliveryOrders.length})</TabsTrigger>
                <TabsTrigger value="pending">
                  Pending ({pendingOrders.length})
                </TabsTrigger>
                <TabsTrigger value="approved">
                  Approved ({approvedOrders.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                {isLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p className="text-muted-foreground">Loading orders...</p>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No delivery orders found.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-3">
                      {filteredOrders.map((order) => (
                        <Card key={order.id} className="p-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold">DO #{order.doNumber}</p>
                                <p className="text-sm text-muted-foreground">{order.party?.name}</p>
                              </div>
                              <div className="flex flex-col gap-1 items-end">
                                {getStatusBadge(order)}
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
                            
                            <div className="text-sm space-y-1">
                              <p>Authorized: {order.authorizedPerson}</p>
                              <p>Valid: {format(new Date(order.validFrom), 'dd/MM')} - {format(new Date(order.validTo), 'dd/MM/yyyy')}</p>
                            </div>

                            {order.projectApproved && (
                              <Badge variant="outline" className="text-xs">
                                ✓ Project Office Approved
                              </Badge>
                            )}

                            
                            {!order.cisfApproved && (
                              <div className="flex gap-2 pt-2">
                                <Button
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => {
                                    setApprovalDialog({
                                      open: true,
                                      doId: order.id,
                                      doNumber: order.doNumber,
                                    });
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => {
                                    setIssueDialog({
                                      open: true,
                                      doId: order.id,
                                      doNumber: order.doNumber,
                                    });
                                  }}
                                >
                                  <AlertCircle className="h-4 w-4 mr-1" />
                                  Report Issue
                                </Button>
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>DO Number</TableHead>
                            <TableHead>Party</TableHead>
                            <TableHead>Authorized Person</TableHead>
                            <TableHead>Valid Period</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Other Approval</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredOrders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell className="font-medium">{order.doNumber}</TableCell>
                              <TableCell>{order.party?.name}</TableCell>
                              <TableCell>{order.authorizedPerson}</TableCell>
                              <TableCell>
                                {format(new Date(order.validFrom), 'dd/MM')} - {format(new Date(order.validTo), 'dd/MM/yyyy')}
                              </TableCell>
                              <TableCell>{getStatusBadge(order)}</TableCell>
                              <TableCell>
                                {order.projectApproved ? (
                                  <Badge variant="outline" className="text-green-600">
                                    <CheckSquare className="h-3 w-3 mr-1" />
                                    Project Office
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-gray-500">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Project Office
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  {!order.cisfApproved && (
                                    <>
                                      <Button
                                        size="sm"
                                        onClick={() => {
                                          setApprovalDialog({
                                            open: true,
                                            doId: order.id,
                                            doNumber: order.doNumber,
                                          });
                                        }}
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setIssueDialog({
                                            open: true,
                                            doId: order.id,
                                            doNumber: order.doNumber,
                                          });
                                        }}
                                      >
                                        <AlertCircle className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setSelectedDO(order)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      {/* Approval Dialog */}
      <Dialog open={approvalDialog.open} onOpenChange={(open) => !isSubmitting && setApprovalDialog({ ...approvalDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Delivery Order</DialogTitle>
            <DialogDescription>
              Approve DO #{approvalDialog.doNumber} for security clearance
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="approval-notes">Approval Notes (Optional)</Label>
              <Textarea
                id="approval-notes"
                placeholder="Add any security clearance notes..."
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialog({ open: false, doId: "", doNumber: "" })} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={isSubmitting}>
              {isSubmitting ? (
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

      {/* Issue Dialog */}
      <Dialog open={issueDialog.open} onOpenChange={(open) => !isSubmitting && setIssueDialog({ ...issueDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Security Issue</DialogTitle>
            <DialogDescription>
              Report a security concern for DO #{issueDialog.doNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="issue-type">Issue Type</Label>
              <Select value={issueForm.issueType} onValueChange={(value) => setIssueForm({ ...issueForm, issueType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SECURITY">Security Concern</SelectItem>
                  <SelectItem value="DOCUMENTATION">Documentation Issue</SelectItem>
                  <SelectItem value="VERIFICATION">Verification Required</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="issue-description">Description</Label>
              <Textarea
                id="issue-description"
                placeholder="Describe the security issue..."
                value={issueForm.description}
                onChange={(e) => setIssueForm({ ...issueForm, description: e.target.value })}
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIssueDialog({ open: false, doId: "", doNumber: "" })} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleReportIssue} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reporting...
                </>
              ) : (
                <>
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Report Issue
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}