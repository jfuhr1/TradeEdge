import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/admin/AdminLayout';
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
  FileText, 
  Video, 
  BookOpen,
  RefreshCw
} from 'lucide-react';
import { Link } from 'wouter';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useAdminPermissions } from '@/hooks/use-admin-permissions';
import { EducationContent } from '@shared/schema';

export default function AdminEducation() {
  const { toast } = useToast();
  const { hasPermission } = useAdminPermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterTier, setFilterTier] = useState('all');
  
  // Fetch education content
  const { data: educationContent, isLoading: isLoadingEducation, refetch } = useQuery<EducationContent[]>({
    queryKey: ['/api/admin/education'],
  });

  // Handle refresh
  const handleRefresh = () => {
    refetch();
    toast({
      title: "Refreshed",
      description: "Education content list has been refreshed",
    });
  };

  // Filter education content based on search and filters
  const filteredContent = educationContent?.filter(content => {
    const matchesSearch = 
      !searchTerm || 
      content.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      content.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || content.type === filterType;
    const matchesLevel = filterLevel === 'all' || content.level === filterLevel;
    const matchesTier = filterTier === 'all' || content.tier === filterTier;
    
    return matchesSearch && matchesType && matchesLevel && matchesTier;
  });

  // Handle content deletion
  const handleDeleteContent = (contentId: number) => {
    // For demo purposes, just show toast
    toast({
      title: "Content Deleted",
      description: `Education content with ID ${contentId} has been deleted.`,
    });
  };
  
  // Get tier color
  const getTierColor = (tier: string) => {
    switch (tier) {
      case "free":
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case "paid":
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case "premium":
        return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "article":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "video":
        return <Video className="h-4 w-4 text-red-500" />;
      case "course":
        return <BookOpen className="h-4 w-4 text-green-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  // Mock data for development
  const mockEducationContent: EducationContent[] = [
    {
      id: 1,
      title: "Introduction to Technical Analysis",
      description: "Learn the basics of chart patterns and technical indicators.",
      type: "course",
      contentUrl: "/education/technical-analysis-intro",
      imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3",
      tier: "free",
      level: "beginner",
      category: "technical-analysis",
      duration: 45,
      createdAt: new Date(),
      glossaryTerms: [],
      videoBookmarks: [],
      tags: ["beginner", "charts", "patterns"]
    },
    {
      id: 2,
      title: "Advanced Price Action Strategies",
      description: "Master complex price action techniques for active traders.",
      type: "video",
      contentUrl: "/education/advanced-price-action",
      imageUrl: "https://images.unsplash.com/photo-1535320903710-d993d3d77d29",
      tier: "premium",
      level: "advanced",
      category: "price-action",
      duration: 65,
      createdAt: new Date(),
      glossaryTerms: [],
      videoBookmarks: [],
      tags: ["advanced", "trading", "strategy"]
    },
    {
      id: 3,
      title: "Risk Management Fundamentals",
      description: "Essential risk management principles every trader should know.",
      type: "article",
      contentUrl: "/education/risk-management",
      imageUrl: "https://images.unsplash.com/photo-1604594849809-dfedbc827105",
      tier: "paid",
      level: "intermediate",
      category: "risk-management",
      duration: 0,
      createdAt: new Date(),
      glossaryTerms: [],
      videoBookmarks: [],
      tags: ["risk", "management", "portfolio"]
    }
  ];

  // Use mock data if no API data is available yet
  const displayContent = filteredContent || mockEducationContent;

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Education Content</h1>
            <p className="text-muted-foreground">
              Create and manage educational materials for users
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            {hasPermission("canCreateEducation") && (
              <Button asChild>
                <Link href="/admin/education/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Content
                </Link>
              </Button>
            )}
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
            <div className="flex flex-wrap gap-2">
              <Select 
                value={filterType}
                onValueChange={setFilterType}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Content Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="article">Articles</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                  <SelectItem value="course">Courses</SelectItem>
                </SelectContent>
              </Select>
              
              <Select 
                value={filterLevel}
                onValueChange={setFilterLevel}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Skill Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
              
              <Select 
                value={filterTier}
                onValueChange={setFilterTier}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Access Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoadingEducation ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : displayContent.length > 0 ? (
            <div className="border rounded-md">
              <div className="grid grid-cols-12 font-medium text-sm bg-muted p-4 border-b">
                <div className="col-span-4">Title</div>
                <div className="col-span-1 text-center">Type</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-1 text-center">Level</div>
                <div className="col-span-1 text-center">Duration</div>
                <div className="col-span-1 text-center">Tier</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              <div className="divide-y">
                {displayContent.map((content) => (
                  <div key={content.id} className="grid grid-cols-12 py-4 px-4 items-center">
                    <div className="col-span-4 font-medium flex items-center gap-2">
                      {getTypeIcon(content.type)}
                      <div>
                        <div>{content.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">{content.description}</div>
                      </div>
                    </div>
                    <div className="col-span-1 text-center">
                      <Badge variant="outline" className="capitalize">
                        {content.type}
                      </Badge>
                    </div>
                    <div className="col-span-2 text-sm">{content.category}</div>
                    <div className="col-span-1 text-center text-sm capitalize">{content.level}</div>
                    <div className="col-span-1 text-center text-sm">
                      {content.duration ? `${content.duration} min` : "-"}
                    </div>
                    <div className="col-span-1 text-center">
                      <Badge 
                        className={getTierColor(content.tier)}
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
                      {hasPermission("canEditEducation") && (
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/education/edit/${content.id}`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                      {hasPermission("canDeleteEducation") && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleDeleteContent(content.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
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
                  {searchTerm || filterType !== 'all' || filterLevel !== 'all' || filterTier !== 'all'
                    ? "No content matches your search criteria. Try adjusting your filters." 
                    : "You haven't created any education content yet. Create your first content item to get started."}
                </p>
                {hasPermission("canCreateEducation") && (
                  <Button asChild>
                    <Link href="/admin/education/create">
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Content
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

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
    </AdminLayout>
  );
}