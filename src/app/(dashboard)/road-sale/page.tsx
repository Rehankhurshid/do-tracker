"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, CheckCircle2, AlertCircle, TrendingUp, Calendar, Archive } from "lucide-react";

export default function RoadSaleDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalReceived: 0,
    receivedToday: 0,
    withIssues: 0,
    totalCompleted: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserAndStats();
  }, []);

  const fetchUserAndStats = async () => {
    try {

      // Fetch road sale specific stats
      const statsRes = await fetch("/api/road-sale/stats");
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
      <div className="container mx-auto px-4 py-8">
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
      title: "Total Received",
      value: stats.totalReceived,
      description: "All completed orders",
      icon: Archive,
      color: "text-blue-600",
    },
    {
      title: "Received Today",
      value: stats.receivedToday,
      description: "Today's deliveries",
      icon: Calendar,
      color: "text-green-600",
    },
    {
      title: "Completed",
      value: stats.totalCompleted,
      description: "Successfully processed",
      icon: CheckCircle2,
      color: "text-emerald-600",
    },
    {
      title: "With Issues",
      value: stats.withIssues,
      description: "Orders with reported issues",
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Road Sale Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Final delivery point - Process completed orders
            </p>
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
                  onClick={() => router.push("/road-sale/process")}
                >
                  <Package className="mr-2 h-4 w-4" />
                  View Completed Orders
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push("/road-sale/issues")}
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Report Issues
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Completion Status</CardTitle>
                <CardDescription>Process completion metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Completion Rate</span>
                    <span className="text-sm font-medium text-green-600">100%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average Daily</span>
                    <span className="text-sm font-medium">
                      {Math.round(stats.totalReceived / 30)} orders
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Issue Rate</span>
                    <span className="text-sm font-medium">
                      {stats.totalReceived > 0 
                        ? `${Math.round((stats.withIssues / stats.totalReceived) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
    </div>
  );
}