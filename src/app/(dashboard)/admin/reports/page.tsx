"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  FileText,
  TrendingUp,
  Package,
  Users,
  AlertCircle,
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ReportStats {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  totalIssues: number;
  resolvedIssues: number;
  openIssues: number;
  avgProcessingTime: number;
  ordersByStatus: Record<string, number>;
  ordersByOffice: Record<string, number>;
  issuesByType: Record<string, number>;
  recentActivity: any[];
  performanceMetrics: {
    areaOffice: { total: number; avgTime: number };
    projectOffice: { total: number; avgTime: number };
    roadSale: { total: number; avgTime: number };
  };
}

export default function AdminReportsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReportStats>({
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    totalIssues: 0,
    resolvedIssues: 0,
    openIssues: 0,
    avgProcessingTime: 0,
    ordersByStatus: {},
    ordersByOffice: {},
    issuesByType: {},
    recentActivity: [],
    performanceMetrics: {
      areaOffice: { total: 0, avgTime: 0 },
      projectOffice: { total: 0, avgTime: 0 },
      roadSale: { total: 0, avgTime: 0 },
    },
  });
  const [dateRange, setDateRange] = useState("7days");

  useEffect(() => {
    fetchUserAndStats();
  }, [dateRange]);

  const fetchUserAndStats = async () => {
    try {
      const userRes = await fetch("/api/auth/me");
      const userData = await userRes.json();

      if (!userData.user || userData.user.role !== "ADMIN") {
        router.push("/login");
        return;
      }

      setCurrentUser(userData.user);

      // Fetch report stats
      const statsRes = await fetch(`/api/admin/reports?range=${dateRange}`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (type: string) => {
    try {
      const response = await fetch(`/api/admin/reports/export?type=${type}&range=${dateRange}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `orderflow-report-${type}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!currentUser) return null;

  const completionRate = stats.totalOrders > 0 
    ? ((stats.completedOrders / stats.totalOrders) * 100).toFixed(1)
    : "0";

  const issueResolutionRate = stats.totalIssues > 0
    ? ((stats.resolvedIssues / stats.totalIssues) * 100).toFixed(1)
    : "0";

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Reports & Analytics</h1>
            <p className="text-muted-foreground mt-2">
              System performance metrics and insights
            </p>
          </div>
          <div className="flex gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="3months">Last 3 Months</option>
              <option value="all">All Time</option>
            </select>
            <Button
              variant="outline"
              onClick={() => exportReport("full")}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Orders
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-2">
                <Badge variant="outline" className="text-green-600">
                  {stats.completedOrders} completed
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Completion Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completionRate}%</div>
              <div className="flex items-center text-xs text-muted-foreground mt-2">
                {parseFloat(completionRate) >= 80 ? (
                  <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-600 mr-1" />
                )}
                <span>{parseFloat(completionRate) >= 80 ? "Above" : "Below"} target</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Issues
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalIssues}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                <Badge variant="outline" className="text-yellow-600">
                  {stats.openIssues} open
                </Badge>
                <Badge variant="outline" className="text-green-600">
                  {stats.resolvedIssues} resolved
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg. Processing Time
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.avgProcessingTime.toFixed(1)} hrs
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Per delivery order
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Reports */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="issues">Issues</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Orders by Status</CardTitle>
                  <CardDescription>Distribution of delivery orders</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(stats.ordersByStatus).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full" />
                          <span className="text-sm capitalize">
                            {status.replace(/_/g, " ").toLowerCase()}
                          </span>
                        </div>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Orders by Office</CardTitle>
                  <CardDescription>Processing distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(stats.ordersByOffice).map(([office, count]) => (
                      <div key={office} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{office}</span>
                        </div>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Office Performance Metrics</CardTitle>
                <CardDescription>Average processing times and volumes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <h4 className="font-medium">Area Office</h4>
                      <div className="text-2xl font-bold">
                        {stats.performanceMetrics.areaOffice.total}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Avg: {stats.performanceMetrics.areaOffice.avgTime.toFixed(1)} hrs
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Project Office</h4>
                      <div className="text-2xl font-bold">
                        {stats.performanceMetrics.projectOffice.total}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Avg: {stats.performanceMetrics.projectOffice.avgTime.toFixed(1)} hrs
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Road Sale</h4>
                      <div className="text-2xl font-bold">
                        {stats.performanceMetrics.roadSale.total}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Avg: {stats.performanceMetrics.roadSale.avgTime.toFixed(1)} hrs
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="issues" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Issue Analysis</CardTitle>
                <CardDescription>Issues by type and resolution status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Resolution Rate</p>
                      <p className="text-2xl font-bold">{issueResolutionRate}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {stats.resolvedIssues} of {stats.totalIssues} resolved
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Issues by Type</h4>
                    {Object.entries(stats.issuesByType).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <Badge variant="outline">{type}</Badge>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system activities</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>User</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.recentActivity.map((activity, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-sm">
                          {format(new Date(activity.timestamp), "dd/MM HH:mm")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{activity.type}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{activity.description}</TableCell>
                        <TableCell className="text-sm">{activity.user}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}