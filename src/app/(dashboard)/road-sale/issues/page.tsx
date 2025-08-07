"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Loader2,
  CheckCircle2,
  Search,
  Filter,
  Package,
  User,
  Calendar,
  MessageSquare,
  X
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export default function RoadSaleIssuesPage() {
  const { toast } = useToast();
  const [issues, setIssues] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("open");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());
  
  // Resolution dialog state
  const [resolutionDialog, setResolutionDialog] = useState<{
    open: boolean;
    issue: any | null;
    resolution: string;
  }>({ open: false, issue: null, resolution: "" });
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      const response = await fetch("/api/issues");
      if (response.ok) {
        const data = await response.json();
        // Filter for issues related to Road Sale orders
        const roadSaleIssues = data.filter((issue: any) => 
          issue.deliveryOrder?.status === 'at_road_sale'
        );
        setIssues(roadSaleIssues);
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

  const toggleIssueExpansion = (issueId: string) => {
    setExpandedIssues(prev => {
      const newSet = new Set(prev);
      if (newSet.has(issueId)) {
        newSet.delete(issueId);
      } else {
        newSet.add(issueId);
      }
      return newSet;
    });
  };

  const resolveIssue = async () => {
    if (!resolutionDialog.issue || !resolutionDialog.resolution.trim()) {
      toast({
        title: "Error",
        description: "Please provide a resolution description",
        variant: "destructive",
      });
      return;
    }

    setIsResolving(true);
    try {
      const response = await fetch(`/api/issues/${resolutionDialog.issue.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resolution: resolutionDialog.resolution.trim(),
        }),
      });

      if (response.ok) {
        toast({
          title: "✅ Issue Resolved",
          description: `Issue for DO #${resolutionDialog.issue.deliveryOrder.doNumber} has been resolved`,
        });
        setResolutionDialog({ open: false, issue: null, resolution: "" });
        await fetchIssues();
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
      setIsResolving(false);
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

  const getStatusBadge = (status: string) => {
    if (status === 'OPEN') {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Open
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="flex items-center gap-1 text-green-600">
        <CheckCircle2 className="h-3 w-3" />
        Resolved
      </Badge>
    );
  };

  // Filter issues based on search and filters
  const filteredIssues = issues.filter(issue => {
    const matchesSearch = searchTerm === "" || 
      issue.deliveryOrder?.doNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.deliveryOrder?.party?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "all" || issue.issueType === filterType;
    
    const matchesTab = activeTab === "all" || 
      (activeTab === "open" && issue.status === "OPEN") ||
      (activeTab === "resolved" && issue.status === "RESOLVED");
    
    return matchesSearch && matchesType && matchesTab;
  });

  const openIssues = issues.filter(issue => issue.status === "OPEN");
  const resolvedIssues = issues.filter(issue => issue.status === "RESOLVED");

  const renderIssuesTable = (issuesToRender: any[]) => {
    if (issuesToRender.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No issues found matching your criteria.
        </div>
      );
    }

    return (
      <>
        {/* Mobile view - Cards */}
        <div className="md:hidden space-y-3">
          {issuesToRender.map((issue) => {
            const isExpanded = expandedIssues.has(issue.id);
            
            return (
              <motion.div
                key={issue.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-card rounded-lg border p-4 space-y-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-base">DO #{issue.deliveryOrder?.doNumber}</p>
                    <p className="text-sm text-muted-foreground">{issue.deliveryOrder?.party?.name}</p>
                  </div>
                  {getStatusBadge(issue.status)}
                </div>

                {/* Issue Details */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getIssueTypeBadge(issue.issueType || 'OTHER')}
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(issue.createdAt), 'dd/MM HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm">{issue.description}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleIssueExpansion(issue.id)}
                    className="w-full flex items-center justify-between p-2 hover:bg-muted/50"
                  >
                    <span className="text-sm">View Details</span>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Expandable Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-2 pt-2 border-t"
                    >
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Reported by:</span>
                          <span className="font-medium">{issue.reportedBy?.username}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Authorized Person:</span>
                          <span className="font-medium">{issue.deliveryOrder?.authorizedPerson}</span>
                        </div>
                        {issue.status === 'RESOLVED' && (
                          <>
                            <div className="pt-2 border-t">
                              <p className="text-muted-foreground text-xs mb-1">Resolution:</p>
                              <p className="text-sm text-green-700 dark:text-green-400">{issue.resolution}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Resolved by {issue.resolvedBy?.username} on {issue.resolvedAt && format(new Date(issue.resolvedAt), 'dd/MM/yyyy HH:mm')}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Actions */}
                {issue.status === 'OPEN' && (
                  <div className="pt-2 border-t">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        setResolutionDialog({
                          open: true,
                          issue: issue,
                          resolution: "",
                        });
                      }}
                      className="w-full"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Resolve Issue
                    </Button>
                  </div>
                )}
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
                <TableHead>Issue Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Reported</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {issuesToRender.map((issue) => {
                const isExpanded = expandedIssues.has(issue.id);
                
                return (
                  <React.Fragment key={issue.id}>
                    <motion.tr
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">{issue.deliveryOrder?.doNumber}</TableCell>
                      <TableCell>{issue.deliveryOrder?.party?.name}</TableCell>
                      <TableCell>{getIssueTypeBadge(issue.issueType || 'OTHER')}</TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate">{issue.description}</div>
                        {issue.description.length > 50 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleIssueExpansion(issue.id)}
                            className="p-0 h-auto text-xs text-primary hover:bg-transparent"
                          >
                            {isExpanded ? 'Show less' : 'Show more'}
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{format(new Date(issue.createdAt), 'dd/MM/yyyy')}</p>
                          <p className="text-xs text-muted-foreground">{issue.reportedBy?.username}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(issue.status)}</TableCell>
                      <TableCell>
                        {issue.status === 'OPEN' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setResolutionDialog({
                                open: true,
                                issue: issue,
                                resolution: "",
                              });
                            }}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleIssueExpansion(issue.id)}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </motion.tr>
                    
                    {/* Expandable Resolution Details */}
                    <AnimatePresence>
                      {isExpanded && issue.status === 'RESOLVED' && (
                        <motion.tr
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <TableCell colSpan={7} className="p-0">
                            <div className="bg-green-50 dark:bg-green-900/20 p-4">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  <span className="font-medium text-sm">Resolution Details</span>
                                </div>
                                <p className="text-sm">{issue.resolution}</p>
                                <p className="text-xs text-muted-foreground">
                                  Resolved by {issue.resolvedBy?.username} on {issue.resolvedAt && format(new Date(issue.resolvedAt), 'dd/MM/yyyy HH:mm')}
                                </p>
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
              <AlertCircle className="h-5 w-5" />
              <CardTitle>Issue Management</CardTitle>
            </div>
            <CardDescription>
              View and resolve issues reported for delivery orders at Road Sale
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by DO number, party, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="QUALITY">Quality</SelectItem>
                  <SelectItem value="QUANTITY">Quantity</SelectItem>
                  <SelectItem value="DOCUMENTATION">Documentation</SelectItem>
                  <SelectItem value="DAMAGE">Damage</SelectItem>
                  <SelectItem value="DELAY">Delay</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <Card className="border-l-4 border-l-yellow-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Open Issues</p>
                      <p className="text-2xl font-bold">{openIssues.length}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-yellow-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Resolved</p>
                      <p className="text-2xl font-bold">{resolvedIssues.length}</p>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-green-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Issues</p>
                      <p className="text-2xl font-bold">{issues.length}</p>
                    </div>
                    <Package className="h-8 w-8 text-blue-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Loading issues...</p>
              </div>
            ) : (
              <Tabs defaultValue="open" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="all" className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    All ({issues.length})
                  </TabsTrigger>
                  <TabsTrigger value="open" className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Open ({openIssues.length})
                  </TabsTrigger>
                  <TabsTrigger value="resolved" className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Resolved ({resolvedIssues.length})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-4">
                  {renderIssuesTable(filteredIssues)}
                </TabsContent>
                <TabsContent value="open" className="mt-4">
                  {renderIssuesTable(filteredIssues)}
                </TabsContent>
                <TabsContent value="resolved" className="mt-4">
                  {renderIssuesTable(filteredIssues)}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Resolution Dialog */}
      <Dialog open={resolutionDialog.open} onOpenChange={(open) => {
        if (!isResolving) {
          setResolutionDialog({ ...resolutionDialog, open });
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Resolve Issue
            </DialogTitle>
            <DialogDescription>
              Provide a resolution for the issue on DO #{resolutionDialog.issue?.deliveryOrder?.doNumber}
            </DialogDescription>
          </DialogHeader>

          {resolutionDialog.issue && (
            <div className="space-y-4 my-4">
              {/* Issue Details */}
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  {getIssueTypeBadge(resolutionDialog.issue.issueType || 'OTHER')}
                  <span className="text-xs text-muted-foreground">
                    Reported by {resolutionDialog.issue.reportedBy?.username}
                  </span>
                </div>
                <p className="text-sm">{resolutionDialog.issue.description}</p>
              </div>

              {/* Resolution Input */}
              <div className="space-y-2">
                <Label htmlFor="resolution">Resolution Description</Label>
                <Textarea
                  id="resolution"
                  placeholder="Describe how the issue was resolved..."
                  value={resolutionDialog.resolution}
                  onChange={(e) => setResolutionDialog({ ...resolutionDialog, resolution: e.target.value })}
                  className="resize-none"
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setResolutionDialog({ open: false, issue: null, resolution: "" });
              }}
              disabled={isResolving}
            >
              Cancel
            </Button>
            <Button
              onClick={resolveIssue}
              disabled={isResolving || !resolutionDialog.resolution.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {isResolving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resolving...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Resolve Issue
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}