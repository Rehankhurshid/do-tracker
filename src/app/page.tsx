"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Package, Calendar, Building, CheckCircle, AlertCircle, Clock, ArrowRight, Filter, X, TrendingUp, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

export default function Home() {
  const [allDeliveryOrders, setAllDeliveryOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch all delivery orders on mount
  useEffect(() => {
    fetchAllDeliveryOrders();
  }, []);

  const fetchAllDeliveryOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/public/delivery-orders');
      if (response.ok) {
        const data = await response.json();
        setAllDeliveryOrders(data);
      }
    } catch (error) {
      console.error('Failed to fetch delivery orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter delivery orders based on search term and status filter
  const filteredOrders = useMemo(() => {
    let filtered = allDeliveryOrders;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.doNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.party?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.authorizedPerson?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    return filtered;
  }, [allDeliveryOrders, searchTerm, statusFilter]);

  // Count orders by status
  const statusCounts = useMemo(() => {
    return {
      all: allDeliveryOrders.length,
      created: allDeliveryOrders.filter(o => o.status === "created").length,
      at_area_office: allDeliveryOrders.filter(o => o.status === "at_area_office").length,
      at_project_office: allDeliveryOrders.filter(o => o.status === "at_project_office").length,
      received_at_project_office: allDeliveryOrders.filter(o => o.status === "received_at_project_office").length,
      at_road_sale: allDeliveryOrders.filter(o => o.status === "at_road_sale").length,
    };
  }, [allDeliveryOrders]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "at_road_sale":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "created":
      case "at_area_office":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <ArrowRight className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "created":
        return "Created";
      case "at_area_office":
        return "At Area Office";
      case "at_project_office":
        return "At Project Office";
      case "received_at_project_office":
        return "Received at Project Office";
      case "at_road_sale":
        return "Completed";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "at_road_sale":
        return "default";
      case "created":
      case "at_area_office":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Package className="h-6 w-6" />
              <span className="font-bold text-xl">DO Tracker</span>
            </div>
            <Link href="/login">
              <Button variant="outline">Staff Login</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-7xl mx-auto"
        >
          {/* Hero Section */}
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-4xl font-bold">Delivery Order Tracking System</h1>
            <p className="text-xl text-muted-foreground">
              Track and monitor all delivery orders in real-time
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("all")}>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{statusCounts.all}</div>
                <p className="text-xs text-muted-foreground">Total Orders</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("created")}>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-yellow-600">{statusCounts.created}</div>
                <p className="text-xs text-muted-foreground">Created</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("at_area_office")}>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{statusCounts.at_area_office}</div>
                <p className="text-xs text-muted-foreground">Area Office</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("at_project_office")}>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-purple-600">{statusCounts.at_project_office}</div>
                <p className="text-xs text-muted-foreground">Project Office</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("received_at_project_office")}>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-orange-600">{statusCounts.received_at_project_office}</div>
                <p className="text-xs text-muted-foreground">Received</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("at_road_sale")}>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{statusCounts.at_road_sale}</div>
                <p className="text-xs text-muted-foreground">Completed</p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter Bar */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by DO number, party name, or authorized person..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={statusFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("all")}
                  >
                    All ({statusCounts.all})
                  </Button>
                  <Button
                    variant={statusFilter === "at_road_sale" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("at_road_sale")}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Completed
                  </Button>
                  <Button
                    variant={statusFilter !== "all" && statusFilter !== "at_road_sale" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(statusFilter === "all" || statusFilter === "at_road_sale" ? "created" : "all")}
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    In Progress
                  </Button>
                </div>
              </div>
              {(searchTerm || statusFilter !== "all") && (
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-sm text-muted-foreground">
                    Showing {filteredOrders.length} of {allDeliveryOrders.length} orders
                  </span>
                  {(searchTerm || statusFilter !== "all") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchTerm("");
                        setStatusFilter("all");
                      }}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear filters
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Delivery Orders Grid */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card
                      className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02]"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{order.doNumber}</CardTitle>
                            <CardDescription className="text-xs mt-1">
                              {order.party?.name || "N/A"}
                            </CardDescription>
                          </div>
                          <Badge variant={getStatusColor(order.status)} className="flex items-center gap-1">
                            {getStatusIcon(order.status)}
                            <span className="hidden sm:inline">{getStatusLabel(order.status)}</span>
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Authorized:</span>
                            <span className="font-medium">{order.authorizedPerson}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Valid To:</span>
                            <span className="font-medium">
                              {new Date(order.validTo).toLocaleDateString()}
                            </span>
                          </div>
                          {order.issues && order.issues.length > 0 && (
                            <div className="flex items-center gap-1 text-yellow-600">
                              <AlertCircle className="h-4 w-4" />
                              <span className="text-xs">
                                {order.issues.filter((i: any) => i.status === "OPEN").length} open issues
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* No Results */}
          {!loading && filteredOrders.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No delivery orders found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your filters or search term"
                    : "No delivery orders have been created yet"}
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </main>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-background border-b p-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold">{selectedOrder.doNumber}</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedOrder(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Visual Progress Tracker */}
                <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/20 dark:to-green-950/20 rounded-lg p-6">
                  <h3 className="font-semibold mb-4 text-center">Delivery Order Progress</h3>
                  <div className="relative">
                    {/* Progress Line */}
                    <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-300 dark:bg-gray-700"></div>
                    <div 
                      className="absolute top-5 left-0 h-0.5 bg-green-500 transition-all duration-500"
                      style={{
                        width: selectedOrder.status === 'created' ? '0%' :
                               selectedOrder.status === 'at_area_office' ? '25%' :
                               selectedOrder.status === 'at_project_office' ? '50%' :
                               selectedOrder.status === 'received_at_project_office' ? '75%' :
                               selectedOrder.status === 'at_road_sale' ? '100%' : '0%'
                      }}
                    ></div>
                    
                    {/* Progress Steps */}
                    <div className="relative flex justify-between">
                      {[
                        { status: 'created', label: 'Created', icon: Package },
                        { status: 'at_area_office', label: 'Area Office', icon: Building },
                        { status: 'at_project_office', label: 'Project Office', icon: Building },
                        { status: 'received_at_project_office', label: 'Received', icon: CheckCircle },
                        { status: 'at_road_sale', label: 'Road Sale', icon: CheckCircle }
                      ].map((step, index) => {
                        const Icon = step.icon;
                        const isPassed = ['created', 'at_area_office', 'at_project_office', 'received_at_project_office', 'at_road_sale'].indexOf(selectedOrder.status) >= index;
                        const isCurrent = selectedOrder.status === step.status;
                        
                        return (
                          <div key={step.status} className="flex flex-col items-center">
                            <div className={`
                              w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                              ${isPassed ? 'bg-green-500 text-white' : 'bg-gray-300 dark:bg-gray-700 text-gray-500'}
                              ${isCurrent ? 'ring-4 ring-green-300 dark:ring-green-700' : ''}
                            `}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <span className={`
                              text-xs mt-2 text-center
                              ${isPassed ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-gray-500'}
                            `}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Current Status */}
                  <div className="mt-6 text-center">
                    <Badge variant={getStatusColor(selectedOrder.status)} className="text-sm py-1 px-3">
                      Current Status: {getStatusLabel(selectedOrder.status)}
                    </Badge>
                  </div>
                </div>

                {/* Order Information */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Order Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Party</p>
                      <p className="font-medium flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        {selectedOrder.party?.name || "-"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Authorized Person</p>
                      <p className="font-medium">{selectedOrder.authorizedPerson}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Valid From</p>
                      <p className="font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(selectedOrder.validFrom).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Valid To</p>
                      <p className="font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(selectedOrder.validTo).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {selectedOrder.notes && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm">{selectedOrder.notes}</p>
                    </div>
                  )}
                </div>

                {/* Detailed Activity Log */}
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Detailed Activity Log
                  </h3>
                  <div className="space-y-3">
                    {/* Combine workflow history and issues into a single timeline */}
                    {(() => {
                      const allEvents = [];
                      
                      // Add workflow events
                      if (selectedOrder.workflowHistory) {
                        selectedOrder.workflowHistory.forEach((history: any) => {
                          allEvents.push({
                            type: 'workflow',
                            date: new Date(history.createdAt),
                            title: `Status changed to ${getStatusLabel(history.toStatus)}`,
                            description: history.comments || 'Status updated',
                            icon: ArrowRight,
                            color: 'text-blue-600'
                          });
                        });
                      }
                      
                      // Add issue events
                      if (selectedOrder.issues) {
                        selectedOrder.issues.forEach((issue: any) => {
                          allEvents.push({
                            type: 'issue',
                            date: new Date(issue.createdAt),
                            title: `Issue Reported: ${issue.issueType || 'General'}`,
                            description: issue.description,
                            status: issue.status,
                            resolution: issue.resolution,
                            icon: AlertCircle,
                            color: issue.status === 'OPEN' ? 'text-yellow-600' : 'text-green-600'
                          });
                          
                          if (issue.resolvedAt) {
                            allEvents.push({
                              type: 'resolution',
                              date: new Date(issue.resolvedAt),
                              title: 'Issue Resolved',
                              description: issue.resolution,
                              icon: CheckCircle,
                              color: 'text-green-600'
                            });
                          }
                        });
                      }
                      
                      // Sort events by date (newest first)
                      allEvents.sort((a, b) => b.date.getTime() - a.date.getTime());
                      
                      return allEvents.map((event, index) => {
                        const Icon = event.icon;
                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex gap-3"
                          >
                            {/* Timeline connector */}
                            <div className="relative">
                              <div className={`mt-1 ${event.color}`}>
                                <Icon className="h-5 w-5" />
                              </div>
                              {index !== allEvents.length - 1 && (
                                <div className="absolute top-7 left-2.5 w-0.5 h-full bg-gray-300 dark:bg-gray-700"></div>
                              )}
                            </div>
                            
                            {/* Event content */}
                            <div className="flex-1 pb-4">
                              <div className={`
                                p-3 rounded-lg border
                                ${event.type === 'issue' && event.status === 'OPEN' ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800' :
                                  event.type === 'workflow' ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' :
                                  'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'}
                              `}>
                                <div className="flex justify-between items-start mb-1">
                                  <p className="font-medium text-sm">{event.title}</p>
                                  <time className="text-xs text-muted-foreground">
                                    {event.date.toLocaleString()}
                                  </time>
                                </div>
                                <p className="text-sm text-muted-foreground">{event.description}</p>
                                {event.status === 'OPEN' && (
                                  <Badge variant="destructive" className="mt-2 text-xs">
                                    Pending Resolution
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      });
                    })()}
                  </div>
                  
                  {(!selectedOrder.workflowHistory || selectedOrder.workflowHistory.length === 0) && 
                   (!selectedOrder.issues || selectedOrder.issues.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No activity recorded yet</p>
                    </div>
                  )}
                </div>

                {/* Summary Statistics */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold">
                      {selectedOrder.workflowHistory?.length || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Status Changes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">
                      {selectedOrder.issues?.filter((i: any) => i.status === 'OPEN').length || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Open Issues</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {selectedOrder.issues?.filter((i: any) => i.status === 'RESOLVED').length || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Resolved Issues</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}