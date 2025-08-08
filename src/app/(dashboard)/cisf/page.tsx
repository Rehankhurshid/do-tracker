"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Package, AlertCircle, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function CISFDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    pendingApproval: 0,
    approved: 0,
    withIssues: 0,
    totalProcessed: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch("/api/dashboard/cisf");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else if (response.status === 401) {
        router.push("/login");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Pending Approval",
      value: stats.pendingApproval,
      icon: Clock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
      href: "/cisf/process",
    },
    {
      title: "Approved by CISF",
      value: stats.approved,
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      href: "/cisf/approved",
    },
    {
      title: "With Issues",
      value: stats.withIssues,
      icon: AlertCircle,
      color: "text-red-500",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      href: "/cisf/issues",
    },
    {
      title: "Total Processed",
      value: stats.totalProcessed,
      icon: TrendingUp,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      href: "/cisf/reports",
    },
  ];

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="mb-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">CISF Dashboard</h1>
          </div>
          <p className="text-muted-foreground mt-2">
            Central Industrial Security Force - Delivery Order Management
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card 
                className={`cursor-pointer hover:shadow-lg transition-shadow ${card.bgColor}`}
                onClick={() => router.push(card.href)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Review and approve delivery orders, manage issues
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => router.push("/cisf/process")}
              className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors"
            >
              <Package className="h-5 w-5 text-primary" />
              <div className="text-left">
                <p className="font-medium">Review Orders</p>
                <p className="text-sm text-muted-foreground">
                  Approve or report issues on pending orders
                </p>
              </div>
            </button>
            <button
              onClick={() => router.push("/cisf/issues")}
              className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors"
            >
              <AlertCircle className="h-5 w-5 text-primary" />
              <div className="text-left">
                <p className="font-medium">Manage Issues</p>
                <p className="text-sm text-muted-foreground">
                  View and resolve reported issues
                </p>
              </div>
            </button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}