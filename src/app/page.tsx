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
                {/* Status Badge */}
                <div className="flex justify-center">
                  <Badge variant={getStatusColor(selectedOrder.status)} className="flex items-center gap-1 text-sm py-1 px-3">
                    {getStatusIcon(selectedOrder.status)}
                    {getStatusLabel(selectedOrder.status)}
                  </Badge>
                </div>

                {/* Order Information */}
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
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Notes</p>
                      <p className="text-sm">{selectedOrder.notes}</p>
                    </div>
                  </>
                )}

                {/* Workflow Progress */}
                {selectedOrder.workflowHistory && selectedOrder.workflowHistory.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-4">Workflow Progress</h3>
                      <div className="space-y-3">
                        {selectedOrder.workflowHistory.map((history: any, index: number) => (
                          <div key={history.id} className="flex items-start gap-3">
                            <div className="mt-1">
                              {index === 0 ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <div className="h-5 w-5 rounded-full bg-muted border-2 border-border" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">
                                {getStatusLabel(history.toStatus)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(history.createdAt).toLocaleString()}
                              </p>
                              {history.comments && (
                                <p className="text-sm mt-1">{history.comments}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Issues */}
                {selectedOrder.issues && selectedOrder.issues.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                        Reported Issues
                      </h3>
                      <div className="space-y-2">
                        {selectedOrder.issues.map((issue: any) => (
                          <div key={issue.id} className="p-3 bg-muted rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <p className="font-medium">{issue.description}</p>
                              <Badge variant={issue.status === "OPEN" ? "destructive" : "default"}>
                                {issue.status}
                              </Badge>
                            </div>
                            {issue.resolution && (
                              <p className="text-sm text-muted-foreground">
                                Resolution: {issue.resolution}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              Reported on {new Date(issue.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}