"use client";

import AdminRoute from "@/components/auth/admin-route";
import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import {
  AreaChartComponent,
  LineChartComponent,
  ChartCard,
  MetricCard,
} from "@/components/ui/charts";
import { Users, Phone, UserCheck, Activity, LogOut, Star } from "lucide-react";
import { signOut } from "next-auth/react";

interface Captain {
  _id: string;
  captainName: string;
  businessName: string;
  callCount: number;
}

interface MonthlyData {
  _id: {
    year: number;
    month: number;
  };
  count: number;
}

interface CallStats {
  totalCalls: number;
  completedCalls: number;
  avgDuration: number;
  inProgressCalls: number;
}

interface AdminStats {
  totalCaptains: number;
  totalCalls: number;
  totalCustomers: number;
  activeCaptains: number;
  callStats: CallStats;
  topCaptains: Captain[];
  callsByMonth: MonthlyData[];
  customersByMonth: MonthlyData[];
  lastUpdated: Date;
}

function AdminDashboardContent() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [useSampleData, setUseSampleData] = useState(false);

  const fetchAdminStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/stats?useSampleData=${useSampleData}`
      );
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      } else {
        setError(data.error || "Failed to fetch admin stats");
      }
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      setError("Failed to fetch admin statistics");
    } finally {
      setLoading(false);
    }
  }, [useSampleData]);

  useEffect(() => {
    fetchAdminStats();
  }, [fetchAdminStats]);

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchAdminStats}>Try Again</Button>
        </div>
      </div>
    );
  }

  // Helper functions for data transformation
  const formatMonthlyData = (data: MonthlyData[]) => {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return data.map((item) => ({
      name: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      value: item.count || 0,
    }));
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-3xl font-bold text-gray-900">
                  Admin Dashboard
                </h1>
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-800 px-3 py-1"
                >
                  <Activity className="w-4 h-4 mr-1" />
                  Admin
                </Badge>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {session?.user?.name}
                  </p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Sample Data Toggle */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-700">
                  Sample Data
                </span>
                <Switch
                  checked={useSampleData}
                  onCheckedChange={setUseSampleData}
                />
                <span className="text-xs text-gray-500">
                  {useSampleData ? "Showing preview data" : "Showing real data"}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Toggle to preview how dashboard looks with data
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-8">
          {/* Today's Activity - At-a-glance metrics */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Today&apos;s Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-center p-3 bg-blue-50 rounded-lg cursor-help">
                      <p className="text-2xl font-bold text-blue-600">
                        {stats?.callStats?.totalCalls || 0}
                      </p>
                      <p className="text-sm text-blue-800">Total Calls</p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>All phone calls made today across all captains</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-center p-3 bg-green-50 rounded-lg cursor-help">
                      <p className="text-2xl font-bold text-green-600">
                        {stats?.callStats?.completedCalls || 0}
                      </p>
                      <p className="text-sm text-green-800">Completed</p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Calls that finished successfully today</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg cursor-help">
                      <p className="text-2xl font-bold text-yellow-600">
                        {stats?.callStats?.inProgressCalls || 0}
                      </p>
                      <p className="text-sm text-yellow-800">In Progress</p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Calls currently happening right now</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-center p-3 bg-purple-50 rounded-lg cursor-help">
                      <p className="text-2xl font-bold text-purple-600">
                        {stats?.callStats?.avgDuration
                          ? `${Math.round(
                              stats.callStats.avgDuration / 60
                            )}m ${Math.round(
                              stats.callStats.avgDuration % 60
                            )}s`
                          : "0m 0s"}
                      </p>
                      <p className="text-sm text-purple-800">Avg Duration</p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Average length of completed calls today</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <MetricCard
                    title="Total Captains"
                    value={stats?.totalCaptains || 0}
                    description={`${stats?.activeCaptains || 0} active`}
                    icon={<Users className="h-4 w-4 text-muted-foreground" />}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>All captains who have registered on the platform</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <MetricCard
                    title="Total Calls"
                    value={stats?.totalCalls || 0}
                    description="All time calls"
                    icon={<Phone className="h-4 w-4 text-muted-foreground" />}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Total phone calls made since launch</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <MetricCard
                    title="Total Customers"
                    value={stats?.totalCustomers || 0}
                    description="Unique customers"
                    icon={
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                    }
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Unique customers who have called captains</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <MetricCard
                    title="Active Captains"
                    value={stats?.activeCaptains || 0}
                    description="Currently using service"
                    icon={
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    }
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Captains currently using the phone assistant service</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Main Dashboard Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Call Volume Trend */}
            <ChartCard
              title="Call Volume Trend"
              description="Monthly call volume over the last 6 months"
            >
              <AreaChartComponent
                data={formatMonthlyData(stats?.callsByMonth || [])}
              />
            </ChartCard>

            {/* Customer Growth */}
            <ChartCard
              title="Customer Growth"
              description="New customers by month"
            >
              <LineChartComponent
                data={formatMonthlyData(stats?.customersByMonth || [])}
              />
            </ChartCard>
          </div>

          {/* Top Captains */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="w-5 h-5 mr-2" />
                Top Captains
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.topCaptains && stats.topCaptains.length > 0 ? (
                <div className="space-y-3">
                  {stats.topCaptains
                    .slice(0, 5)
                    .map((captain: Captain, index: number) => (
                      <div
                        key={captain._id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-sm font-bold text-blue-600">
                              #{index + 1}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{captain.captainName}</p>
                            <p className="text-sm text-gray-600">
                              {captain.businessName}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{captain.callCount || 0}</p>
                          <p className="text-xs text-gray-500">calls</p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No captain data
                </p>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </TooltipProvider>
  );
}

export default function AdminDashboard() {
  return (
    <AdminRoute>
      <AdminDashboardContent />
    </AdminRoute>
  );
}
