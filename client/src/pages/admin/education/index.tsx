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
  Video, 
  BookOpen 
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

export default function AdminEducation() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  
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

  // Fetch education content
  const { data: educationContent, isLoading: isLoadingEducation } = useQuery({
    queryKey: ['/api/education'],
    enabled: isAdmin === true || isDemoMode
  });

  // Filter education content based on search term and type
  const filteredContent = educationContent?.filter(content => {
    const matchesSearch = content.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          content.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || content.type === filterType;
    return matchesSearch && matchesType;
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
              <p>You do not have permission to access this page. Only administrators can manage education content.</p>
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
    <MainLayout title="Manage Education" description="Admin Education Management">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Button asChild variant="ghost" size="sm" className="mb-2">
              <Link href="/admin/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Admin Dashboard
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Education Content Management</h1>
            <p className="text-muted-foreground">Create and manage educational materials for users</p>
          </div>
          <div>
            <Button asChild>
              <Link href="/admin/education/create">
                <Plus className="mr-2 h-4 w-4" />
                Add New Content
              </Link>
            </Button>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 justify-between mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by title or description..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select 
                value={filterType}
                onValueChange={setFilterType}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="article">Articles</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                  <SelectItem value="course">Courses</SelectItem>
                  <SelectItem value="guide">Guides</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoadingEducation ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredContent && filteredContent.length > 0 ? (
            <div className="border rounded-md">
              <div className="grid grid-cols-10 font-medium text-sm bg-muted p-4 border-b">
                <div className="col-span-3">Title</div>
                <div className="col-span-1">Type</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-1">Level</div>
                <div className="col-span-1">Tier</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              <div className="divide-y">
                {filteredContent.map((content) => (
                  <div key={content.id} className="grid grid-cols-10 py-4 px-4 items-center">
                    <div className="col-span-3 font-medium flex items-center gap-2">
                      {content.type === 'article' && <FileText className="h-4 w-4 text-blue-500" />}
                      {content.type === 'video' && <Video className="h-4 w-4 text-red-500" />}
                      {content.type === 'course' && <BookOpen className="h-4 w-4 text-green-500" />}
                      {content.title}
                    </div>
                    <div className="col-span-1">
                      <Badge variant="outline" className="capitalize">
                        {content.type}
                      </Badge>
                    </div>
                    <div className="col-span-2 text-sm">{content.category}</div>
                    <div className="col-span-1 text-sm">{content.level}</div>
                    <div className="col-span-1 text-sm">
                      <Badge 
                        className={
                          content.tier === 'free' 
                            ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                            : content.tier === 'paid' 
                            ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' 
                            : 'bg-purple-100 text-purple-800 hover:bg-purple-100'
                        }
                      >
                        {content.tier}
                      </Badge>
                    </div>
                    <div className="col-span-2 flex justify-end space-x-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/education/${content.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/education/edit/${content.id}`}>
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
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => {
                              toast({
                                title: "Demo Mode",
                                description: "Deletion would remove this content in a production environment.",
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
                <h3 className="text-lg font-semibold mb-2">No Education Content Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || filterType !== 'all' 
                    ? "No content matches your search criteria. Try adjusting your filters." 
                    : "You haven't created any education content yet. Create your first content item to get started."}
                </p>
                <Button asChild>
                  <Link href="/admin/education/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Content
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Educational Categories</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p>Organize content into categories like Technical Analysis, Fundamental Analysis, Risk Management, and Psychology.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Content Tiers</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p>Assign content to Free, Paid, or Premium tiers to manage access based on user subscription levels.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Optimal Video Length</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p>Keep videos under 15 minutes for better engagement. Break longer topics into multiple videos or modules.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}