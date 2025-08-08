"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  AlertCircle, 
  CheckCircle, 
  Clock,
  MessageSquare,
  Search,
  Filter,
  Loader2,
  XCircle
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

export default function CISFIssuesPage() {
  const { toast } = useToast();
  const [issues, setIssues] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("open");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Resolution Dialog State
  const [resolutionDialog, setResolutionDialog] = useState({
    open: false,
    issueId: "",
    doNumber: "",
  });
  const [resolution, setResolution] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      const response = await fetch("/api/issues?reportedBy=CISF");
      if (response.ok) {
        const data = await response.json();
        setIssues(data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch issues",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveIssue = async () => {
    if (!resolution.trim()) {
      toast({
        title: "Error",
        description: "Please provide a resolution",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/issues/${resolutionDialog.issueId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolution }),
      });

      if (response.ok) {
        toast({
          title: "✅ Issue Resolved",
          description: `Issue for DO #${resolutionDialog.doNumber} has been resolved`,
        });
        setResolutionDialog({ open: false, issueId: "", doNumber: "" });
        setResolution("");
        fetchIssues();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resolve issue",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getIssueTypeBadge = (issueType: string) => {
    const typeColors: Record<string, string> = {
      SECURITY: "bg-red-100 text-red-700",
      DOCUMENTATION: "bg-blue-100 text-blue-700",
      VERIFICATION: "bg-yellow-100 text-yellow-700",
      OTHER: "bg-gray-100 text-gray-700",
    };
    return <Badge className={typeColors[issueType] || typeColors.OTHER}>{issueType}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    if (status === "RESOLVED") {
      return <Badge className="bg-green-100 text-green-700">Resolved</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-700">Open</Badge>;
  };

  const filteredIssues = issues.filter(issue => {
    const matchesSearch = 
      issue.deliveryOrder?.doNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "open") {
      return matchesSearch && issue.status === "OPEN";
    } else if (activeTab === "resolved") {
      return matchesSearch && issue.status === "RESOLVED";
    }
    return matchesSearch;
  });

  const openIssues = issues.filter(issue => issue.status === "OPEN");
  const resolvedIssues = issues.filter(issue => issue.status === "RESOLVED");

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
                <AlertCircle className="h-5 w-5" />
                <CardTitle>CISF - Issue Management</CardTitle>
              </div>
              <Badge variant="outline" className="text-lg px-3 py-1">
                {openIssues.length} Open Issues
              </Badge>
            </div>
            <CardDescription>
              Manage and resolve security issues reported by CISF
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by DO number or issue description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Tabs defaultValue="open" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All ({issues.length})</TabsTrigger>
                <TabsTrigger value="open">
                  Open ({openIssues.length})
                </TabsTrigger>
                <TabsTrigger value="resolved">
                  Resolved ({resolvedIssues.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                {isLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p className="text-muted-foreground">Loading issues...</p>
                  </div>
                ) : filteredIssues.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No issues found.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-3">
                      {filteredIssues.map((issue) => (
                        <Card key={issue.id} className="p-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold">DO #{issue.deliveryOrder?.doNumber}</p>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(issue.createdAt), 'dd/MM/yyyy HH:mm')}
                                </p>
                              </div>
                              <div className="flex flex-col gap-1">
                                {getIssueTypeBadge(issue.issueType)}
                                {getStatusBadge(issue.status)}
                              </div>
                            </div>
                            
                            <p className="text-sm">{issue.description}</p>

                            {issue.status === "RESOLVED" && issue.resolution && (
                              <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                                <p className="text-xs font-medium text-green-700 dark:text-green-400">Resolution:</p>
                                <p className="text-sm">{issue.resolution}</p>
                              </div>
                            )}

                            {issue.status === "OPEN" && (
                              <Button
                                size="sm"
                                className="w-full"
                                onClick={() => {
                                  setResolutionDialog({
                                    open: true,
                                    issueId: issue.id,
                                    doNumber: issue.deliveryOrder?.doNumber,
                                  });
                                }}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Resolve Issue
                              </Button>
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
                            <TableHead>Issue Type</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Reported Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Resolution</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredIssues.map((issue) => (
                            <TableRow key={issue.id}>
                              <TableCell className="font-medium">
                                {issue.deliveryOrder?.doNumber}
                              </TableCell>
                              <TableCell>{getIssueTypeBadge(issue.issueType)}</TableCell>
                              <TableCell className="max-w-xs truncate">
                                {issue.description}
                              </TableCell>
                              <TableCell>
                                {format(new Date(issue.createdAt), 'dd/MM/yyyy HH:mm')}
                              </TableCell>
                              <TableCell>{getStatusBadge(issue.status)}</TableCell>
                              <TableCell className="max-w-xs truncate">
                                {issue.resolution || "-"}
                              </TableCell>
                              <TableCell>
                                {issue.status === "OPEN" && (
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setResolutionDialog({
                                        open: true,
                                        issueId: issue.id,
                                        doNumber: issue.deliveryOrder?.doNumber,
                                      });
                                    }}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                )}
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

      {/* Resolution Dialog */}
      <Dialog open={resolutionDialog.open} onOpenChange={(open) => !isSubmitting && setResolutionDialog({ ...resolutionDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Issue</DialogTitle>
            <DialogDescription>
              Provide resolution for the issue on DO #{resolutionDialog.doNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="resolution">Resolution</Label>
              <Textarea
                id="resolution"
                placeholder="Describe how the issue was resolved..."
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setResolutionDialog({ open: false, issueId: "", doNumber: "" })} 
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleResolveIssue} disabled={isSubmitting}>
              {isSubmitting ? (
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