"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Package, Calendar, User, Building, FileText, Filter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { DOStatus } from "@/types";

export default function DeliveryOrdersPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [deliveryOrders, setDeliveryOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    fetchUserAndData();
  }, []);

  const fetchUserAndData = async () => {
    try {
      const userRes = await fetch("/api/auth/me");
      const userData = await userRes.json();

      if (!userData.user || userData.user.role !== "ADMIN") {
        router.push("/login");
        return;
      }

      setCurrentUser(userData.user);

      const dosRes = await fetch("/api/admin/delivery-orders");
      const dosData = await dosRes.json();
      setDeliveryOrders(dosData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: DOStatus) => {
    switch (status) {
      case "created":
        return "default";
      case "at_area_office":
        return "secondary";
      case "at_project_office":
        return "outline";
      case "received_at_project_office":
        return "outline";
      case "at_road_sale":
        return "default";
      default:
        return "secondary";
    }
  };

  const getStatusLabel = (status: DOStatus) => {
    switch (status) {
      case "created":
        return "Created";
      case "at_area_office":
        return "At Area Office";
      case "at_project_office":
        return "At Project Office";
      case "received_at_project_office":
        return "Received at Project";
      case "at_road_sale":
        return "Completed";
      default:
        return status;
    }
  };

  const filteredOrders = deliveryOrders.filter((order) => {
    const matchesSearch = 
      order.doNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.party?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.authorizedPerson.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="h-16 w-full" />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold">All Delivery Orders</h1>
            <p className="text-muted-foreground mt-2">
              View and track all delivery orders in the system
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Delivery Orders</CardTitle>
                  <CardDescription>Complete list of all DOs</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search orders..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-full sm:w-64"
                    />
                  </div>
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="flex h-10 w-full sm:w-40 rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="ALL">All Status</option>
                      <option value="created">Created</option>
                      <option value="at_area_office">At Area Office</option>
                      <option value="at_project_office">At Project Office</option>
                      <option value="received_at_project_office">Received at Project</option>
                      <option value="at_road_sale">Completed</option>
                    </select>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>DO Number</TableHead>
                        <TableHead>Party</TableHead>
                        <TableHead>Authorized Person</TableHead>
                        <TableHead>Valid From</TableHead>
                        <TableHead>Valid To</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Issues</TableHead>
                        <TableHead>Created By</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              {order.doNumber}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Building className="h-3 w-3 text-muted-foreground" />
                              {order.party?.name || "-"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3 text-muted-foreground" />
                              {order.authorizedPerson}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              {new Date(order.validFrom).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(order.validTo).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(order.status as DOStatus)}>
                              {getStatusLabel(order.status as DOStatus)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {order._count?.issues > 0 ? (
                              <Badge variant="destructive">
                                {order._count.issues} issue{order._count.issues > 1 ? 's' : ''}
                              </Badge>
                            ) : (
                              <Badge variant="outline">No issues</Badge>
                            )}
                          </TableCell>
                          <TableCell>{order.createdBy?.username || "-"}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => router.push(`/admin/delivery-orders/${order.id}`)}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {filteredOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card rounded-lg border p-4 space-y-3"
                  >
                    {/* Header with DO Number and Status */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-semibold text-base">{order.doNumber}</p>
                          <p className="text-sm text-muted-foreground">{order.party?.name || "No party"}</p>
                        </div>
                      </div>
                      <Badge variant={getStatusColor(order.status as DOStatus)}>
                        {getStatusLabel(order.status as DOStatus)}
                      </Badge>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Auth Person:</span>
                        <span className="font-medium">{order.authorizedPerson}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Valid From:</span>
                        <span className="font-medium">{new Date(order.validFrom).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Valid To:</span>
                        <span className="font-medium">{new Date(order.validTo).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created By:</span>
                        <span className="font-medium">{order.createdBy?.username || "-"}</span>
                      </div>
                    </div>

                    {/* Issues Section */}
                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">Issues:</span>
                        {order._count?.issues > 0 ? (
                          <Badge variant="destructive">
                            {order._count.issues} issue{order._count.issues > 1 ? 's' : ''}
                          </Badge>
                        ) : (
                          <Badge variant="outline">No issues</Badge>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/delivery-orders/${order.id}`)}
                        className="w-full"
                      >
                        <FileText className="h-4 w-4" />
                        <span className="ml-2">View Details</span>
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
    </div>
  );
}