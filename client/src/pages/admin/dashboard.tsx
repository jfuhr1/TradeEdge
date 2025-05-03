import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import MainLayout from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Users, Book, FileText, LineChart, Calendar, Plus, Settings, AlertTriangle, Check, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';

export default function AdminDashboard() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  
  // Get demo mode state from localStorage
  const isDemoMode = localStorage.getItem('demoMode') === 'true';
  
  // Check if user is admin or using demo mode
  useEffect(() => {
    async function checkAdminStatus() {
      // If we've already checked or are in demo mode, no need to check again
      if (isAdmin !== null || isDemoMode) {
        if (isDemoMode) {
          // In demo mode, automatically grant admin access
          setIsAdmin(true);
        }
        return;
      }
      
      try {
        // Only make the API call once
        const res = await apiRequest('GET', '/api/user/is-admin');
        const data = await res.json();
        setIsAdmin(data.isAdmin);
        
        if (!data.isAdmin) {
          toast({
            title: 'Access Denied',
            description: 'You do not have permission to access this page.',
            variant: 'destructive'
          });
        }
      } catch (error) {
        // Only show the toast on the first error
        if (isAdmin === null) {
          setIsAdmin(false);
          toast({
            title: 'Access Denied',
            description: 'Access restricted. Enable demo mode to try this feature.',
            variant: 'destructive'
          });
        }
      }
    }
    
    checkAdminStatus();
  }, [toast, isAdmin, isDemoMode]);

  // Fetch stock alerts stats
  const { data: stockAlerts, isLoading: isLoadingAlerts } = useQuery({
    queryKey: ['/api/stock-alerts'],
    enabled: isAdmin === true || isDemoMode
  });

  // Fetch education content count
  const { data: educationContent, isLoading: isLoadingEducation } = useQuery({
    queryKey: ['/api/education'],
    enabled: isAdmin === true || isDemoMode
  });

  // Fetch coaching sessions count
  const { data: coachingSessions, isLoading: isLoadingCoaching } = useQuery({
    queryKey: ['/api/coaching/group-sessions'],
    enabled: isAdmin === true || isDemoMode
  });

  // Fetch alert performance data
  const { data: alertPerformance, isLoading: isLoadingPerformance } = useQuery({
    queryKey: ['/api/admin/alert-performance'],
    enabled: isAdmin === true || isDemoMode,
    // If this fails, provide some fallback data for demo mode
    onError: (error) => {
      if (isDemoMode) {
        console.log('Demo mode: Would show alert performance data');
      }
    }
  });

  // Check if user is logged in
  if (authLoading) {
    return (
      <MainLayout title="Loading" description="Checking authentication">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    return (
      <MainLayout title="Authentication Required" description="Please log in">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-amber-600">Authentication Required</CardTitle>
            </CardHeader>
            <CardContent>
              <p>You need to be logged in to access this page.</p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => window.location.href = "/auth"}>Go to Login</Button>
            </CardFooter>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Show access denied message if not admin
  if (isAdmin === false) {
    return (
      <MainLayout title="Access Denied" description="Admin access required">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <p>You do not have permission to access this page. Only administrators can access the admin dashboard.</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={() => window.location.href = "/"}>Return to Dashboard</Button>
            </CardFooter>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Show loading state while checking admin status
  if (isAdmin === null) {
    return (
      <MainLayout title="Loading" description="Checking permissions">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Checking permissions...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Admin Dashboard" description="TradeEdge Pro Admin Panel">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage stock alerts, education content, coaching sessions and more.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
                Active Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{isLoadingAlerts ? '...' : stockAlerts?.length || 0}</div>
              <p className="text-sm text-muted-foreground">Stock picks being tracked by users</p>
            </CardContent>
            <CardFooter>
              <Button asChild size="sm" variant="outline" className="w-full">
                <Link href="/admin/create-alert">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Alert
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Book className="mr-2 h-5 w-5 text-blue-500" />
                Education Materials
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{isLoadingEducation ? '...' : educationContent?.length || 0}</div>
              <p className="text-sm text-muted-foreground">Articles, videos, and training modules</p>
            </CardContent>
            <CardFooter>
              <Button asChild size="sm" variant="outline" className="w-full">
                <Link href="/admin/education">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Education Content
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Calendar className="mr-2 h-5 w-5 text-green-500" />
                Coaching Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{isLoadingCoaching ? '...' : coachingSessions?.length || 0}</div>
              <p className="text-sm text-muted-foreground">Upcoming and scheduled coaching sessions</p>
            </CardContent>
            <CardFooter>
              <Button asChild size="sm" variant="outline" className="w-full">
                <Link href="/admin/coaching">
                  <Plus className="mr-2 h-4 w-4" />
                  Schedule New Session
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        <Tabs defaultValue="alerts" className="w-full">
          <TabsList className="grid grid-cols-5 mb-8">
            <TabsTrigger value="alerts">Stock Alerts</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
            <TabsTrigger value="articles">Articles</TabsTrigger>
            <TabsTrigger value="performance">Alert Performance</TabsTrigger>
            <TabsTrigger value="coaching">Coaching</TabsTrigger>
          </TabsList>
          
          <TabsContent value="alerts" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Stock Alerts Management</h2>
              <div className="flex gap-2">
                <Button asChild>
                  <Link href="/admin/create-alert">
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Alert
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/admin/alerts">
                    <Settings className="mr-2 h-4 w-4" />
                    Manage Alerts
                  </Link>
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Check className="mr-2 h-5 w-5 text-green-500" />
                    Active Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">{isLoadingAlerts ? '...' : stockAlerts?.filter(a => a.status === 'active')?.length || 0}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Clock className="mr-2 h-5 w-5 text-amber-500" />
                    Pending Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">{isLoadingAlerts ? '...' : stockAlerts?.filter(a => a.status === 'pending')?.length || 0}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Check className="mr-2 h-5 w-5 text-blue-500" />
                    Closed Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">{isLoadingAlerts ? '...' : stockAlerts?.filter(a => a.status === 'closed')?.length || 0}</p>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Stock Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingAlerts ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="border rounded-md">
                    <div className="grid grid-cols-5 font-medium text-sm bg-muted p-3 border-b">
                      <div>Symbol</div>
                      <div>Name</div>
                      <div>Buy Zone</div>
                      <div>Current Price</div>
                      <div>Status</div>
                    </div>
                    <div className="divide-y">
                      {stockAlerts && stockAlerts.length > 0 ? (
                        stockAlerts.slice(0, 5).map((alert) => (
                          <div key={alert.id} className="grid grid-cols-5 py-3 px-3 text-sm">
                            <div className="font-medium">{alert.symbol}</div>
                            <div>{alert.companyName}</div>
                            <div>${alert.buyZoneMin} - ${alert.buyZoneMax}</div>
                            <div>${alert.currentPrice?.toFixed(2)}</div>
                            <div>
                              <span 
                                className={`px-2 py-1 rounded-full text-xs ${
                                  alert.status === 'active' 
                                    ? 'bg-green-100 text-green-800' 
                                    : alert.status === 'pending' 
                                    ? 'bg-amber-100 text-amber-800' 
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {alert.status}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-4 text-center text-muted-foreground">
                          No stock alerts found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/admin/alerts">View All Alerts</Link>
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="education" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Education Content Management</h2>
              <div className="flex gap-2">
                <Button asChild>
                  <Link href="/admin/education/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Content
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/admin/education">
                    <Settings className="mr-2 h-4 w-4" />
                    Manage Education
                  </Link>
                </Button>
              </div>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Education Materials</CardTitle>
                <CardDescription>Manage courses, videos, and training materials</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingEducation ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="border rounded-md">
                    <div className="grid grid-cols-4 font-medium text-sm bg-muted p-3 border-b">
                      <div>Title</div>
                      <div>Type</div>
                      <div>Level</div>
                      <div>Category</div>
                    </div>
                    <div className="divide-y">
                      {educationContent && educationContent.length > 0 ? (
                        educationContent.slice(0, 5).map((content) => (
                          <div key={content.id} className="grid grid-cols-4 py-3 px-3 text-sm">
                            <div className="font-medium">{content.title}</div>
                            <div>{content.type}</div>
                            <div>{content.level}</div>
                            <div>{content.category}</div>
                          </div>
                        ))
                      ) : (
                        <div className="py-4 text-center text-muted-foreground">
                          No education content found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/admin/education">View All Education Content</Link>
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="articles" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Articles Management</h2>
              <div className="flex gap-2">
                <Button asChild>
                  <Link href="/admin/articles/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Article
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/admin/articles">
                    <Settings className="mr-2 h-4 w-4" />
                    Manage Articles
                  </Link>
                </Button>
              </div>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Articles</CardTitle>
                <CardDescription>Manage market analysis, strategy guides, and user insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md">
                  <div className="grid grid-cols-3 font-medium text-sm bg-muted p-3 border-b">
                    <div>Title</div>
                    <div>Category</div>
                    <div>Published</div>
                  </div>
                  <div className="divide-y">
                    <div className="py-4 text-center text-muted-foreground">
                      Content will appear here once articles are created
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/admin/articles">View All Articles</Link>
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="performance" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Alert Performance Dashboard</h2>
              <Button asChild variant="outline">
                <Link href="/admin/performance">
                  <LineChart className="mr-2 h-4 w-4" />
                  View Detailed Analytics
                </Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Alerts Issues</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">
                    {isLoadingPerformance ? '...' : isDemoMode ? '87' : '0'}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Avg. Gain/Alert</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold text-green-600">
                    {isLoadingPerformance ? '...' : isDemoMode ? '+18.3%' : '0%'}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Success Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">
                    {isLoadingPerformance ? '...' : isDemoMode ? '76%' : '0%'}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Avg. Hold Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">
                    {isLoadingPerformance ? '...' : isDemoMode ? '47 days' : '0 days'}
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Alert Performance</CardTitle>
                <CardDescription>Track performance metrics for all stock alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md">
                  <div className="grid grid-cols-6 font-medium text-sm bg-muted p-3 border-b">
                    <div>Symbol</div>
                    <div>Target Hits</div>
                    <div>Buy Zone Entries</div>
                    <div>Avg. Gain</div>
                    <div>Hit Rate</div>
                    <div>Hold Time</div>
                  </div>
                  <div className="divide-y">
                    {isDemoMode ? (
                      <>
                        <div className="grid grid-cols-6 py-3 px-3 text-sm">
                          <div className="font-medium">AAPL</div>
                          <div>T1, T2</div>
                          <div>24 users</div>
                          <div className="text-green-600">+14.2%</div>
                          <div>83%</div>
                          <div>34 days</div>
                        </div>
                        <div className="grid grid-cols-6 py-3 px-3 text-sm">
                          <div className="font-medium">MSFT</div>
                          <div>T1, T2, T3</div>
                          <div>18 users</div>
                          <div className="text-green-600">+22.8%</div>
                          <div>94%</div>
                          <div>51 days</div>
                        </div>
                        <div className="grid grid-cols-6 py-3 px-3 text-sm">
                          <div className="font-medium">NVDA</div>
                          <div>T1</div>
                          <div>31 users</div>
                          <div className="text-green-600">+8.4%</div>
                          <div>65%</div>
                          <div>29 days</div>
                        </div>
                      </>
                    ) : (
                      <div className="py-4 text-center text-muted-foreground">
                        Performance data will appear here once alerts are created and tracked
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/admin/performance">View Full Performance Data</Link>
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="coaching" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Coaching Sessions Management</h2>
              <div className="flex gap-2">
                <Button asChild>
                  <Link href="/admin/coaching/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Schedule New Session
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/admin/coaching">
                    <Settings className="mr-2 h-4 w-4" />
                    Manage Sessions
                  </Link>
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Upcoming Group Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">
                    {isLoadingCoaching ? '...' : coachingSessions?.filter(s => new Date(s.date) > new Date())?.length || 0}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Registrations</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">
                    {isLoadingCoaching ? '...' : isDemoMode ? '47' : '0'}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Next Session</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">
                    {isLoadingCoaching ? '...' : 
                      coachingSessions && coachingSessions.length > 0 
                        ? new Date(coachingSessions[0].date).toLocaleDateString() 
                        : 'None scheduled'}
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Coaching Sessions</CardTitle>
                <CardDescription>Manage group and individual coaching sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingCoaching ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="border rounded-md">
                    <div className="grid grid-cols-4 font-medium text-sm bg-muted p-3 border-b">
                      <div>Title</div>
                      <div>Date</div>
                      <div>Registrations</div>
                      <div>Status</div>
                    </div>
                    <div className="divide-y">
                      {coachingSessions && coachingSessions.length > 0 ? (
                        coachingSessions.map((session) => (
                          <div key={session.id} className="grid grid-cols-4 py-3 px-3 text-sm">
                            <div className="font-medium">{session.title}</div>
                            <div>{new Date(session.date).toLocaleDateString()}</div>
                            <div>{isDemoMode ? Math.floor(Math.random() * 20) : 0}</div>
                            <div>
                              <span 
                                className={`px-2 py-1 rounded-full text-xs ${
                                  new Date(session.date) > new Date() 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {new Date(session.date) > new Date() ? 'Upcoming' : 'Completed'}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-4 text-center text-muted-foreground">
                          No coaching sessions found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/admin/coaching">View All Coaching Sessions</Link>
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}