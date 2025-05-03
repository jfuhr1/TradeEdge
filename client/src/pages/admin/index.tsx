import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BellRing,
  BookOpenText,
  Calendar,
  FileText,
  Plus,
  User,
  Users,
} from "lucide-react";
import { StockAlert, User as UserType } from "@shared/schema";

export default function AdminDashboard() {
  const { currentUserPermissions, isLoadingPermissions } = useAdminPermissions();

  // Fetch active alerts
  const {
    data: alerts,
    isLoading: isLoadingAlerts,
  } = useQuery<StockAlert[]>({
    queryKey: ['/api/stock-alerts'],
    enabled: true,
  });

  // Fetch users (admin only)
  const {
    data: users,
    isLoading: isLoadingUsers,
  } = useQuery<UserType[]>({
    queryKey: ['/api/admin/users'],
    enabled: !!currentUserPermissions?.canManageUsers,
  });

  // Fetch admin users only
  const {
    data: adminUsers,
    isLoading: isLoadingAdminUsers,
  } = useQuery<UserType[]>({
    queryKey: ['/api/admin/users/admins'],
    enabled: !!currentUserPermissions?.canManageAdmins,
  });

  // Fetch alert performance
  const {
    data: alertPerformance,
    isLoading: isLoadingPerformance,
  } = useQuery<any>({
    queryKey: ['/api/admin/alert-performance'],
    enabled: true,
  });

  const stats = [
    {
      name: "Active Alerts",
      value: alerts?.filter(alert => alert.status !== 'closed').length || 0,
      icon: <BellRing className="h-5 w-5 text-primary" />,
      showWhen: () => true,
      linkTo: "/admin/alerts",
    },
    {
      name: "Closed Alerts",
      value: alerts?.filter(alert => alert.status === 'closed').length || 0,
      icon: <Activity className="h-5 w-5 text-primary" />,
      showWhen: () => true,
      linkTo: "/admin/alerts?status=closed",
    },
    {
      name: "Total Users",
      value: users?.length || 0,
      icon: <Users className="h-5 w-5 text-primary" />,
      showWhen: () => !!currentUserPermissions?.canManageUsers,
      linkTo: "/admin/users",
    },
    {
      name: "Admin Users",
      value: adminUsers?.length || 0,
      icon: <User className="h-5 w-5 text-primary" />,
      showWhen: () => !!currentUserPermissions?.canManageAdmins,
      linkTo: "/admin/users?tab=admin-users",
    },
    {
      name: "Success Rate",
      value: alertPerformance ? 
        `${Math.round(alertPerformance.successRate * 100)}%` : 
        'N/A',
      icon: <BarChart3 className="h-5 w-5 text-primary" />,
      showWhen: () => !!currentUserPermissions?.canViewAnalytics,
      linkTo: "/admin/performance",
    },
  ];

  return (
    <AdminLayout>
      <div className="grid gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of platform metrics and recent activity
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {stats
            .filter(stat => stat.showWhen())
            .map((stat, index) => (
              <Card key={index} className="shadow-sm">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium">
                    {stat.name}
                  </CardTitle>
                  {stat.icon}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
                <CardFooter className="pt-1">
                  <Link href={stat.linkTo}>
                    <a className="text-xs text-muted-foreground hover:text-primary flex items-center">
                      View details
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </a>
                  </Link>
                </CardFooter>
              </Card>
            ))}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {currentUserPermissions?.canCreateAlerts && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <BellRing className="h-5 w-5 mr-2" />
                  Stock Alerts
                </CardTitle>
                <CardDescription>
                  Manage alerts for subscribers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  {isLoadingAlerts ? (
                    <p>Loading alerts...</p>
                  ) : (
                    <p>{alerts?.filter(alert => alert.status !== 'closed').length || 0} active alerts available</p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Link href="/admin/alerts">
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
                {currentUserPermissions?.canCreateAlerts && (
                  <Link href="/admin/alerts/create">
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      New Alert
                    </Button>
                  </Link>
                )}
              </CardFooter>
            </Card>
          )}

          {(currentUserPermissions?.canCreateEducation || currentUserPermissions?.canEditEducation) && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <BookOpenText className="h-5 w-5 mr-2" />
                  Education
                </CardTitle>
                <CardDescription>
                  Manage educational content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <p>Training, lessons, and guides</p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Link href="/admin/education">
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
                {currentUserPermissions?.canCreateEducation && (
                  <Link href="/admin/education/create">
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      New Content
                    </Button>
                  </Link>
                )}
              </CardFooter>
            </Card>
          )}

          {(currentUserPermissions?.canCreateArticles || currentUserPermissions?.canEditArticles) && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <FileText className="h-5 w-5 mr-2" />
                  Articles
                </CardTitle>
                <CardDescription>
                  Manage news and articles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <p>Market news and analysis content</p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Link href="/admin/articles">
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
                {currentUserPermissions?.canCreateArticles && (
                  <Link href="/admin/articles/create">
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      New Article
                    </Button>
                  </Link>
                )}
              </CardFooter>
            </Card>
          )}

          {(currentUserPermissions?.canManageCoaching || currentUserPermissions?.canManageGroupSessions) && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Calendar className="h-5 w-5 mr-2" />
                  Coaching
                </CardTitle>
                <CardDescription>
                  Manage coaching sessions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <p>Schedule and manage coaching</p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Link href="/admin/coaching">
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
                <Link href="/admin/coaching/schedule">
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Schedule
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          )}
        </div>

        {/* Recent Activity and Alerts */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Stock Alerts */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Recent Stock Alerts</CardTitle>
              <CardDescription>
                Latest stock alerts added to the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-0">
                {isLoadingAlerts ? (
                  <div className="flex justify-center p-4">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : (
                  <div className="divide-y">
                    {alerts?.slice(0, 5).map((alert) => (
                      <div key={alert.id} className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                          <div className="rounded-full bg-primary/10 p-2">
                            <BellRing className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium leading-none">
                              {alert.companyName} ({alert.symbol})
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {alert.currentPrice ? `$${alert.currentPrice.toFixed(2)}` : 'N/A'} | Target: ${alert.target1.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <Badge variant={alert.status === 'active' ? 'default' : alert.status === 'closed' ? 'secondary' : 'outline'}>
                          {alert.status || 'Active'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/50 px-6 py-3">
              <Link href="/admin/alerts">
                <a className="text-xs text-muted-foreground hover:text-primary flex items-center">
                  View all alerts
                  <ArrowRight className="h-3 w-3 ml-1" />
                </a>
              </Link>
            </CardFooter>
          </Card>

          {/* Recent Platform Activity */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Platform Activity</CardTitle>
              <CardDescription>
                Recent actions and notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="alerts" className="w-full">
                <div className="px-6 pt-2">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="alerts">Alerts</TabsTrigger>
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsTrigger value="system">System</TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="alerts" className="p-0">
                  <div className="divide-y">
                    {isLoadingAlerts ? (
                      <div className="flex justify-center p-4">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center p-4">
                          <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                          <div>
                            <p className="text-sm font-medium leading-none">
                              3 alerts approaching target price
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Consider updating target prices or closing alerts
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center p-4">
                          <Activity className="h-5 w-5 text-green-500 mr-2" />
                          <div>
                            <p className="text-sm font-medium leading-none">
                              2 alerts hit their target this week
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Updated success rate metrics available
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="users" className="p-0">
                  <div className="divide-y">
                    <div className="flex items-center p-4">
                      <Users className="h-5 w-5 text-primary mr-2" />
                      <div>
                        <p className="text-sm font-medium leading-none">
                          5 new users joined this week
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          2 upgraded to premium membership
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center p-4">
                      <Calendar className="h-5 w-5 text-primary mr-2" />
                      <div>
                        <p className="text-sm font-medium leading-none">
                          3 coaching sessions scheduled
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Review the coaching calendar
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="system" className="p-0">
                  <div className="divide-y">
                    <div className="flex items-center p-4">
                      <Activity className="h-5 w-5 text-green-500 mr-2" />
                      <div>
                        <p className="text-sm font-medium leading-none">
                          System performance is optimal
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          All services running correctly
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center p-4">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                      <div>
                        <p className="text-sm font-medium leading-none">
                          API rate limits at 60% capacity
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Consider optimizing requests
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="border-t bg-muted/50 px-6 py-3">
              <Link href="/admin/activity">
                <a className="text-xs text-muted-foreground hover:text-primary flex items-center">
                  View all activity
                  <ArrowRight className="h-3 w-3 ml-1" />
                </a>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}