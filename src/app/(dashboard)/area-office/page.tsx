"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Plus, AlertCircle, Send, Clock, CheckCircle } from "lucide-react";

export default function AreaOfficeDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalCreated: 0,
    pendingForward: 0,
    forwarded: 0,
    withIssues: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserAndStats();
  }, []);

  const fetchUserAndStats = async () => {
    try {
      // Fetch area office specific stats
      const statsRes = await fetch("/api/area-office/stats");
      const statsData = await statsRes.json();
      setStats(statsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="h-16 w-full" />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }


  const statsCards = [
    {
      title: "Total Created",
      value: stats.totalCreated,
      description: "Delivery orders created",
      icon: Package,
      color: "text-blue-600",
    },
    {
      title: "Pending Forward",
      value: stats.pendingForward,
      description: "Ready to forward",
      icon: Clock,
      color: "text-yellow-600",
    },
    {
      title: "Forwarded",
      value: stats.forwarded,
      description: "Sent to Project Office",
      icon: Send,
      color: "text-green-600",
    },
    {
      title: "With Issues",
      value: stats.withIssues,
      description: "Orders with open issues",
      icon: AlertCircle,
      color: "text-red-600",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Area Office Dashboard</h1>
              <p className="text-muted-foreground mt-2">
                Create and manage delivery orders
              </p>
            </div>
            <Button 
              onClick={() => router.push("/area-office/create")}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create New DO
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {stat.title}
                      </CardTitle>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stat.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push("/area-office/create")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Delivery Order
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push("/area-office/process")}
                >
                  <Package className="mr-2 h-4 w-4" />
                  Process Delivery Orders
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push("/area-office/issues")}
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Manage Issues
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest delivery orders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    No recent activity to display
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
    </div>
  );
}