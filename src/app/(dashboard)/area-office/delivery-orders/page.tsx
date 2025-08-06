"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Eye, Truck, AlertCircle, Clock, CheckCircle } from "lucide-react";
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

export default function AreaOfficeDeliveryOrdersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [deliveryOrders, setDeliveryOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDeliveryOrders();
  }, []);

  const fetchDeliveryOrders = async () => {
    try {
      const response = await fetch("/api/delivery-orders");
      if (response.ok) {
        const data = await response.json();
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
    return order.status === "at_area_office" && !hasUnresolvedIssues;
  };

  const forwardToProjectOffice = async (orderId: string) => {
    try {
      const response = await fetch(`/api/delivery-orders/${orderId}/forward`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toStatus: "at_project_office" }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Delivery order forwarded to Project Office",
        });
        fetchDeliveryOrders();
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to forward delivery order",
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

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Delivery Orders</CardTitle>
              <CardDescription>
                Manage and track delivery orders
              </CardDescription>
            </div>
            <Button onClick={() => router.push("/area-office/create-do")}>
              <Plus className="mr-2 h-4 w-4" />
              Create DO
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : deliveryOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No delivery orders found. Create your first DO to get started.
            </div>
          ) : (
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
                {deliveryOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.doNumber}</TableCell>
                    <TableCell>{order.party?.name}</TableCell>
                    <TableCell>{order.authorizedPerson}</TableCell>
                    <TableCell>{format(new Date(order.validTo), "dd/MM/yyyy")}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      {order.issues?.length > 0 ? (
                        <div className="flex items-center gap-1">
                          <AlertCircle className="h-4 w-4 text-destructive" />
                          <span className="text-sm">
                            {order.issues.filter((i: any) => i.status === "OPEN").length} open
                          </span>
                        </div>
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/area-office/delivery-orders/${order.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canForward(order) && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => forwardToProjectOffice(order.id)}
                          >
                            <Truck className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}