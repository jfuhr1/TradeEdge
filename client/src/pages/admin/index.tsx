import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart3,
  Users,
  BellRing,
  GraduationCap,
  CalendarDays,
  FileText,
  ChevronRight,
  MoreHorizontal,
  Plus,
  X,
  EyeOff,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2 } from "lucide-react";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";

export default function AdminIndex() {
  const { hasPermission } = useAdminPermissions();
  
  // State for toggling card visibility
  const [visibleCards, setVisibleCards] = useState({
    users: true,
    alerts: true,
    education: true,
    coaching: true,
    analytics: true,
  });

  // Toggle card visibility
  const toggleCardVisibility = (cardKey: keyof typeof visibleCards) => {
    setVisibleCards({
      ...visibleCards,
      [cardKey]: !visibleCards[cardKey],
    });
  };

  // Mock data - these would be API calls in a real implementation
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/admin/dashboard/users"],
    // In a real app, this would be enabled
    enabled: false,
  });

  const { data: alertsData, isLoading: isLoadingAlerts } = useQuery({
    queryKey: ["/api/admin/dashboard/alerts"],
    enabled: false,
  });

  const { data: educationData, isLoading: isLoadingEducation } = useQuery({
    queryKey: ["/api/admin/dashboard/education"],
    enabled: false,
  });

  const { data: coachingData, isLoading: isLoadingCoaching } = useQuery({
    queryKey: ["/api/admin/dashboard/coaching"],
    enabled: false,
  });

  const { data: analyticsData, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ["/api/admin/dashboard/analytics"],
    enabled: false,
  });

  // Mock data until the API endpoints are implemented
  const mockUsersData = {
    totalUsers: 328,
    newThisWeek: 42,
    tierDistribution: {
      free: 212,
      paid: 82,
      premium: 29,
      mentorship: 5,
    },
  };

  const mockAlertsData = {
    totalAlerts: 15,
    activeAlerts: 8,
    closedAlerts: 7,
    recentAlerts: [
      { id: 1, symbol: "AAPL", status: "active" },
      { id: 2, symbol: "TSLA", status: "active" },
      { id: 3, symbol: "MSFT", status: "closed" },
    ],
  };

  const mockEducationData = {
    totalContent: 24,
    viewsThisWeek: 856,
    categories: {
      beginner: 10,
      intermediate: 8,
      advanced: 6,
    },
  };

  const mockCoachingData = {
    upcomingSessions: 8,
    completedThisMonth: 32,
    totalRevenue: "$16,400",
    bookedGroupSessions: 4,
  };

  const mockAnalyticsData = {
    activeUsers: 185,
    pageViews: 4827,
    avgSessionTime: "8:42",
    engagementRate: "76.4%",
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of platform metrics and management tools
            </p>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreHorizontal className="h-4 w-4 mr-2" />
                Customize View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Toggle Sections</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => toggleCardVisibility("users")}>
                {visibleCards.users ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {visibleCards.users ? "Hide" : "Show"} Users
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleCardVisibility("alerts")}>
                {visibleCards.alerts ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {visibleCards.alerts ? "Hide" : "Show"} Alerts
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleCardVisibility("education")}>
                {visibleCards.education ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {visibleCards.education ? "Hide" : "Show"} Education
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleCardVisibility("coaching")}>
                {visibleCards.coaching ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {visibleCards.coaching ? "Hide" : "Show"} Coaching
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleCardVisibility("analytics")}>
                {visibleCards.analytics ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {visibleCards.analytics ? "Hide" : "Show"} Analytics
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Users Card */}
          {visibleCards.users && hasPermission("canManageUsers") && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-medium">Users</CardTitle>
                  <CardDescription>
                    Manage platform users and permissions
                  </CardDescription>
                </div>
                <Users className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoadingUsers ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-8 w-8 animate-spin text-muted" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Users</span>
                      <span className="font-medium">{mockUsersData.totalUsers}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">New This Week</span>
                      <span className="font-medium">{mockUsersData.newThisWeek}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Premium Users</span>
                      <span className="font-medium">{mockUsersData.tierDistribution.premium + mockUsersData.tierDistribution.mentorship}</span>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Link href="/admin/users">
                  <Button variant="ghost" className="w-full">
                    View All Users
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          )}

          {/* Alerts Card */}
          {visibleCards.alerts && hasPermission("canCreateAlerts") && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-medium">Stock Alerts</CardTitle>
                  <CardDescription>
                    Manage stock alerts and recommendations
                  </CardDescription>
                </div>
                <BellRing className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoadingAlerts ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-8 w-8 animate-spin text-muted" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Active Alerts</span>
                      <span className="font-medium">{mockAlertsData.activeAlerts}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Alerts</span>
                      <span className="font-medium">{mockAlertsData.totalAlerts}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">User Saves</span>
                      <span className="font-medium">428</span>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Link href="/admin/alerts">
                  <Button variant="ghost">
                    View Alerts
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                {hasPermission("canCreateAlerts") && (
                  <Link href="/admin/alerts/new">
                    <Button variant="outline" size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </CardFooter>
            </Card>
          )}

          {/* Education Card */}
          {visibleCards.education && hasPermission("canCreateEducation") && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-medium">Education</CardTitle>
                  <CardDescription>
                    Manage educational content and resources
                  </CardDescription>
                </div>
                <GraduationCap className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoadingEducation ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-8 w-8 animate-spin text-muted" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Content Items</span>
                      <span className="font-medium">{mockEducationData.totalContent}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Views This Week</span>
                      <span className="font-medium">{mockEducationData.viewsThisWeek}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Average Completion</span>
                      <span className="font-medium">68%</span>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Link href="/admin/education">
                  <Button variant="ghost">
                    View Education
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                {hasPermission("canCreateEducation") && (
                  <Link href="/admin/education/new">
                    <Button variant="outline" size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </CardFooter>
            </Card>
          )}

          {/* Coaching Card */}
          {visibleCards.coaching && hasPermission("canManageCoaching") && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-medium">Coaching</CardTitle>
                  <CardDescription>
                    Manage coaching sessions and bookings
                  </CardDescription>
                </div>
                <CalendarDays className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoadingCoaching ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-8 w-8 animate-spin text-muted" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Upcoming Sessions</span>
                      <span className="font-medium">{mockCoachingData.upcomingSessions}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Monthly Sessions</span>
                      <span className="font-medium">{mockCoachingData.completedThisMonth}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Group Sessions</span>
                      <span className="font-medium">{mockCoachingData.bookedGroupSessions}</span>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Link href="/admin/coaching">
                  <Button variant="ghost">
                    View Sessions
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                {hasPermission("canManageCoaching") && (
                  <Link href="/admin/coaching/new">
                    <Button variant="outline" size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </CardFooter>
            </Card>
          )}

          {/* Analytics Card */}
          {visibleCards.analytics && hasPermission("canViewAnalytics") && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-medium">Analytics</CardTitle>
                  <CardDescription>
                    Insights and platform performance
                  </CardDescription>
                </div>
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoadingAnalytics ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-8 w-8 animate-spin text-muted" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Active Users</span>
                      <span className="font-medium">{mockAnalyticsData.activeUsers}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Page Views</span>
                      <span className="font-medium">{mockAnalyticsData.pageViews}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Avg. Session Time</span>
                      <span className="font-medium">{mockAnalyticsData.avgSessionTime}</span>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Link href="/admin/analytics">
                  <Button variant="ghost" className="w-full">
                    View Analytics
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          )}

          {/* Content Card */}
          {visibleCards.analytics && hasPermission("canCreateContent") && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-medium">Content</CardTitle>
                  <CardDescription>
                    Manage articles and blog content
                  </CardDescription>
                </div>
                <FileText className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Published Articles</span>
                    <span className="font-medium">18</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Drafts</span>
                    <span className="font-medium">4</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Article Reads</span>
                    <span className="font-medium">2,356</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Link href="/admin/content">
                  <Button variant="ghost">
                    View Content
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                {hasPermission("canCreateContent") && (
                  <Link href="/admin/content/new">
                    <Button variant="outline" size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}