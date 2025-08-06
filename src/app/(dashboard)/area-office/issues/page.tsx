"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Clock, MessageSquare, Package, X, Loader2, AlertTriangle, Plus } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function IssuesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [issues, setIssues] = useState<any[]>([]);
  const [deliveryOrders, setDeliveryOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [resolvingIssue, setResolvingIssue] = useState<string | null>(null);
  const [resolution, setResolution] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [newIssue, setNewIssue] = useState({
    deliveryOrderId: "",
    issueType: "OTHER",
    description: ""
  });

  useEffect(() => {
    fetchIssues();
    fetchDeliveryOrders();
  }, []);

  const fetchDeliveryOrders = async () => {
    try {
      const response = await fetch("/api/delivery-orders");
      if (response.ok) {
        const data = await response.json();
        const relevantDOs = data.filter((order: any) => order.status === 'at_area_office');
        setDeliveryOrders(relevantDOs);
      }
    } catch (error) {
      console.error("Error fetching delivery orders:", error);
    }
  };

  const reportNewIssue = async () => {
    if (!newIssue.deliveryOrderId || !newIssue.description.trim()) {
      toast({
        title: "Error",
        description: "Please select a delivery order and provide a description",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newIssue),
      });

      if (response.ok) {
        toast({
          title: "✅ Success",
          description: "Issue reported successfully",
        });
        setReportDialogOpen(false);
        setNewIssue({ deliveryOrderId: "", issueType: "OTHER", description: "" });
        fetchIssues();
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to report issue",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const fetchIssues = async () => {
    try {
      const response = await fetch("/api/issues");
      if (response.ok) {
        const data = await response.json();
        setIssues(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch issues",
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

  const resolveIssue = async () => {
    if (!selectedIssue || !resolution.trim()) {
      toast({
        title: "Error",
        description: "Please provide a resolution",
        variant: "destructive",
      });
      return;
    }

    setResolvingIssue(selectedIssue.id);
    try {
      const response = await fetch(`/api/issues/${selectedIssue.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolution }),
      });

      if (response.ok) {
        toast({
          title: "✅ Success",
          description: "Issue resolved successfully",
        });
        setDialogOpen(false);
        setResolution("");
        setSelectedIssue(null);
        fetchIssues();
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to resolve issue",
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
      setResolvingIssue(null);
    }
  };

  const openIssues = issues.filter(issue => issue.status === "OPEN");
  const resolvedIssues = issues.filter(issue => issue.status === "RESOLVED");

  const getStatusBadge = (status: string) => {
    if (status === "OPEN") {
      return <Badge variant="destructive">Open</Badge>;
    }
    return <Badge variant="outline" className="text-green-600">Resolved</Badge>;
  };

  const getIssueTypeBadge = (type: string) => {
    const typeConfig: any = {
      QUALITY: { label: "Quality", className: "bg-purple-100 text-purple-700" },
      QUANTITY: { label: "Quantity", className: "bg-blue-100 text-blue-700" },
      DOCUMENTATION: { label: "Documentation", className: "bg-yellow-100 text-yellow-700" },
      DAMAGE: { label: "Damage", className: "bg-red-100 text-red-700" },
      DELAY: { label: "Delay", className: "bg-orange-100 text-orange-700" },
      OTHER: { label: "Other", className: "bg-gray-100 text-gray-700" },
    };
    const config = typeConfig[type] || typeConfig.OTHER;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const renderIssuesTable = (issuesList: any[], showResolution: boolean = false) => {
    if (issuesList.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No issues found in this category.
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
                <TableHead>Type</TableHead>
                <TableHead>Issue Description</TableHead>
                <TableHead>Reported By</TableHead>
                <TableHead>Reported At</TableHead>
                <TableHead>Status</TableHead>
                {showResolution && <TableHead>Resolution</TableHead>}
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {issuesList.map((issue) => (
                <TableRow key={issue.id}>
                  <TableCell className="font-medium">
                    {issue.deliveryOrder?.doNumber}
                  </TableCell>
                  <TableCell>
                    {getIssueTypeBadge(issue.issueType || 'OTHER')}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="truncate">{issue.description}</p>
                  </TableCell>
                  <TableCell>{issue.reportedBy?.username}</TableCell>
                  <TableCell>
                    {format(new Date(issue.createdAt), "dd/MM/yyyy HH:mm")}
                  </TableCell>
                  <TableCell>{getStatusBadge(issue.status)}</TableCell>
                  {showResolution && (
                    <TableCell className="max-w-xs">
                      {issue.resolution ? (
                        <div>
                          <p className="text-sm truncate">{issue.resolution}</p>
                          <p className="text-xs text-muted-foreground">
                            by {issue.resolvedBy?.username}
                          </p>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/area-office/delivery-orders/${issue.deliveryOrderId}`)}
                      >
                        View DO
                      </Button>
                      {issue.status === "OPEN" && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            setSelectedIssue(issue);
                            setDialogOpen(true);
                          }}
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {issuesList.map((issue) => (
            <motion.div
              key={issue.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-lg border p-4 space-y-3"
            >
              {/* Header with DO Number and Status */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-base">DO #{issue.deliveryOrder?.doNumber}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getIssueTypeBadge(issue.issueType || 'OTHER')}
                  </div>
                </div>
                {getStatusBadge(issue.status)}
              </div>

              {/* Issue Description */}
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground mb-1">Issue Description:</p>
                <p className="text-sm">{issue.description}</p>
              </div>

              {/* Details */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reported By:</span>
                  <span className="font-medium">{issue.reportedBy?.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reported At:</span>
                  <span className="font-medium">{format(new Date(issue.createdAt), "dd/MM HH:mm")}</span>
                </div>
              </div>

              {/* Resolution (if available) */}
              {showResolution && issue.resolution && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground mb-1">Resolution:</p>
                  <p className="text-sm">{issue.resolution}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Resolved by {issue.resolvedBy?.username}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/area-office/delivery-orders/${issue.deliveryOrderId}`)}
                  className="flex-1"
                >
                  <Package className="h-4 w-4" />
                  <span className="ml-1">View DO</span>
                </Button>
                {issue.status === "OPEN" && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      setSelectedIssue(issue);
                      setDialogOpen(true);
                    }}
                    className="flex-1"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="ml-1">Resolve</span>
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </>
    );
  };

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <CardTitle>Issue Management</CardTitle>
            </div>
            <Button onClick={() => setReportDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Report Issue
            </Button>
          </div>
          <CardDescription>
            Track and resolve issues related to delivery orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Tabs defaultValue="open" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="open" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Open Issues ({openIssues.length})
                </TabsTrigger>
                <TabsTrigger value="resolved" className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Resolved ({resolvedIssues.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="open" className="mt-4">
                {renderIssuesTable(openIssues)}
              </TabsContent>
              <TabsContent value="resolved" className="mt-4">
                {renderIssuesTable(resolvedIssues, true)}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Resolve Issue</DialogTitle>
            <DialogDescription>
              Provide a resolution for the issue reported on DO #{selectedIssue?.deliveryOrder?.doNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Issue Type</Label>
              <div className="mt-1">
                {selectedIssue && getIssueTypeBadge(selectedIssue.issueType || 'OTHER')}
              </div>
            </div>
            <div>
              <Label>Issue Description</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedIssue?.description}
              </p>
            </div>
            <div>
              <Label htmlFor="resolution">Resolution Details</Label>
              <Textarea
                id="resolution"
                placeholder="Describe how the issue was resolved..."
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="mt-1"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setResolution("");
                setSelectedIssue(null);
              }}
              disabled={resolvingIssue !== null}
            >
              Cancel
            </Button>
            <Button
              onClick={resolveIssue}
              disabled={resolvingIssue !== null || !resolution.trim()}
            >
              {resolvingIssue !== null && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Resolve Issue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Issue Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Report New Issue
            </DialogTitle>
            <DialogDescription>
              Report an issue for a delivery order
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="do-select">Delivery Order</Label>
              <Select
                value={newIssue.deliveryOrderId}
                onValueChange={(value) => setNewIssue({ ...newIssue, deliveryOrderId: value })}
              >
                <SelectTrigger id="do-select">
                  <SelectValue placeholder="Select a delivery order" />
                </SelectTrigger>
                <SelectContent>
                  {deliveryOrders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      DO #{order.doNumber} - {order.party?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="issue-type">Issue Type</Label>
              <Select
                value={newIssue.issueType}
                onValueChange={(value) => setNewIssue({ ...newIssue, issueType: value })}
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
            <div>
              <Label htmlFor="issue-desc">Issue Description</Label>
              <Textarea
                id="issue-desc"
                placeholder="Describe the issue in detail..."
                value={newIssue.description}
                onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                className="mt-1"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReportDialogOpen(false);
                setNewIssue({ deliveryOrderId: "", issueType: "OTHER", description: "" });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={reportNewIssue}
              disabled={!newIssue.deliveryOrderId || !newIssue.description.trim()}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Report Issue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}