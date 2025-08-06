"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Package, Building, AlertCircle, TrendingUp, Clock } from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDOs: 0,
    totalParties: 0,
    openIssues: 0,
    inProgress: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserAndStats();
  }, []);

  const fetchUserAndStats = async () => {
    try {
      // Fetch dashboard stats
      const statsRes = await fetch("/api/admin/stats");
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }


  const statsCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      description: "Active system users",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Total Delivery Orders",
      value: stats.totalDOs,
      description: "All delivery orders",
      icon: Package,
      color: "text-green-600",
    },
    {
      title: "Total Parties",
      value: stats.totalParties,
      description: "Registered parties",
      icon: Building,
      color: "text-purple-600",
    },
    {
      title: "Open Issues",
      value: stats.openIssues,
      description: "Unresolved issues",
      icon: AlertCircle,
      color: "text-red-600",
    },
    {
      title: "In Progress",
      value: stats.inProgress,
      description: "Orders being processed",
      icon: Clock,
      color: "text-yellow-600",
    },
    {
      title: "Completed",
      value: stats.completed,
      description: "Orders at Road Sale",
      icon: TrendingUp,
      color: "text-emerald-600",
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
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              System overview and management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <button
                  onClick={() => router.push("/admin/users")}
                  className="w-full text-left px-4 py-2 rounded-lg hover:bg-accent transition-colors"
                >
                  Manage Users
                </button>
                <button
                  onClick={() => router.push("/admin/parties")}
                  className="w-full text-left px-4 py-2 rounded-lg hover:bg-accent transition-colors"
                >
                  Manage Parties
                </button>
                <button
                  onClick={() => router.push("/admin/delivery-orders")}
                  className="w-full text-left px-4 py-2 rounded-lg hover:bg-accent transition-colors"
                >
                  View All Orders
                </button>
                <button
                  onClick={() => router.push("/admin/reports")}
                  className="w-full text-left px-4 py-2 rounded-lg hover:bg-accent transition-colors"
                >
                  Generate Reports
                </button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Current system health</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Database</span>
                    <span className="text-sm text-green-600 font-medium">Connected</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Authentication</span>
                    <span className="text-sm text-green-600 font-medium">Active</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API Status</span>
                    <span className="text-sm text-green-600 font-medium">Operational</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
    </div>
  );
}