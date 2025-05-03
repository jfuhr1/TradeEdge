import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Loader2, Calendar, Clock, Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock data - this would come from your API
const pageViewsData = [
  { name: "Stock Alerts", views: 1285, timeSpent: 195 },
  { name: "Dashboard", views: 978, timeSpent: 120 },
  { name: "Education", views: 842, timeSpent: 310 },
  { name: "Coaching", views: 524, timeSpent: 85 },
  { name: "Portfolio", views: 456, timeSpent: 145 },
  { name: "Success Center", views: 392, timeSpent: 95 },
];

const dailyActiveUsers = [
  { date: "05/01", users: 158 },
  { date: "05/02", users: 165 },
  { date: "05/03", users: 172 },
  { date: "05/04", users: 180 },
  { date: "05/05", users: 185 },
  { date: "05/06", users: 182 },
  { date: "05/07", users: 195 },
];

const membershipsData = [
  { name: "Free", value: 212, color: "#94a3b8" },
  { name: "Paid", value: 82, color: "#60a5fa" },
  { name: "Premium", value: 29, color: "#a855f7" },
  { name: "Mentorship", value: 5, color: "#f59e0b" },
];

const alertEngagementData = [
  { name: "AAPL", views: 218, saves: 42, comments: 18 },
  { name: "TSLA", views: 195, saves: 38, comments: 15 },
  { name: "NVDA", views: 187, saves: 35, comments: 12 },
  { name: "MSFT", views: 172, saves: 31, comments: 10 },
  { name: "AMZN", views: 165, saves: 29, comments: 8 },
];

// Formats time in seconds to mm:ss format
const formatTimeSpent = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("7d");
  const [activeTab, setActiveTab] = useState("overview");

  // In a real application, these would be API calls with the timeRange as a parameter
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ["/api/admin/analytics", timeRange],
    // This would be enabled in a real implementation
    enabled: false,
  });

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Analytics & Insights</h1>
            <p className="text-muted-foreground">
              Track platform usage and user engagement
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
                <SelectItem value="1y">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pages">Page Analytics</TabsTrigger>
            <TabsTrigger value="alerts">Alert Engagement</TabsTrigger>
            <TabsTrigger value="users">User Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Users
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">328</div>
                  <p className="text-xs text-muted-foreground">
                    +5.2% from last week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Page Views
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">4,827</div>
                  <p className="text-xs text-muted-foreground">
                    +12.4% from last week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Avg. Session Time
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">8:42</div>
                  <p className="text-xs text-muted-foreground">
                    +1:24 from last week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Alert Engagement
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">76.4%</div>
                  <p className="text-xs text-muted-foreground">
                    +3.2% from last week
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Active Users Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Active Users</CardTitle>
                <CardDescription>
                  Number of unique users per day over the last week
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={dailyActiveUsers}
                      margin={{
                        top: 5,
                        right: 10,
                        left: 10,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="users"
                        stroke="#1E88E5"
                        activeDot={{ r: 8 }}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Membership Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Membership Distribution</CardTitle>
                <CardDescription>
                  Breakdown of user membership tiers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={membershipsData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({
                          cx,
                          cy,
                          midAngle,
                          innerRadius,
                          outerRadius,
                          percent,
                          index,
                        }) => {
                          const radius =
                            innerRadius + (outerRadius - innerRadius) * 0.5;
                          const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                          const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                          return (
                            <text
                              x={x}
                              y={y}
                              fill="#fff"
                              textAnchor={x > cx ? "start" : "end"}
                              dominantBaseline="central"
                            >
                              {membershipsData[index].name} ({(percent * 100).toFixed(0)}%)
                            </text>
                          );
                        }}
                      >
                        {membershipsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pages" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Page Views & Time Spent</CardTitle>
                <CardDescription>
                  Most viewed pages and average time spent on each
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={pageViewsData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" stroke="#1E88E5" />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#00C853"
                      />
                      <Tooltip
                        formatter={(value, name) => {
                          if (name === "timeSpent") {
                            return [formatTimeSpent(value as number), "Avg. Time Spent"];
                          }
                          return [value, name === "views" ? "Page Views" : name];
                        }}
                      />
                      <Legend />
                      <Bar
                        yAxisId="left"
                        dataKey="views"
                        name="Page Views"
                        fill="#1E88E5"
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="timeSpent"
                        name="Avg. Time Spent (sec)"
                        fill="#00C853"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Most Viewed Pages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pageViewsData
                      .sort((a, b) => b.views - a.views)
                      .map((page, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between border-b pb-2"
                        >
                          <div className="flex items-center">
                            <div className="w-6 text-muted-foreground">{i + 1}.</div>
                            <div>{page.name}</div>
                          </div>
                          <div>{page.views.toLocaleString()} views</div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Highest Engagement Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pageViewsData
                      .sort((a, b) => b.timeSpent - a.timeSpent)
                      .map((page, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between border-b pb-2"
                        >
                          <div className="flex items-center">
                            <div className="w-6 text-muted-foreground">{i + 1}.</div>
                            <div>{page.name}</div>
                          </div>
                          <div>{formatTimeSpent(page.timeSpent)}</div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Alert Engagement Metrics</CardTitle>
                <CardDescription>
                  User interaction with stock alerts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={alertEngagementData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="views" name="Views" fill="#1E88E5" />
                      <Bar dataKey="saves" name="Portfolio Adds" fill="#00C853" />
                      <Bar dataKey="comments" name="Comments" fill="#FFB300" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Average Alert Views
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">187.4</div>
                  <p className="text-xs text-muted-foreground">
                    Per stock alert
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Portfolio Add Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">18.7%</div>
                  <p className="text-xs text-muted-foreground">
                    Alerts added to portfolios
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Comment Engagement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">6.8%</div>
                  <p className="text-xs text-muted-foreground">
                    Alerts receiving comments
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Retention</CardTitle>
                  <CardDescription>
                    Weekly retention rate by membership tier
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[
                          { week: "W1", free: 45, paid: 78, premium: 92, mentorship: 100 },
                          { week: "W2", free: 38, paid: 76, premium: 92, mentorship: 100 },
                          { week: "W3", free: 32, paid: 74, premium: 90, mentorship: 98 },
                          { week: "W4", free: 28, paid: 71, premium: 90, mentorship: 98 },
                        ]}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="free"
                          name="Free"
                          stroke="#94a3b8"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="paid"
                          name="Paid"
                          stroke="#60a5fa"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="premium"
                          name="Premium"
                          stroke="#a855f7"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="mentorship"
                          name="Mentorship"
                          stroke="#f59e0b"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Session Duration</CardTitle>
                  <CardDescription>
                    Average session length by membership tier (minutes)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: "Free", value: 8.5 },
                          { name: "Paid", value: 12.2 },
                          { name: "Premium", value: 18.7 },
                          { name: "Mentorship", value: 24.5 },
                        ]}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" name="Minutes" fill="#1E88E5" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>User Activity by Hour</CardTitle>
                <CardDescription>
                  Active users by hour of day
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[
                        { hour: "00:00", users: 48 },
                        { hour: "02:00", users: 22 },
                        { hour: "04:00", users: 12 },
                        { hour: "06:00", users: 35 },
                        { hour: "08:00", users: 87 },
                        { hour: "10:00", users: 152 },
                        { hour: "12:00", users: 118 },
                        { hour: "14:00", users: 98 },
                        { hour: "16:00", users: 124 },
                        { hour: "18:00", users: 165 },
                        { hour: "20:00", users: 185 },
                        { hour: "22:00", users: 103 },
                      ]}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="users"
                        stroke="#1E88E5"
                        activeDot={{ r: 8 }}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}