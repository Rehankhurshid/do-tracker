"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Inbox, Send, AlertCircle, CheckCircle, Clock } from "lucide-react";

export default function ProjectOfficeDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    pendingReceive: 0,
    received: 0,
    forwarded: 0,
    withIssues: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserAndStats();
  }, []);

  const fetchUserAndStats = async () => {
    try {

      // Fetch project office specific stats
      const statsRes = await fetch("/api/project-office/stats");
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
      title: "Pending Receive",
      value: stats.pendingReceive,
      description: "Awaiting receipt",
      icon: Inbox,
      color: "text-blue-600",
    },
    {
      title: "Received",
      value: stats.received,
      description: "Orders received",
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Forwarded",
      value: stats.forwarded,
      description: "Sent to Road Sale",
      icon: Send,
      color: "text-purple-600",
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Project Office Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Receive and forward delivery orders
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
                  onClick={() => router.push("/project-office/process")}
                >
                  <Package className="mr-2 h-4 w-4" />
                  Process Delivery Orders
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push("/project-office/issues")}
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Manage Issues
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Workflow Status</CardTitle>
                <CardDescription>Current processing state</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Pending Receipt</span>
                    <span className="text-sm font-medium">{stats.pendingReceive}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Ready to Forward</span>
                    <span className="text-sm font-medium">
                      {stats.received - stats.withIssues}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Blocked by Issues</span>
                    <span className="text-sm text-red-600 font-medium">{stats.withIssues}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
    </div>
  );
}