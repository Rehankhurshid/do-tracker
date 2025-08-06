"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Package, Calendar, Building, CheckCircle, AlertCircle, Clock, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError("");
    setSearchResult(null);

    try {
      const response = await fetch(`/api/public/delivery-orders/${searchTerm}`);
      
      if (response.ok) {
        const data = await response.json();
        setSearchResult(data);
      } else if (response.status === 404) {
        setError("Delivery order not found. Please check the DO number.");
      } else {
        setError("An error occurred. Please try again.");
      }
    } catch (error) {
      setError("Failed to search. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "at_road_sale":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "created":
      case "at_area_office":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <ArrowRight className="h-5 w-5 text-blue-600" />;
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
        return "Completed - At Road Sale";
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
      <header className="border-b bg-background/95 backdrop-blur">
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
      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          {/* Hero Section */}
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-4xl font-bold">Track Your Delivery Order</h1>
            <p className="text-xl text-muted-foreground">
              Enter your delivery order number to check its current status
            </p>
          </div>

          {/* Search Form */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Search Delivery Order</CardTitle>
              <CardDescription>
                Enter the DO number provided to you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Enter DO number (e.g., DO-001)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? "Searching..." : "Search"}
                </Button>
              </form>
              {error && (
                <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-md flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Search Result */}
          {searchResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl">{searchResult.doNumber}</CardTitle>
                      <CardDescription>Delivery Order Details</CardDescription>
                    </div>
                    <Badge variant={getStatusColor(searchResult.status)} className="flex items-center gap-1">
                      {getStatusIcon(searchResult.status)}
                      {getStatusLabel(searchResult.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Order Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Party</p>
                      <p className="font-medium flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        {searchResult.party?.name || "-"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Authorized Person</p>
                      <p className="font-medium">{searchResult.authorizedPerson}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Valid From</p>
                      <p className="font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(searchResult.validFrom).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Valid To</p>
                      <p className="font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(searchResult.validTo).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {searchResult.notes && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Notes</p>
                        <p className="text-sm">{searchResult.notes}</p>
                      </div>
                    </>
                  )}

                  {/* Workflow Progress */}
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-4">Workflow Progress</h3>
                    <div className="space-y-3">
                      {searchResult.workflowHistory?.map((history: any, index: number) => (
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

                  {/* Issues */}
                  {searchResult.issues && searchResult.issues.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-yellow-600" />
                          Reported Issues
                        </h3>
                        <div className="space-y-2">
                          {searchResult.issues.map((issue: any) => (
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
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Information Cards */}
          {!searchResult && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Track Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Monitor your delivery order as it moves through different departments
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">View History</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    See the complete workflow history of your delivery order
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Issue Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Check if there are any issues reported on your delivery order
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}