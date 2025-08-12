"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, Download, Filter, Calendar, TrendingUp, 
  Package, AlertCircle, CheckCircle, Clock, Building,
  FileSpreadsheet, FileDown, Loader2, ChevronDown, 
  BarChart3, PieChart, Activity, Users, ArrowUp,
  ArrowDown, Sparkles, RefreshCw, Eye
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

export default function AreaOfficeReportsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [parties, setParties] = useState<any[]>([]);
  
  // Filters
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: new Date(),
  });
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedParty, setSelectedParty] = useState("all");
  const [presetRange, setPresetRange] = useState("this-month");

  // Preset date ranges
  const presetRanges = {
    "today": { label: "Today", from: new Date(), to: new Date() },
    "yesterday": { label: "Yesterday", from: subDays(new Date(), 1), to: subDays(new Date(), 1) },
    "last-7": { label: "Last 7 Days", from: subDays(new Date(), 7), to: new Date() },
    "last-30": { label: "Last 30 Days", from: subDays(new Date(), 30), to: new Date() },
    "this-month": { label: "This Month", from: startOfMonth(new Date()), to: new Date() },
    "last-month": { 
      label: "Last Month", 
      from: startOfMonth(subDays(new Date(), 30)), 
      to: endOfMonth(subDays(new Date(), 30)) 
    },
  };

  useEffect(() => {
    fetchParties();
    fetchReportData();
  }, [dateRange, selectedStatus, selectedParty]);

  const fetchParties = async () => {
    try {
      const response = await fetch("/api/parties");
      if (response.ok) {
        const data = await response.json();
        setParties(data);
      }
    } catch (error) {
      console.error("Error fetching parties:", error);
    }
  };

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: format(dateRange.from, "yyyy-MM-dd"),
        endDate: format(dateRange.to, "yyyy-MM-dd"),
        status: selectedStatus,
        partyId: selectedParty,
      });

      const response = await fetch(`/api/reports/delivery-orders?${params}`);
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      }
    } catch (error) {
      console.error("Error fetching report data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch report data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetChange = (preset: string) => {
    setPresetRange(preset);
    const range = presetRanges[preset as keyof typeof presetRanges];
    setDateRange({ from: range.from, to: range.to });
  };

  const exportReport = async (format: 'pdf' | 'excel') => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams({
        startDate: format(dateRange.from, "yyyy-MM-dd"),
        endDate: format(dateRange.to, "yyyy-MM-dd"),
        status: selectedStatus,
        partyId: selectedParty,
        format,
      });

      const response = await fetch(`/api/reports/delivery-orders/export?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `DO-Report-${format(new Date(), 'yyyy-MM-dd')}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
        a.click();
        
        toast({
          title: "✅ Report Exported",
          description: `Your report has been downloaded as ${format.toUpperCase()}`,
        });
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      created: "bg-gray-500",
      at_area_office: "bg-blue-500",
      at_project_office: "bg-yellow-500",
      received_at_project_office: "bg-green-500",
      at_road_sale: "bg-purple-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (isLoading && !reportData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading report data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              Delivery Order Reports
            </h1>
            <p className="text-muted-foreground mt-2">
              Comprehensive analytics and insights for your delivery orders
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => fetchReportData()}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={() => exportReport('excel')}
              disabled={isExporting || !reportData}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button
              onClick={() => exportReport('pdf')}
              disabled={isExporting || !reportData}
            >
              <FileDown className="h-4 w-4 mr-2" />
              PDF Report
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Report Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Preset Ranges */}
              <Select value={presetRange} onValueChange={handlePresetChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(presetRanges).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Custom Date Range */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {format(dateRange.from, "PPP")} - {format(dateRange.to, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="range"
                    selected={dateRange}
                    onSelect={(range: any) => {
                      if (range?.from && range?.to) {
                        setDateRange(range);
                        setPresetRange("custom");
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>

              {/* Status Filter */}
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="at_area_office">At Area Office</SelectItem>
                  <SelectItem value="at_project_office">At Project Office</SelectItem>
                  <SelectItem value="received_at_project_office">Received at PO</SelectItem>
                  <SelectItem value="at_road_sale">At Road Sale</SelectItem>
                </SelectContent>
              </Select>

              {/* Party Filter */}
              <Select value={selectedParty} onValueChange={setSelectedParty}>
                <SelectTrigger>
                  <SelectValue placeholder="All Parties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Parties</SelectItem>
                  {parties.map(party => (
                    <SelectItem key={party.id} value={party.id}>
                      {party.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {reportData && (
        <>
          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
          >
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
              <CardHeader className="relative">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold">{reportData.stats.total}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  In selected period
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent" />
              <CardHeader className="relative">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold text-green-600">
                  {reportData.stats.byStatus.at_road_sale}
                </div>
                <Progress 
                  value={(reportData.stats.byStatus.at_road_sale / reportData.stats.total) * 100} 
                  className="mt-2 h-1"
                />
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent" />
              <CardHeader className="relative">
                <CardTitle className="text-sm font-medium">With Issues</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold text-yellow-600">
                  {reportData.stats.withIssues}
                </div>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {reportData.stats.pendingIssues} Open
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {reportData.stats.resolvedIssues} Resolved
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent" />
              <CardHeader className="relative">
                <CardTitle className="text-sm font-medium">Avg Processing</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold">
                  {reportData.stats.avgProcessingTime}h
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Average time to complete
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Charts and Tables */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="details">Detailed List</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Status Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Status Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(reportData.stats.byStatus).map(([status, count]: [string, any]) => (
                        <div key={status} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={cn("w-3 h-3 rounded-full", getStatusColor(status))} />
                            <span className="text-sm">{formatStatus(status)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{count}</span>
                            <Progress 
                              value={(count / reportData.stats.total) * 100} 
                              className="w-20 h-2"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Top Parties */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Top Parties</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {reportData.stats.topParties.map((party: any, index: number) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{index + 1}</Badge>
                            <span className="text-sm">{party.name}</span>
                          </div>
                          <span className="text-sm font-medium">{party.count} orders</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>Delivery Orders Detail</CardTitle>
                  <CardDescription>
                    Complete list of all delivery orders in the selected period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>DO Number</TableHead>
                          <TableHead>Party</TableHead>
                          <TableHead>Authorized Person</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Issues</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.deliveryOrders.map((order: any) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.doNumber}</TableCell>
                            <TableCell>{order.party?.name}</TableCell>
                            <TableCell>{order.authorizedPerson}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {formatStatus(order.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {order.issues.filter((i: any) => i.status === 'OPEN').length > 0 && (
                                  <Badge variant="destructive" className="text-xs">
                                    {order.issues.filter((i: any) => i.status === 'OPEN').length} Open
                                  </Badge>
                                )}
                                {order.issues.filter((i: any) => i.status === 'RESOLVED').length > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {order.issues.filter((i: any) => i.status === 'RESOLVED').length} Resolved
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{format(new Date(order.createdAt), 'dd/MM/yyyy')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Weekly Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      <Activity className="h-8 w-8" />
                      <span className="ml-2">Chart visualization would go here</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Processing Time Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Average Time</span>
                        <span className="font-bold">{reportData.stats.avgProcessingTime} hours</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Fastest</span>
                        <span className="text-green-600">2 hours</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Slowest</span>
                        <span className="text-red-600">48 hours</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}