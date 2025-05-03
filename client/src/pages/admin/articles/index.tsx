import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import MainLayout from '@/components/layout/main-layout';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  ArrowLeft, 
  FileText, 
  Calendar 
} from 'lucide-react';
import { Link } from 'wouter';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

export default function AdminArticles() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  
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

  // Sample data for demo mode
  const demoArticles = [
    {
      id: 1,
      title: "Understanding Price Action Trading Strategies",
      category: "Technical Analysis",
      status: "published",
      publishedAt: "2025-04-10T14:00:00Z",
      excerpt: "Learn how to read and interpret price action to make better trading decisions."
    },
    {
      id: 2,
      title: "Momentum Trading: Identifying and Capitalizing on Market Trends",
      category: "Trading Strategies",
      status: "published",
      publishedAt: "2025-04-15T10:30:00Z",
      excerpt: "Discover how to identify trends early and position your portfolio to maximize gains."
    },
    {
      id: 3,
      title: "Managing Risk in Volatile Markets",
      category: "Risk Management",
      status: "draft",
      publishedAt: null,
      excerpt: "Essential strategies to protect your capital during market uncertainty."
    }
  ];

  // Filter articles based on search term and category
  const filteredArticles = demoArticles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          article.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || article.category.toLowerCase() === filterCategory.toLowerCase();
    return matchesSearch && matchesCategory;
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
              <p>You do not have permission to access this page. Only administrators can manage articles.</p>
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
    <MainLayout title="Manage Articles" description="Admin Articles Management">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Button asChild variant="ghost" size="sm" className="mb-2">
              <Link href="/admin/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Admin Dashboard
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Articles Management</h1>
            <p className="text-muted-foreground">Create and manage market analysis and strategy articles</p>
          </div>
          <div>
            <Button asChild>
              <Link href="/admin/articles/create">
                <Plus className="mr-2 h-4 w-4" />
                Create New Article
              </Link>
            </Button>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 justify-between mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by title or content..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select 
                value={filterCategory}
                onValueChange={setFilterCategory}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="technical analysis">Technical Analysis</SelectItem>
                  <SelectItem value="fundamental analysis">Fundamental Analysis</SelectItem>
                  <SelectItem value="trading strategies">Trading Strategies</SelectItem>
                  <SelectItem value="risk management">Risk Management</SelectItem>
                  <SelectItem value="market news">Market News</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isDemoMode && filteredArticles.length > 0 ? (
            <div className="border rounded-md">
              <div className="grid grid-cols-10 font-medium text-sm bg-muted p-4 border-b">
                <div className="col-span-3">Title</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-1">Published</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              <div className="divide-y">
                {filteredArticles.map((article) => (
                  <div key={article.id} className="grid grid-cols-10 py-4 px-4 items-center">
                    <div className="col-span-3 font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      {article.title}
                    </div>
                    <div className="col-span-2">
                      <Badge variant="outline">
                        {article.category}
                      </Badge>
                    </div>
                    <div className="col-span-2">
                      <Badge 
                        className={
                          article.status === 'published' 
                            ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                            : 'bg-amber-100 text-amber-800 hover:bg-amber-100'
                        }
                      >
                        {article.status}
                      </Badge>
                    </div>
                    <div className="col-span-1 text-sm">
                      {article.publishedAt 
                        ? new Date(article.publishedAt).toLocaleDateString() 
                        : '—'}
                    </div>
                    <div className="col-span-2 flex justify-end space-x-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/articles/${article.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/articles/edit/${article.id}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost">
                            ...
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {article.status !== 'published' && (
                            <DropdownMenuItem
                              onClick={() => {
                                toast({
                                  title: "Demo Mode",
                                  description: "This would publish the article in a production environment.",
                                });
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Publish
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => {
                              toast({
                                title: "Demo Mode",
                                description: "Deletion would remove this article in a production environment.",
                              });
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 border rounded-md bg-muted/10">
              <div className="flex flex-col items-center">
                <FileText className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Articles Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || filterCategory !== 'all' 
                    ? "No articles match your search criteria. Try adjusting your filters." 
                    : "You haven't created any articles yet. Create your first article to get started."}
                </p>
                <Button asChild>
                  <Link href="/admin/articles/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Article
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Article Writing Guidelines</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Article Structure</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p>Use clear headings, concise paragraphs, and bullet points for key takeaways. Include a compelling introduction and actionable conclusion.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Visual Elements</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p>Add charts, diagrams, or infographics to explain complex concepts. Visuals increase engagement and comprehension by up to 80%.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Optimal Length</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p>Aim for 1,200-1,800 words for comprehensive analysis. Break longer articles into series for better reader engagement and retention.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}