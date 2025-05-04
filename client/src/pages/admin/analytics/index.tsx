import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  ChevronUp,
  ChevronDown,
  Users,
  UserPlus,
  DollarSign,
  BarChart3,
  TrendingUp,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Calendar,
  ChevronRight,
  Filter,
  Download,
} from "lucide-react";

// Demo data for analytics
const userGrowthData = [
  { month: "Jan", users: 105, paid: 14, premium: 2 },
  { month: "Feb", users: 114, paid: 22, premium: 5 },
  { month: "Mar", users: 123, paid: 31, premium: 9 },
  { month: "Apr", users: 142, paid: 42, premium: 12 },
  { month: "May", users: 165, paid: 58, premium: 17 },
  { month: "Jun", users: 201, paid: 76, premium: 23 },
  { month: "Jul", users: 224, paid: 89, premium: 31 },
  { month: "Aug", users: 252, paid: 104, premium: 35 },
  { month: "Sep", users: 276, paid: 124, premium: 41 },
  { month: "Oct", users: 312, paid: 147, premium: 48 },
  { month: "Nov", users: 350, paid: 173, premium: 59 },
  { month: "Dec", users: 394, paid: 201, premium: 67 },
];

const revenueData = [
  { month: "Jan", revenue: 458, recurringRevenue: 410, oneTimeRevenue: 48 },
  { month: "Feb", revenue: 782, recurringRevenue: 702, oneTimeRevenue: 80 },
  { month: "Mar", revenue: 1150, recurringRevenue: 999, oneTimeRevenue: 151 },
  { month: "Apr", revenue: 1623, recurringRevenue: 1400, oneTimeRevenue: 223 },
  { month: "May", revenue: 2200, recurringRevenue: 1850, oneTimeRevenue: 350 },
  { month: "Jun", revenue: 2850, recurringRevenue: 2400, oneTimeRevenue: 450 },
  { month: "Jul", revenue: 3500, recurringRevenue: 2950, oneTimeRevenue: 550 },
  { month: "Aug", revenue: 4000, recurringRevenue: 3450, oneTimeRevenue: 550 },
  { month: "Sep", revenue: 4600, recurringRevenue: 4000, oneTimeRevenue: 600 },
  { month: "Oct", revenue: 5350, recurringRevenue: 4650, oneTimeRevenue: 700 },
  { month: "Nov", revenue: 6100, recurringRevenue: 5250, oneTimeRevenue: 850 },
  { month: "Dec", revenue: 6800, recurringRevenue: 5900, oneTimeRevenue: 900 },
];

const stockAlertEngagementData = [
  { name: "AAPL", engaged: 85, notEngaged: 15 },
  { name: "MSFT", engaged: 78, notEngaged: 22 },
  { name: "GOOGL", engaged: 72, notEngaged: 28 },
  { name: "AMZN", engaged: 81, notEngaged: 19 },
  { name: "NVDA", engaged: 92, notEngaged: 8 },
  { name: "TSLA", engaged: 76, notEngaged: 24 },
  { name: "META", engaged: 68, notEngaged: 32 },
  { name: "DIS", engaged: 57, notEngaged: 43 },
];

const churnData = [
  { month: "Jan", rate: 1.2 },
  { month: "Feb", rate: 1.5 },
  { month: "Mar", rate: 2.0 },
  { month: "Apr", rate: 1.7 },
  { month: "May", rate: 1.4 },
  { month: "Jun", rate: 1.1 },
  { month: "Jul", rate: 0.9 },
  { month: "Aug", rate: 1.0 },
  { month: "Sep", rate: 1.2 },
  { month: "Oct", rate: 1.3 },
  { month: "Nov", rate: 1.2 },
  { month: "Dec", rate: 1.0 },
];

const userTierDistribution = [
  { name: "Free", value: 193, color: "#94a3b8" },
  { name: "Paid", value: 134, color: "#38bdf8" },
  { name: "Premium", value: 67, color: "#818cf8" },
  { name: "Mentorship", value: 12, color: "#6366f1" },
  { name: "Employee", value: 5, color: "#d946ef" },
];

const educationContentEngagement = [
  { name: "Basics of Trading", views: 245, completion: 78 },
  { name: "Technical Analysis", views: 189, completion: 64 },
  { name: "Fundamental Analysis", views: 167, completion: 71 },
  { name: "Risk Management", views: 203, completion: 82 },
  { name: "Portfolio Diversification", views: 178, completion: 75 },
  { name: "Chart Patterns", views: 156, completion: 68 },
  { name: "Candlestick Analysis", views: 142, completion: 59 },
  { name: "Trading Psychology", views: 198, completion: 73 },
];

const topPerformingAlerts = [
  { symbol: "NVDA", success: 92, avgReturn: 17.3 },
  { symbol: "AAPL", success: 87, avgReturn: 12.8 },
  { symbol: "MSFT", success: 84, avgReturn: 11.5 },
  { symbol: "GOOGL", success: 81, avgReturn: 10.2 },
  { symbol: "AMZN", success: 79, avgReturn: 9.7 },
];

const userActivityData = [
  { hour: "00", weekday: 12, weekend: 8 },
  { hour: "01", weekday: 8, weekend: 10 },
  { hour: "02", weekday: 5, weekend: 12 },
  { hour: "03", weekday: 3, weekend: 8 },
  { hour: "04", weekday: 2, weekend: 5 },
  { hour: "05", weekday: 5, weekend: 2 },
  { hour: "06", weekday: 10, weekend: 3 },
  { hour: "07", weekday: 18, weekend: 7 },
  { hour: "08", weekday: 28, weekend: 12 },
  { hour: "09", weekday: 45, weekend: 18 },
  { hour: "10", weekday: 65, weekend: 24 },
  { hour: "11", weekday: 78, weekend: 29 },
  { hour: "12", weekday: 62, weekend: 35 },
  { hour: "13", weekday: 55, weekend: 40 },
  { hour: "14", weekday: 68, weekend: 44 },
  { hour: "15", weekday: 75, weekend: 42 },
  { hour: "16", weekday: 82, weekend: 38 },
  { hour: "17", weekday: 68, weekend: 35 },
  { hour: "18", weekday: 58, weekend: 42 },
  { hour: "19", weekday: 48, weekend: 48 },
  { hour: "20", weekday: 42, weekend: 54 },
  { hour: "21", weekday: 35, weekend: 62 },
  { hour: "22", weekday: 28, weekend: 58 },
  { hour: "23", weekday: 18, weekend: 48 },
];

const conversionFunnelData = [
  { stage: "Visitor", count: 1500, color: "#818cf8" },
  { stage: "Free Signup", count: 650, color: "#38bdf8" },
  { stage: "Active User", count: 450, color: "#6366f1" },
  { stage: "Paid Conversion", count: 201, color: "#8b5cf6" },
  { stage: "Premium Conversion", count: 67, color: "#a855f7" },
];

const retentionData = [
  { day: "Day 1", retention: 100 },
  { day: "Day 7", retention: 68 },
  { day: "Day 14", retention: 56 },
  { day: "Day 30", retention: 43 },
  { day: "Day 60", retention: 36 },
  { day: "Day 90", retention: 31 },
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("last12months");
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive data insights and performance metrics for your platform
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last30days">Last 30 Days</SelectItem>
                <SelectItem value="last3months">Last 3 Months</SelectItem>
                <SelectItem value="last6months">Last 6 Months</SelectItem>
                <SelectItem value="last12months">Last 12 Months</SelectItem>
                <SelectItem value="ytd">Year to Date</SelectItem>
                <SelectItem value="alltime">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Top Level KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <h3 className="text-2xl font-bold mt-1">394</h3>
                </div>
                <div className="p-2 bg-primary/10 rounded-full">
                  <Users className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <Badge variant="success" className="text-xs px-1.5 py-0.5 rounded-sm">
                  <ChevronUp className="h-3 w-3 mr-1" />
                  12.6%
                </Badge>
                <span className="text-xs text-muted-foreground ml-2">vs. previous period</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">New Signups</p>
                  <h3 className="text-2xl font-bold mt-1">44</h3>
                </div>
                <div className="p-2 bg-primary/10 rounded-full">
                  <UserPlus className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <Badge variant="success" className="text-xs px-1.5 py-0.5 rounded-sm">
                  <ChevronUp className="h-3 w-3 mr-1" />
                  8.3%
                </Badge>
                <span className="text-xs text-muted-foreground ml-2">vs. previous period</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Monthly Revenue</p>
                  <h3 className="text-2xl font-bold mt-1">$6,800</h3>
                </div>
                <div className="p-2 bg-primary/10 rounded-full">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <Badge variant="success" className="text-xs px-1.5 py-0.5 rounded-sm">
                  <ChevronUp className="h-3 w-3 mr-1" />
                  11.5%
                </Badge>
                <span className="text-xs text-muted-foreground ml-2">vs. previous period</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Churn Rate</p>
                  <h3 className="text-2xl font-bold mt-1">1.0%</h3>
                </div>
                <div className="p-2 bg-primary/10 rounded-full">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <Badge variant="success" className="text-xs px-1.5 py-0.5 rounded-sm">
                  <ChevronDown className="h-3 w-3 mr-1" />
                  0.2%
                </Badge>
                <span className="text-xs text-muted-foreground ml-2">vs. previous period</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="alerts">Stock Alerts</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Growth Chart */}
              <Card className="col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">User Growth</CardTitle>
                  <CardDescription>Monthly new users by membership tier</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={userGrowthData}
                        margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="users"
                          stackId="1"
                          stroke="#8884d8"
                          fill="#8884d8"
                        />
                        <Area
                          type="monotone"
                          dataKey="paid"
                          stackId="2"
                          stroke="#82ca9d"
                          fill="#82ca9d"
                        />
                        <Area
                          type="monotone"
                          dataKey="premium"
                          stackId="3"
                          stroke="#ffc658"
                          fill="#ffc658"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Chart */}
              <Card className="col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Revenue Trends</CardTitle>
                  <CardDescription>Monthly revenue breakdown</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={revenueData}
                        margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => ["$" + value, "Revenue"]} />
                        <Area
                          type="monotone"
                          dataKey="recurringRevenue"
                          stackId="1"
                          stroke="#8884d8"
                          fill="#8884d8"
                          name="Recurring"
                        />
                        <Area
                          type="monotone"
                          dataKey="oneTimeRevenue"
                          stackId="1"
                          stroke="#82ca9d"
                          fill="#82ca9d"
                          name="One-time"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Conversion Funnel */}
              <Card className="col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Conversion Funnel</CardTitle>
                  <CardDescription>User journey from visitor to paid customer</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={conversionFunnelData}
                        layout="vertical"
                        margin={{ top: 20, right: 20, left: 40, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="stage" width={100} />
                        <Tooltip formatter={(value) => [value, "Users"]} />
                        <Bar dataKey="count" name="Users">
                          {conversionFunnelData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* User Tier Distribution */}
              <Card className="col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Membership Distribution</CardTitle>
                  <CardDescription>Breakdown of users by membership tier</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 20, right: 20, left: 20, bottom: 0 }}>
                        <Pie
                          data={userTierDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {userTierDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [value, "Users"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Engagement and Retention */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">User Retention</CardTitle>
                  <CardDescription>Percentage of users that remain active over time</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={retentionData}
                        margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip formatter={(value) => [`${value}%`, "Retention"]} />
                        <Line
                          type="monotone"
                          dataKey="retention"
                          stroke="#8884d8"
                          strokeWidth={2}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">User Activity Patterns</CardTitle>
                  <CardDescription>Hourly activity patterns: weekday vs. weekend</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={userActivityData}
                        margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="weekday"
                          stroke="#8884d8"
                          strokeWidth={2}
                          name="Weekday"
                        />
                        <Line
                          type="monotone"
                          dataKey="weekend"
                          stroke="#82ca9d"
                          strokeWidth={2}
                          name="Weekend"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">User Growth Trend</CardTitle>
                    <CardDescription>Monthly user acquisition and churn</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={userGrowthData}
                          margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="users"
                            stroke="#8884d8"
                            strokeWidth={2}
                            activeDot={{ r: 8 }}
                            name="Total Users"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">User Churn Rate</CardTitle>
                  <CardDescription>Monthly percentage of lost users</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={churnData}
                        margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis domain={[0, 3]} />
                        <Tooltip formatter={(value) => [`${value}%`, "Churn Rate"]} />
                        <Line
                          type="monotone"
                          dataKey="rate"
                          stroke="#ff0000"
                          strokeWidth={2}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">User Tier Conversion</CardTitle>
                  <CardDescription>Conversion rate between membership tiers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>Free to Paid</span>
                        <span className="font-medium">30.8%</span>
                      </div>
                      <Progress value={30.8} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>Paid to Premium</span>
                        <span className="font-medium">50.0%</span>
                      </div>
                      <Progress value={50.0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>Premium to Mentorship</span>
                        <span className="font-medium">17.9%</span>
                      </div>
                      <Progress value={17.9} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>Free Trial Conversion</span>
                        <span className="font-medium">42.5%</span>
                      </div>
                      <Progress value={42.5} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>Referral Conversion</span>
                        <span className="font-medium">58.3%</span>
                      </div>
                      <Progress value={58.3} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">User Behavior & Segments</CardTitle>
                  <CardDescription>Key user behavioral metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 border rounded-md">
                        <p className="text-sm text-muted-foreground">Avg. Session Duration</p>
                        <p className="text-2xl font-bold mt-1">14.3 min</p>
                        <p className="text-xs text-green-600 mt-1">↑ 2.1 min</p>
                      </div>
                      <div className="p-4 border rounded-md">
                        <p className="text-sm text-muted-foreground">Pages Per Session</p>
                        <p className="text-2xl font-bold mt-1">5.8</p>
                        <p className="text-xs text-green-600 mt-1">↑ 0.7</p>
                      </div>
                      <div className="p-4 border rounded-md">
                        <p className="text-sm text-muted-foreground">Weekly Active Users</p>
                        <p className="text-2xl font-bold mt-1">265</p>
                        <p className="text-xs text-green-600 mt-1">↑ 12.8%</p>
                      </div>
                      <div className="p-4 border rounded-md">
                        <p className="text-sm text-muted-foreground">Bounce Rate</p>
                        <p className="text-2xl font-bold mt-1">24.5%</p>
                        <p className="text-xs text-green-600 mt-1">↓ 3.2%</p>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-sm font-medium mb-2">Top User Segments</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span>Active Traders (3+ alerts per week)</span>
                          <Badge>45%</Badge>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span>Content Consumers (heavy education users)</span>
                          <Badge>28%</Badge>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span>Portfolio Trackers (mainly use tracking)</span>
                          <Badge>18%</Badge>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span>Coaching Clients (regular coaching)</span>
                          <Badge>9%</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="col-span-1 lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Revenue Breakdown</CardTitle>
                  <CardDescription>Monthly revenue by type</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={revenueData}
                        margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => ["$" + value, "Revenue"]} />
                        <Area
                          type="monotone"
                          dataKey="recurringRevenue"
                          stackId="1"
                          stroke="#8884d8"
                          fill="#8884d8"
                          name="Recurring"
                        />
                        <Area
                          type="monotone"
                          dataKey="oneTimeRevenue"
                          stackId="1"
                          stroke="#82ca9d"
                          fill="#82ca9d"
                          name="One-time"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Revenue Metrics</CardTitle>
                  <CardDescription>Key financial performance indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 border rounded-md">
                        <p className="text-sm text-muted-foreground">Monthly Recurring Revenue</p>
                        <p className="text-2xl font-bold mt-1">$5,900</p>
                        <p className="text-xs text-green-600 mt-1">↑ 12.4%</p>
                      </div>
                      <div className="p-4 border rounded-md">
                        <p className="text-sm text-muted-foreground">Average Revenue Per User</p>
                        <p className="text-2xl font-bold mt-1">$24.80</p>
                        <p className="text-xs text-green-600 mt-1">↑ 5.2%</p>
                      </div>
                      <div className="p-4 border rounded-md">
                        <p className="text-sm text-muted-foreground">Annual Run Rate</p>
                        <p className="text-2xl font-bold mt-1">$81,600</p>
                        <p className="text-xs text-green-600 mt-1">↑ 15.8%</p>
                      </div>
                      <div className="p-4 border rounded-md">
                        <p className="text-sm text-muted-foreground">Lifetime Value</p>
                        <p className="text-2xl font-bold mt-1">$420</p>
                        <p className="text-xs text-green-600 mt-1">↑ 8.5%</p>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-sm font-medium mb-2">Revenue by Tier</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span>Paid Tier</span>
                          <Badge>$4,020 (59%)</Badge>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span>Premium Tier</span>
                          <Badge>$2,010 (29.5%)</Badge>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span>Mentorship Tier</span>
                          <Badge>$600 (8.8%)</Badge>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span>One-time Purchases</span>
                          <Badge>$170 (2.5%)</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Acquisition Costs</CardTitle>
                  <CardDescription>Marketing efficiency metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 border rounded-md">
                        <p className="text-sm text-muted-foreground">Customer Acquisition Cost</p>
                        <p className="text-2xl font-bold mt-1">$78.50</p>
                        <p className="text-xs text-green-600 mt-1">↓ 4.2%</p>
                      </div>
                      <div className="p-4 border rounded-md">
                        <p className="text-sm text-muted-foreground">LTV:CAC Ratio</p>
                        <p className="text-2xl font-bold mt-1">5.4:1</p>
                        <p className="text-xs text-green-600 mt-1">↑ 0.3</p>
                      </div>
                      <div className="p-4 border rounded-md">
                        <p className="text-sm text-muted-foreground">CAC Payback Period</p>
                        <p className="text-2xl font-bold mt-1">3.2 mo</p>
                        <p className="text-xs text-green-600 mt-1">↓ 0.4 mo</p>
                      </div>
                      <div className="p-4 border rounded-md">
                        <p className="text-sm text-muted-foreground">Marketing ROI</p>
                        <p className="text-2xl font-bold mt-1">345%</p>
                        <p className="text-xs text-green-600 mt-1">↑ 18%</p>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-sm font-medium mb-2">CAC by Channel</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span>Organic Search</span>
                          <Badge>$42.30</Badge>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span>Paid Social</span>
                          <Badge>$94.80</Badge>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span>Referrals</span>
                          <Badge>$28.40</Badge>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span>Content Marketing</span>
                          <Badge>$65.20</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Engagement Tab */}
          <TabsContent value="engagement" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">User Activity Patterns</CardTitle>
                  <CardDescription>Hourly activity patterns: weekday vs. weekend</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={userActivityData}
                        margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="weekday"
                          stroke="#8884d8"
                          strokeWidth={2}
                          name="Weekday"
                        />
                        <Line
                          type="monotone"
                          dataKey="weekend"
                          stroke="#82ca9d"
                          strokeWidth={2}
                          name="Weekend"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Feature Usage</CardTitle>
                  <CardDescription>Most used platform features</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>Stock Alerts</span>
                        <span className="font-medium">92%</span>
                      </div>
                      <Progress value={92} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>Portfolio Tracking</span>
                        <span className="font-medium">78%</span>
                      </div>
                      <Progress value={78} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>Educational Content</span>
                        <span className="font-medium">65%</span>
                      </div>
                      <Progress value={65} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>Coaching Sessions</span>
                        <span className="font-medium">23%</span>
                      </div>
                      <Progress value={23} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>Community Forum</span>
                        <span className="font-medium">42%</span>
                      </div>
                      <Progress value={42} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Engagement Metrics</CardTitle>
                  <CardDescription>Key engagement performance indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 border rounded-md">
                        <p className="text-sm text-muted-foreground">Daily Active Users</p>
                        <p className="text-2xl font-bold mt-1">168</p>
                        <p className="text-xs text-green-600 mt-1">↑ 8.4%</p>
                      </div>
                      <div className="p-4 border rounded-md">
                        <p className="text-sm text-muted-foreground">Weekly Active Users</p>
                        <p className="text-2xl font-bold mt-1">265</p>
                        <p className="text-xs text-green-600 mt-1">↑ 12.8%</p>
                      </div>
                      <div className="p-4 border rounded-md">
                        <p className="text-sm text-muted-foreground">DAU/MAU Ratio</p>
                        <p className="text-2xl font-bold mt-1">42.6%</p>
                        <p className="text-xs text-green-600 mt-1">↑ 3.2%</p>
                      </div>
                      <div className="p-4 border rounded-md">
                        <p className="text-sm text-muted-foreground">Avg. Sessions Per User</p>
                        <p className="text-2xl font-bold mt-1">4.3</p>
                        <p className="text-xs text-green-600 mt-1">↑ 0.5</p>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-sm font-medium mb-2">Top User Actions</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span>Viewing Stock Alerts</span>
                          <Badge>42.8%</Badge>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span>Checking Portfolio</span>
                          <Badge>28.3%</Badge>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span>Reading Educational Content</span>
                          <Badge>15.6%</Badge>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span>Setting Price Alerts</span>
                          <Badge>13.3%</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">User Retention</CardTitle>
                  <CardDescription>Cohort retention over time</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={retentionData}
                        margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip formatter={(value) => [`${value}%`, "Retention"]} />
                        <Line
                          type="monotone"
                          dataKey="retention"
                          stroke="#8884d8"
                          strokeWidth={2}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Content Performance</CardTitle>
                  <CardDescription>Educational content engagement metrics</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={educationContentEngagement}
                        margin={{ top: 20, right: 20, left: 20, bottom: 40 }}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis
                          dataKey="name"
                          type="category"
                          width={150}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip />
                        <Bar dataKey="views" name="Views" fill="#8884d8" barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Content Completion Rates</CardTitle>
                  <CardDescription>Percentage of content viewed to completion</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {educationContentEngagement.map((item, i) => (
                      <div key={i}>
                        <div className="flex justify-between mb-1 text-sm">
                          <span>{item.name}</span>
                          <span className="font-medium">{item.completion}%</span>
                        </div>
                        <Progress value={item.completion} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Content Metrics</CardTitle>
                  <CardDescription>Key content performance indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 border rounded-md">
                        <p className="text-sm text-muted-foreground">Avg. Engagement Time</p>
                        <p className="text-2xl font-bold mt-1">8.4 min</p>
                        <p className="text-xs text-green-600 mt-1">↑ 1.2 min</p>
                      </div>
                      <div className="p-4 border rounded-md">
                        <p className="text-sm text-muted-foreground">Avg. Completion Rate</p>
                        <p className="text-2xl font-bold mt-1">71.2%</p>
                        <p className="text-xs text-green-600 mt-1">↑ 4.3%</p>
                      </div>
                      <div className="p-4 border rounded-md">
                        <p className="text-sm text-muted-foreground">Content Satisfaction</p>
                        <p className="text-2xl font-bold mt-1">4.2/5</p>
                        <p className="text-xs text-green-600 mt-1">↑ 0.3</p>
                      </div>
                      <div className="p-4 border rounded-md">
                        <p className="text-sm text-muted-foreground">Learning Rate</p>
                        <p className="text-2xl font-bold mt-1">82%</p>
                        <p className="text-xs text-green-600 mt-1">↑ 5%</p>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-sm font-medium mb-2">Top Content Categories</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <span>Technical Analysis</span>
                            <Badge>38.4%</Badge>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span>Risk Management</span>
                            <Badge>24.7%</Badge>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span>Trading Psychology</span>
                            <Badge>18.3%</Badge>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <span>Beginner Level</span>
                            <Badge>42%</Badge>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span>Intermediate Level</span>
                            <Badge>38%</Badge>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span>Advanced Level</span>
                            <Badge>20%</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Content Requests</CardTitle>
                  <CardDescription>Most requested educational topics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h5 className="text-sm font-medium">Advanced Chart Patterns</h5>
                        <p className="text-xs text-muted-foreground">42 requests</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h5 className="text-sm font-medium">Options Trading Basics</h5>
                        <p className="text-xs text-muted-foreground">38 requests</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h5 className="text-sm font-medium">Scaling Strategies</h5>
                        <p className="text-xs text-muted-foreground">34 requests</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h5 className="text-sm font-medium">Sector Rotation</h5>
                        <p className="text-xs text-muted-foreground">29 requests</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h5 className="text-sm font-medium">Market Psychology</h5>
                        <p className="text-xs text-muted-foreground">25 requests</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Stock Alerts Tab */}
          <TabsContent value="alerts" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Alert Engagement</CardTitle>
                  <CardDescription>User interaction with stock alerts</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stockAlertEngagementData}
                        margin={{ top: 20, right: 20, left: 20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar
                          dataKey="engaged"
                          stackId="a"
                          fill="#8884d8"
                          name="Engaged (%)"
                        />
                        <Bar
                          dataKey="notEngaged"
                          stackId="a"
                          fill="#82ca9d"
                          name="Not Engaged (%)"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Top Performing Alerts</CardTitle>
                  <CardDescription>Alerts with highest success rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topPerformingAlerts.map((alert, i) => (
                      <div key={i}>
                        <div className="flex justify-between mb-1 text-sm">
                          <span>{alert.symbol}</span>
                          <div className="space-x-4 flex items-center">
                            <span>{alert.success}% Success</span>
                            <span className="font-medium text-green-600">
                              +{alert.avgReturn.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <Progress value={alert.success} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Alert Metrics</CardTitle>
                  <CardDescription>Key alert performance indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 border rounded-md">
                        <p className="text-sm text-muted-foreground">Avg. Success Rate</p>
                        <p className="text-2xl font-bold mt-1">78.5%</p>
                        <p className="text-xs text-green-600 mt-1">↑ 3.2%</p>
                      </div>
                      <div className="p-4 border rounded-md">
                        <p className="text-sm text-muted-foreground">Avg. Return</p>
                        <p className="text-2xl font-bold mt-1">12.4%</p>
                        <p className="text-xs text-green-600 mt-1">↑ 1.8%</p>
                      </div>
                      <div className="p-4 border rounded-md">
                        <p className="text-sm text-muted-foreground">Avg. Hold Time</p>
                        <p className="text-2xl font-bold mt-1">18 days</p>
                        <p className="text-xs text-green-600 mt-1">↓ 2 days</p>
                      </div>
                      <div className="p-4 border rounded-md">
                        <p className="text-sm text-muted-foreground">Target Hit Rate</p>
                        <p className="text-2xl font-bold mt-1">67%</p>
                        <p className="text-xs text-green-600 mt-1">↑ 4%</p>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-sm font-medium mb-2">Alert Categories</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <span>Growth Stocks</span>
                            <Badge>42.8%</Badge>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span>Tech Sector</span>
                            <Badge>38.3%</Badge>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span>Value Stocks</span>
                            <Badge>12.6%</Badge>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <span>Short-term Trades</span>
                            <Badge>45%</Badge>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span>Medium-term Trades</span>
                            <Badge>38%</Badge>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span>Long-term Trades</span>
                            <Badge>17%</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Recent Alert Feedback</CardTitle>
                  <CardDescription>User comments on recent alerts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 border rounded-md">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">NVDA</Badge>
                        <p className="text-xs text-muted-foreground">2 days ago</p>
                      </div>
                      <p className="text-sm mt-2">
                        "Great call on the entry point. Got in at $950 and already up 2%. The analysis was spot on."
                      </p>
                    </div>
                    <div className="p-3 border rounded-md">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">AAPL</Badge>
                        <p className="text-xs text-muted-foreground">3 days ago</p>
                      </div>
                      <p className="text-sm mt-2">
                        "Hit the first target perfectly. Looking forward to seeing if it reaches the second target."
                      </p>
                    </div>
                    <div className="p-3 border rounded-md">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">MSFT</Badge>
                        <p className="text-xs text-muted-foreground">5 days ago</p>
                      </div>
                      <p className="text-sm mt-2">
                        "The technical analysis helped me understand why this was a good entry. Would appreciate more detail on exit strategies."
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}