import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Users2, AlertCircle, BookOpen, FileText, Calendar, BarChart3, Cog } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { AdminPermission } from "@shared/schema";

export default function AdminIndex() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeCards, setActiveCards] = useState<string[]>(['users', 'alerts', 'education', 'articles', 'coaching', 'analytics', 'settings']);

  // Fetch admin permissions
  const { data: permissions, isLoading: permissionsLoading } = useQuery<AdminPermission>({
    queryKey: ['/api/admin/permissions'],
    enabled: !!user?.isAdmin,
  });

  // Toggle card visibility
  const toggleCard = (cardId: string) => {
    if (activeCards.includes(cardId)) {
      setActiveCards(activeCards.filter(id => id !== cardId));
    } else {
      setActiveCards([...activeCards, cardId]);
    }
    
    // Save preferences to localStorage
    localStorage.setItem('adminDashboardCards', JSON.stringify(
      activeCards.includes(cardId) 
        ? activeCards.filter(id => id !== cardId)
        : [...activeCards, cardId]
    ));
  };

  // Load saved preferences on mount
  useEffect(() => {
    const savedCards = localStorage.getItem('adminDashboardCards');
    if (savedCards) {
      try {
        const parsedCards = JSON.parse(savedCards);
        if (Array.isArray(parsedCards)) {
          setActiveCards(parsedCards);
        }
      } catch (error) {
        console.error('Error parsing saved dashboard preferences:', error);
      }
    }
  }, []);

  if (permissionsLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Button variant="outline" onClick={() => setActiveCards(['users', 'alerts', 'education', 'articles', 'coaching', 'analytics', 'settings'])}>
            Reset Layout
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* User Management Card */}
          {activeCards.includes('users') && (
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center">
                    <Users2 className="h-5 w-5 mr-2 text-primary" />
                    User Management
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => toggleCard('users')}
                  >
                    Hide
                  </Button>
                </div>
                <CardDescription>
                  Manage users, permissions and memberships
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="mb-4">Total Users: <span className="font-semibold">328</span></p>
                <ul className="space-y-2">
                  <li>Free: <span className="font-semibold">212</span></li>
                  <li>Paid: <span className="font-semibold">82</span></li>
                  <li>Premium: <span className="font-semibold">29</span></li>
                  <li>Mentorship: <span className="font-semibold">5</span></li>
                </ul>
              </CardContent>
              <CardFooter className="bg-gray-50 dark:bg-gray-800 border-t">
                <Link href="/admin/users">
                  <Button variant="default" className="w-full">Manage Users</Button>
                </Link>
              </CardFooter>
            </Card>
          )}

          {/* Alerts Management Card */}
          {activeCards.includes('alerts') && (
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2 text-primary" />
                    Stock Alerts
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => toggleCard('alerts')}
                  >
                    Hide
                  </Button>
                </div>
                <CardDescription>
                  Create and manage stock alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="mb-4">Active Alerts: <span className="font-semibold">18</span></p>
                <ul className="space-y-2">
                  <li>In Buy Zone: <span className="font-semibold">5</span></li>
                  <li>Target Reached: <span className="font-semibold">7</span></li>
                  <li>Below Buy Zone: <span className="font-semibold">6</span></li>
                </ul>
              </CardContent>
              <CardFooter className="bg-gray-50 dark:bg-gray-800 border-t flex justify-between">
                <Link href="/admin/alerts">
                  <Button variant="outline" className="flex-1 mr-2">View Alerts</Button>
                </Link>
                <Link href="/admin/create-alert">
                  <Button variant="default" className="flex-1">Create Alert</Button>
                </Link>
              </CardFooter>
            </Card>
          )}

          {/* Education Content Card */}
          {activeCards.includes('education') && permissions?.canCreateEducation && (
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center">
                    <BookOpen className="h-5 w-5 mr-2 text-primary" />
                    Education Content
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => toggleCard('education')}
                  >
                    Hide
                  </Button>
                </div>
                <CardDescription>
                  Manage educational resources and courses
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="mb-4">Total Resources: <span className="font-semibold">42</span></p>
                <ul className="space-y-2">
                  <li>Videos: <span className="font-semibold">18</span></li>
                  <li>Courses: <span className="font-semibold">12</span></li>
                  <li>Guides: <span className="font-semibold">12</span></li>
                </ul>
              </CardContent>
              <CardFooter className="bg-gray-50 dark:bg-gray-800 border-t">
                <Link href="/admin/education">
                  <Button variant="default" className="w-full">Manage Education</Button>
                </Link>
              </CardFooter>
            </Card>
          )}

          {/* Articles Card */}
          {activeCards.includes('articles') && permissions?.canCreateArticles && (
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-primary" />
                    Articles
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => toggleCard('articles')}
                  >
                    Hide
                  </Button>
                </div>
                <CardDescription>
                  Manage articles and market insights
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="mb-4">Total Articles: <span className="font-semibold">24</span></p>
                <ul className="space-y-2">
                  <li>Published: <span className="font-semibold">20</span></li>
                  <li>Drafts: <span className="font-semibold">4</span></li>
                  <li>Featured: <span className="font-semibold">3</span></li>
                </ul>
              </CardContent>
              <CardFooter className="bg-gray-50 dark:bg-gray-800 border-t">
                <Link href="/admin/articles">
                  <Button variant="default" className="w-full">Manage Articles</Button>
                </Link>
              </CardFooter>
            </Card>
          )}

          {/* Coaching Card */}
          {activeCards.includes('coaching') && (permissions?.canManageCoaching || permissions?.canManageGroupSessions) && (
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-primary" />
                    Coaching
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => toggleCard('coaching')}
                  >
                    Hide
                  </Button>
                </div>
                <CardDescription>
                  Manage coaching sessions and schedules
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="mb-4">Upcoming Sessions: <span className="font-semibold">8</span></p>
                <ul className="space-y-2">
                  <li>One-on-One: <span className="font-semibold">5</span></li>
                  <li>Group: <span className="font-semibold">3</span></li>
                  <li>This Week: <span className="font-semibold">2</span></li>
                </ul>
              </CardContent>
              <CardFooter className="bg-gray-50 dark:bg-gray-800 border-t">
                <Link href="/admin/coaching">
                  <Button variant="default" className="w-full">Manage Coaching</Button>
                </Link>
              </CardFooter>
            </Card>
          )}

          {/* Analytics Card */}
          {activeCards.includes('analytics') && permissions?.canViewAnalytics && (
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                    Analytics
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => toggleCard('analytics')}
                  >
                    Hide
                  </Button>
                </div>
                <CardDescription>
                  View performance metrics and analytics
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="mb-4">Alert Success Rate: <span className="font-semibold">86%</span></p>
                <ul className="space-y-2">
                  <li>Hit Target 1: <span className="font-semibold">92%</span></li>
                  <li>Hit Target 2: <span className="font-semibold">65%</span></li>
                  <li>Hit Target 3: <span className="font-semibold">38%</span></li>
                </ul>
              </CardContent>
              <CardFooter className="bg-gray-50 dark:bg-gray-800 border-t">
                <Link href="/admin/performance">
                  <Button variant="default" className="w-full">View Analytics</Button>
                </Link>
              </CardFooter>
            </Card>
          )}

          {/* Admin Settings Card */}
          {activeCards.includes('settings') && (
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center">
                    <Cog className="h-5 w-5 mr-2 text-primary" />
                    Admin Settings
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => toggleCard('settings')}
                  >
                    Hide
                  </Button>
                </div>
                <CardDescription>
                  Manage admin accounts and system settings
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="mb-4">Admin Users: <span className="font-semibold">5</span></p>
                <ul className="space-y-2">
                  <li>Super Admins: <span className="font-semibold">1</span></li>
                  <li>Content Admins: <span className="font-semibold">2</span></li>
                  <li>Alerts Admins: <span className="font-semibold">2</span></li>
                </ul>
              </CardContent>
              <CardFooter className="bg-gray-50 dark:bg-gray-800 border-t">
                <Link href="/admin/settings">
                  <Button variant="default" className="w-full">Manage Settings</Button>
                </Link>
              </CardFooter>
            </Card>
          )}
        </div>

        {/* Show toggles for hidden cards */}
        {activeCards.length < 7 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Hidden Sections</h2>
            <div className="flex flex-wrap gap-2">
              {!activeCards.includes('users') && (
                <Button variant="outline" size="sm" onClick={() => toggleCard('users')}>
                  <Users2 className="h-4 w-4 mr-2" /> Show Users
                </Button>
              )}
              {!activeCards.includes('alerts') && (
                <Button variant="outline" size="sm" onClick={() => toggleCard('alerts')}>
                  <AlertCircle className="h-4 w-4 mr-2" /> Show Alerts
                </Button>
              )}
              {!activeCards.includes('education') && permissions?.canCreateEducation && (
                <Button variant="outline" size="sm" onClick={() => toggleCard('education')}>
                  <BookOpen className="h-4 w-4 mr-2" /> Show Education
                </Button>
              )}
              {!activeCards.includes('articles') && permissions?.canCreateArticles && (
                <Button variant="outline" size="sm" onClick={() => toggleCard('articles')}>
                  <FileText className="h-4 w-4 mr-2" /> Show Articles
                </Button>
              )}
              {!activeCards.includes('coaching') && (permissions?.canManageCoaching || permissions?.canManageGroupSessions) && (
                <Button variant="outline" size="sm" onClick={() => toggleCard('coaching')}>
                  <Calendar className="h-4 w-4 mr-2" /> Show Coaching
                </Button>
              )}
              {!activeCards.includes('analytics') && permissions?.canViewAnalytics && (
                <Button variant="outline" size="sm" onClick={() => toggleCard('analytics')}>
                  <BarChart3 className="h-4 w-4 mr-2" /> Show Analytics
                </Button>
              )}
              {!activeCards.includes('settings') && (
                <Button variant="outline" size="sm" onClick={() => toggleCard('settings')}>
                  <Cog className="h-4 w-4 mr-2" /> Show Settings
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}