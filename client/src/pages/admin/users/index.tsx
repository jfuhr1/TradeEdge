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
  ArrowLeft,
  Users,
  UserCog,
  Shield,
  User,
  BookOpen,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { Link } from 'wouter';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export default function AdminUsersManagement() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  
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

  // Fetch all users
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/admin/users'],
    enabled: isAdmin === true || isDemoMode
  });

  // Fetch admin permissions for a specific user
  const fetchAdminPermissions = async (userId: number) => {
    if (isDemoMode) {
      // Return demo permissions for the selected admin
      return {
        userId: userId,
        canManageUsers: false,
        canManageAdmins: false,
        canCreateAlerts: userId === 2,
        canEditAlerts: userId === 2,
        canDeleteAlerts: false,
        canCreateEducation: userId === 3,
        canEditEducation: userId === 3,
        canDeleteEducation: false,
        canCreateArticles: userId === 3,
        canEditArticles: userId === 3,
        canDeleteArticles: false,
        canManageCoaching: userId === 4,
        canScheduleSessions: userId === 4,
        canViewSessionDetails: userId === 4,
        canViewAnalytics: userId === 2 || userId === 3 || userId === 4,
      };
    }
    
    try {
      const res = await apiRequest('GET', `/api/admin/permissions/${userId}`);
      return await res.json();
    } catch (error) {
      console.error('Error fetching admin permissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load admin permissions',
        variant: 'destructive'
      });
      return null;
    }
  };

  // Demo user data for testing
  const demoUsers = [
    {
      id: 1,
      name: "You (Super Admin)",
      username: "superadmin",
      email: "admin@tradeedgepro.com",
      tier: "premium",
      isAdmin: true,
      adminRole: "super_admin",
      createdAt: "2025-01-01T00:00:00Z"
    },
    {
      id: 2,
      name: "John Smith",
      username: "jsmith",
      email: "jsmith@example.com",
      tier: "paid",
      isAdmin: true,
      adminRole: "alerts_admin",
      createdAt: "2025-02-15T00:00:00Z"
    },
    {
      id: 3,
      name: "Sarah Johnson",
      username: "sjohnson",
      email: "sjohnson@example.com",
      tier: "premium",
      isAdmin: true,
      adminRole: "education_admin",
      createdAt: "2025-03-01T00:00:00Z"
    },
    {
      id: 4,
      name: "Michael Brown",
      username: "mbrown",
      email: "mbrown@example.com",
      tier: "premium",
      isAdmin: true,
      adminRole: "coaching_admin",
      createdAt: "2025-03-10T00:00:00Z"
    },
    {
      id: 5,
      name: "Jane Doe",
      username: "jdoe",
      email: "jdoe@example.com",
      tier: "free",
      isAdmin: false,
      adminRole: null,
      createdAt: "2025-03-15T00:00:00Z"
    },
    {
      id: 6,
      name: "Robert Wilson",
      username: "rwilson",
      email: "rwilson@example.com",
      tier: "paid",
      isAdmin: false,
      adminRole: null,
      createdAt: "2025-04-01T00:00:00Z"
    },
    {
      id: 7,
      name: "Emily Clark",
      username: "eclark",
      email: "eclark@example.com",
      tier: "premium",
      isAdmin: false,
      adminRole: null,
      createdAt: "2025-04-10T00:00:00Z"
    }
  ];

  // Filter users based on search term and role filter
  const filteredUsers = isDemoMode ? demoUsers.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterRole === 'all' || 
      (filterRole === 'admin' && user.isAdmin) ||
      (filterRole === 'regular' && !user.isAdmin) ||
      (filterRole === user.adminRole);
    
    return matchesSearch && matchesFilter;
  }) : users?.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterRole === 'all' || 
      (filterRole === 'admin' && user.isAdmin) ||
      (filterRole === 'regular' && !user.isAdmin) ||
      (filterRole === user.adminRole);
    
    return matchesSearch && matchesFilter;
  });

  // Admin permissions schema for form validation
  const permissionsFormSchema = z.object({
    // User management
    canManageUsers: z.boolean().default(false),
    canManageAdmins: z.boolean().default(false),
    
    // Alerts
    canCreateAlerts: z.boolean().default(false),
    canEditAlerts: z.boolean().default(false),
    canDeleteAlerts: z.boolean().default(false),
    
    // Education
    canCreateEducation: z.boolean().default(false),
    canEditEducation: z.boolean().default(false),
    canDeleteEducation: z.boolean().default(false),
    
    // Articles
    canCreateArticles: z.boolean().default(false),
    canEditArticles: z.boolean().default(false),
    canDeleteArticles: z.boolean().default(false),
    
    // Coaching
    canManageCoaching: z.boolean().default(false),
    canScheduleSessions: z.boolean().default(false),
    canViewSessionDetails: z.boolean().default(false),
    
    // Analytics
    canViewAnalytics: z.boolean().default(false),
  });

  // Set up form
  const form = useForm<z.infer<typeof permissionsFormSchema>>({
    resolver: zodResolver(permissionsFormSchema),
    defaultValues: {
      canManageUsers: false,
      canManageAdmins: false,
      canCreateAlerts: false,
      canEditAlerts: false,
      canDeleteAlerts: false,
      canCreateEducation: false,
      canEditEducation: false,
      canDeleteEducation: false,
      canCreateArticles: false,
      canEditArticles: false,
      canDeleteArticles: false,
      canManageCoaching: false,
      canScheduleSessions: false,
      canViewSessionDetails: false,
      canViewAnalytics: false,
    }
  });

  // Handle user selection for permissions editing
  const handleEditPermissions = async (user: any) => {
    setSelectedUser(user);
    
    // Fetch current permissions and update form
    const permissions = await fetchAdminPermissions(user.id);
    if (permissions) {
      // Reset form with current permissions
      form.reset(permissions);
      setShowPermissionsModal(true);
    }
  };

  // Save permissions mutation
  const savePermissionsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof permissionsFormSchema>) => {
      if (isDemoMode) {
        // Simulate successful update in demo mode
        return { success: true };
      }
      
      return apiRequest('POST', `/api/admin/permissions/${selectedUser.id}`, data)
        .then(res => res.json());
    },
    onSuccess: () => {
      toast({
        title: 'Permissions Updated',
        description: `Admin permissions for ${selectedUser.name} have been updated successfully.`,
      });
      setShowPermissionsModal(false);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({queryKey: ['/api/admin/users']});
    },
    onError: (error) => {
      toast({
        title: 'Update Failed',
        description: `Failed to update permissions: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  // Handle form submission
  const onSubmit = (values: z.infer<typeof permissionsFormSchema>) => {
    savePermissionsMutation.mutate(values);
  };

  // Toggle admin status mutation
  const toggleAdminStatusMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: number, isAdmin: boolean }) => {
      if (isDemoMode) {
        // Simulate successful update in demo mode
        return { success: true };
      }
      
      return apiRequest('POST', `/api/admin/toggle-admin-status/${userId}`, { isAdmin })
        .then(res => res.json());
    },
    onSuccess: () => {
      toast({
        title: 'Admin Status Updated',
        description: 'User admin status has been updated successfully.',
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({queryKey: ['/api/admin/users']});
    },
    onError: (error) => {
      toast({
        title: 'Update Failed',
        description: `Failed to update admin status: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  // Handle toggle admin status
  const handleToggleAdminStatus = (user: any) => {
    // Don't allow super admin to lose admin status
    if (user.adminRole === 'super_admin' && user.isAdmin) {
      toast({
        title: 'Action Denied',
        description: 'Super admin status cannot be removed.',
        variant: 'destructive'
      });
      return;
    }
    
    // Confirm before removing admin status
    if (user.isAdmin) {
      if (!confirm(`Are you sure you want to remove admin privileges from ${user.name}?`)) {
        return;
      }
    }
    
    toggleAdminStatusMutation.mutate({ 
      userId: user.id, 
      isAdmin: !user.isAdmin 
    });
  };

  // Update admin role mutation
  const updateAdminRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number, role: string }) => {
      if (isDemoMode) {
        // Simulate successful update in demo mode
        return { success: true };
      }
      
      return apiRequest('POST', `/api/admin/update-role/${userId}`, { role })
        .then(res => res.json());
    },
    onSuccess: () => {
      toast({
        title: 'Role Updated',
        description: 'Admin role has been updated successfully.',
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({queryKey: ['/api/admin/users']});
    },
    onError: (error) => {
      toast({
        title: 'Update Failed',
        description: `Failed to update role: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  // Handle update admin role
  const handleUpdateRole = (user: any, role: string) => {
    // Don't allow changing super admin role
    if (user.adminRole === 'super_admin') {
      toast({
        title: 'Action Denied',
        description: 'Super admin role cannot be changed.',
        variant: 'destructive'
      });
      return;
    }
    
    updateAdminRoleMutation.mutate({ 
      userId: user.id, 
      role: role 
    });
  };

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
              <p>You do not have permission to access this page. Only administrators can manage users.</p>
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
    <MainLayout title="Admin User Management" description="Manage users and permissions">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Button asChild variant="ghost" size="sm" className="mb-2">
              <Link href="/admin/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Admin Dashboard
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage users, admins and their permissions</p>
          </div>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="space-x-2">
            <TabsTrigger value="all">All Users</TabsTrigger>
            <TabsTrigger value="admin">Admins Only</TabsTrigger>
            <TabsTrigger value="regular">Regular Users</TabsTrigger>
          </TabsList>

          <div className="flex flex-col md:flex-row gap-4 justify-between mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search users by name, email or username..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select 
                value={filterRole}
                onValueChange={setFilterRole}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">All Admins</SelectItem>
                  <SelectItem value="regular">Regular Users</SelectItem>
                  <SelectItem value="super_admin">Super Admins</SelectItem>
                  <SelectItem value="content_admin">Content Admins</SelectItem>
                  <SelectItem value="alerts_admin">Alerts Admins</SelectItem>
                  <SelectItem value="education_admin">Education Admins</SelectItem>
                  <SelectItem value="coaching_admin">Coaching Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>All registered users on the platform</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingUsers && !isDemoMode ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredUsers && filteredUsers.length > 0 ? (
                  <div className="border rounded-md">
                    <div className="grid grid-cols-7 font-medium text-sm bg-muted p-3 border-b">
                      <div className="col-span-2">Name / Email</div>
                      <div>Username</div>
                      <div>Tier</div>
                      <div>Role</div>
                      <div>Created</div>
                      <div className="text-right">Actions</div>
                    </div>
                    <div className="divide-y">
                      {filteredUsers.map((user) => (
                        <div key={user.id} className="grid grid-cols-7 py-3 px-3 text-sm items-center">
                          <div className="col-span-2">
                            <div className="font-medium">{user.name}</div>
                            <div className="text-muted-foreground">{user.email}</div>
                          </div>
                          <div>{user.username}</div>
                          <div>
                            <Badge variant="outline" className="capitalize">
                              {user.tier}
                            </Badge>
                          </div>
                          <div>
                            {user.isAdmin ? (
                              <Badge 
                                className={
                                  user.adminRole === 'super_admin'
                                    ? 'bg-purple-100 text-purple-800 hover:bg-purple-100'
                                    : user.adminRole === 'alerts_admin'
                                    ? 'bg-amber-100 text-amber-800 hover:bg-amber-100'
                                    : user.adminRole === 'education_admin'
                                    ? 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                                    : user.adminRole === 'coaching_admin'
                                    ? 'bg-green-100 text-green-800 hover:bg-green-100'
                                    : 'bg-gray-100 text-gray-800 hover:bg-gray-100'
                                }
                              >
                                {user.adminRole?.replace('_', ' ') || 'Admin'}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">Regular User</span>
                            )}
                          </div>
                          <div>
                            {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex justify-end space-x-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost">
                                  ...
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  toast({
                                    title: "View User Details",
                                    description: "This would open the user profile details page in a production environment.",
                                  });
                                }}>
                                  <User className="h-4 w-4 mr-2" />
                                  View Profile
                                </DropdownMenuItem>
                                
                                <DropdownMenuSeparator />
                                
                                {user.isAdmin ? (
                                  <>
                                    <DropdownMenuItem onClick={() => handleEditPermissions(user)}>
                                      <Shield className="h-4 w-4 mr-2" />
                                      Edit Permissions
                                    </DropdownMenuItem>
                                    
                                    <DropdownMenuSeparator />
                                    
                                    <DropdownMenuItem
                                      disabled={user.adminRole === 'super_admin' && user.id === 1}
                                      onClick={() => handleToggleAdminStatus(user)}
                                    >
                                      <UserCog className="h-4 w-4 mr-2 text-red-500" />
                                      <span className="text-red-500">Remove Admin</span>
                                    </DropdownMenuItem>
                                  </>
                                ) : (
                                  <DropdownMenuItem onClick={() => handleToggleAdminStatus(user)}>
                                    <UserCog className="h-4 w-4 mr-2 text-blue-500" />
                                    <span className="text-blue-500">Make Admin</span>
                                  </DropdownMenuItem>
                                )}
                                
                                {user.isAdmin && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem disabled={user.adminRole === 'super_admin'} onClick={() => handleUpdateRole(user, 'alerts_admin')}>
                                      <AlertTriangle className="h-4 w-4 mr-2" />
                                      Set as Alerts Admin
                                    </DropdownMenuItem>
                                    <DropdownMenuItem disabled={user.adminRole === 'super_admin'} onClick={() => handleUpdateRole(user, 'education_admin')}>
                                      <BookOpen className="h-4 w-4 mr-2" />
                                      Set as Education Admin
                                    </DropdownMenuItem>
                                    <DropdownMenuItem disabled={user.adminRole === 'super_admin'} onClick={() => handleUpdateRole(user, 'coaching_admin')}>
                                      <Calendar className="h-4 w-4 mr-2" />
                                      Set as Coaching Admin
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded-md bg-muted/10">
                    <div className="flex flex-col items-center">
                      <Users className="h-10 w-10 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Users Found</h3>
                      <p className="text-muted-foreground mb-4">
                        {searchTerm || filterRole !== 'all' 
                          ? "No users match your search criteria. Try adjusting your filters." 
                          : "No users have registered yet."}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="admin" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Admin Users</CardTitle>
                <CardDescription>Manage administrators and their permissions</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingUsers && !isDemoMode ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredUsers && filteredUsers.filter(u => u.isAdmin).length > 0 ? (
                  <div className="border rounded-md">
                    <div className="grid grid-cols-7 font-medium text-sm bg-muted p-3 border-b">
                      <div className="col-span-2">Name / Email</div>
                      <div>Username</div>
                      <div>Tier</div>
                      <div>Admin Role</div>
                      <div>Created</div>
                      <div className="text-right">Actions</div>
                    </div>
                    <div className="divide-y">
                      {filteredUsers.filter(u => u.isAdmin).map((user) => (
                        <div key={user.id} className="grid grid-cols-7 py-3 px-3 text-sm items-center">
                          <div className="col-span-2">
                            <div className="font-medium">{user.name}</div>
                            <div className="text-muted-foreground">{user.email}</div>
                          </div>
                          <div>{user.username}</div>
                          <div>
                            <Badge variant="outline" className="capitalize">
                              {user.tier}
                            </Badge>
                          </div>
                          <div>
                            <Badge 
                              className={
                                user.adminRole === 'super_admin'
                                  ? 'bg-purple-100 text-purple-800 hover:bg-purple-100'
                                  : user.adminRole === 'alerts_admin'
                                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-100'
                                  : user.adminRole === 'education_admin'
                                  ? 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                                  : user.adminRole === 'coaching_admin'
                                  ? 'bg-green-100 text-green-800 hover:bg-green-100'
                                  : 'bg-gray-100 text-gray-800 hover:bg-gray-100'
                              }
                            >
                              {user.adminRole?.replace('_', ' ') || 'Admin'}
                            </Badge>
                          </div>
                          <div>
                            {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleEditPermissions(user)}
                            >
                              <Shield className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost">
                                  ...
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditPermissions(user)}>
                                  <Shield className="h-4 w-4 mr-2" />
                                  Edit Permissions
                                </DropdownMenuItem>
                                
                                <DropdownMenuSeparator />
                                
                                <DropdownMenuItem disabled={user.adminRole === 'super_admin'} onClick={() => handleUpdateRole(user, 'alerts_admin')}>
                                  <AlertTriangle className="h-4 w-4 mr-2" />
                                  Set as Alerts Admin
                                </DropdownMenuItem>
                                <DropdownMenuItem disabled={user.adminRole === 'super_admin'} onClick={() => handleUpdateRole(user, 'education_admin')}>
                                  <BookOpen className="h-4 w-4 mr-2" />
                                  Set as Education Admin
                                </DropdownMenuItem>
                                <DropdownMenuItem disabled={user.adminRole === 'super_admin'} onClick={() => handleUpdateRole(user, 'coaching_admin')}>
                                  <Calendar className="h-4 w-4 mr-2" />
                                  Set as Coaching Admin
                                </DropdownMenuItem>
                                
                                <DropdownMenuSeparator />
                                
                                <DropdownMenuItem
                                  disabled={user.adminRole === 'super_admin' && user.id === 1}
                                  onClick={() => handleToggleAdminStatus(user)}
                                  className="text-red-500"
                                >
                                  <UserCog className="h-4 w-4 mr-2" />
                                  Remove Admin Status
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded-md bg-muted/10">
                    <div className="flex flex-col items-center">
                      <UserCog className="h-10 w-10 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Admin Users Found</h3>
                      <p className="text-muted-foreground mb-4">
                        {searchTerm 
                          ? "No admin users match your search criteria." 
                          : "There are no admin users other than yourself."}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="regular" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Regular Users</CardTitle>
                <CardDescription>Manage non-administrator users</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingUsers && !isDemoMode ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredUsers && filteredUsers.filter(u => !u.isAdmin).length > 0 ? (
                  <div className="border rounded-md">
                    <div className="grid grid-cols-6 font-medium text-sm bg-muted p-3 border-b">
                      <div className="col-span-2">Name / Email</div>
                      <div>Username</div>
                      <div>Tier</div>
                      <div>Created</div>
                      <div className="text-right">Actions</div>
                    </div>
                    <div className="divide-y">
                      {filteredUsers.filter(u => !u.isAdmin).map((user) => (
                        <div key={user.id} className="grid grid-cols-6 py-3 px-3 text-sm items-center">
                          <div className="col-span-2">
                            <div className="font-medium">{user.name}</div>
                            <div className="text-muted-foreground">{user.email}</div>
                          </div>
                          <div>{user.username}</div>
                          <div>
                            <Badge variant="outline" className="capitalize">
                              {user.tier}
                            </Badge>
                          </div>
                          <div>
                            {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex justify-end space-x-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost">
                                  ...
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  toast({
                                    title: "View User Details",
                                    description: "This would open the user profile details page in a production environment.",
                                  });
                                }}>
                                  <User className="h-4 w-4 mr-2" />
                                  View Profile
                                </DropdownMenuItem>
                                
                                <DropdownMenuSeparator />
                                
                                <DropdownMenuItem onClick={() => handleToggleAdminStatus(user)}>
                                  <UserCog className="h-4 w-4 mr-2 text-blue-500" />
                                  <span className="text-blue-500">Make Admin</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded-md bg-muted/10">
                    <div className="flex flex-col items-center">
                      <Users className="h-10 w-10 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Regular Users Found</h3>
                      <p className="text-muted-foreground mb-4">
                        {searchTerm 
                          ? "No regular users match your search criteria." 
                          : "There are no regular users registered yet."}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={showPermissionsModal} onOpenChange={setShowPermissionsModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Admin Permissions for {selectedUser?.name}</DialogTitle>
              <DialogDescription>
                Configure specific permissions for this admin user. You can grant or revoke access to different areas of the platform.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Tabs defaultValue="alerts" className="w-full">
                  <TabsList className="grid grid-cols-5 mb-4">
                    <TabsTrigger value="admin">Admin</TabsTrigger>
                    <TabsTrigger value="alerts">Alerts</TabsTrigger>
                    <TabsTrigger value="education">Education</TabsTrigger>
                    <TabsTrigger value="articles">Articles</TabsTrigger>
                    <TabsTrigger value="coaching">Coaching</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="admin" className="space-y-4">
                    <div className="space-y-4">
                      <h4 className="text-md font-semibold">Admin Management Permissions</h4>
                      
                      <div className="space-y-2">
                        <FormField
                          control={form.control}
                          name="canManageUsers"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled={selectedUser?.adminRole === 'super_admin'}
                                />
                              </FormControl>
                              <div className="space-y-1">
                                <FormLabel>Can manage users</FormLabel>
                                <FormDescription className="text-xs">
                                  Can view and edit user profiles, upgrade tiers
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="canManageAdmins"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled={selectedUser?.adminRole === 'super_admin'}
                                />
                              </FormControl>
                              <div className="space-y-1">
                                <FormLabel>Can manage other admins</FormLabel>
                                <FormDescription className="text-xs">
                                  Can promote users to admin, edit admin permissions
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <FormField
                          control={form.control}
                          name="canViewAnalytics"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled={selectedUser?.adminRole === 'super_admin'}
                                />
                              </FormControl>
                              <div className="space-y-1">
                                <FormLabel>Can view analytics</FormLabel>
                                <FormDescription className="text-xs">
                                  Can access performance metrics and analytics dashboard
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="alerts" className="space-y-4">
                    <div className="space-y-4">
                      <h4 className="text-md font-semibold">Stock Alert Permissions</h4>
                      
                      <div className="space-y-2">
                        <FormField
                          control={form.control}
                          name="canCreateAlerts"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled={selectedUser?.adminRole === 'super_admin'}
                                />
                              </FormControl>
                              <div className="space-y-1">
                                <FormLabel>Can create stock alerts</FormLabel>
                                <FormDescription className="text-xs">
                                  Can create new stock picks and alerts
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="canEditAlerts"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled={selectedUser?.adminRole === 'super_admin'}
                                />
                              </FormControl>
                              <div className="space-y-1">
                                <FormLabel>Can edit stock alerts</FormLabel>
                                <FormDescription className="text-xs">
                                  Can modify existing stock alerts and update prices
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="canDeleteAlerts"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled={selectedUser?.adminRole === 'super_admin'}
                                />
                              </FormControl>
                              <div className="space-y-1">
                                <FormLabel>Can delete stock alerts</FormLabel>
                                <FormDescription className="text-xs">
                                  Can remove stock alerts from the system
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="education" className="space-y-4">
                    <div className="space-y-4">
                      <h4 className="text-md font-semibold">Education Content Permissions</h4>
                      
                      <div className="space-y-2">
                        <FormField
                          control={form.control}
                          name="canCreateEducation"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled={selectedUser?.adminRole === 'super_admin'}
                                />
                              </FormControl>
                              <div className="space-y-1">
                                <FormLabel>Can create education content</FormLabel>
                                <FormDescription className="text-xs">
                                  Can add new courses, videos, and educational materials
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="canEditEducation"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled={selectedUser?.adminRole === 'super_admin'}
                                />
                              </FormControl>
                              <div className="space-y-1">
                                <FormLabel>Can edit education content</FormLabel>
                                <FormDescription className="text-xs">
                                  Can modify existing educational materials
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="canDeleteEducation"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled={selectedUser?.adminRole === 'super_admin'}
                                />
                              </FormControl>
                              <div className="space-y-1">
                                <FormLabel>Can delete education content</FormLabel>
                                <FormDescription className="text-xs">
                                  Can remove educational content from the platform
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="articles" className="space-y-4">
                    <div className="space-y-4">
                      <h4 className="text-md font-semibold">Article Management Permissions</h4>
                      
                      <div className="space-y-2">
                        <FormField
                          control={form.control}
                          name="canCreateArticles"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled={selectedUser?.adminRole === 'super_admin'}
                                />
                              </FormControl>
                              <div className="space-y-1">
                                <FormLabel>Can create articles</FormLabel>
                                <FormDescription className="text-xs">
                                  Can publish new market analysis and strategy articles
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="canEditArticles"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled={selectedUser?.adminRole === 'super_admin'}
                                />
                              </FormControl>
                              <div className="space-y-1">
                                <FormLabel>Can edit articles</FormLabel>
                                <FormDescription className="text-xs">
                                  Can modify existing published articles
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="canDeleteArticles"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled={selectedUser?.adminRole === 'super_admin'}
                                />
                              </FormControl>
                              <div className="space-y-1">
                                <FormLabel>Can delete articles</FormLabel>
                                <FormDescription className="text-xs">
                                  Can remove published articles from the platform
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="coaching" className="space-y-4">
                    <div className="space-y-4">
                      <h4 className="text-md font-semibold">Coaching Management Permissions</h4>
                      
                      <div className="space-y-2">
                        <FormField
                          control={form.control}
                          name="canManageCoaching"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled={selectedUser?.adminRole === 'super_admin'}
                                />
                              </FormControl>
                              <div className="space-y-1">
                                <FormLabel>Can manage coaching</FormLabel>
                                <FormDescription className="text-xs">
                                  Can access and manage the coaching system
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="canScheduleSessions"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled={selectedUser?.adminRole === 'super_admin'}
                                />
                              </FormControl>
                              <div className="space-y-1">
                                <FormLabel>Can schedule sessions</FormLabel>
                                <FormDescription className="text-xs">
                                  Can create and schedule coaching sessions
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="canViewSessionDetails"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled={selectedUser?.adminRole === 'super_admin'}
                                />
                              </FormControl>
                              <div className="space-y-1">
                                <FormLabel>Can view session details</FormLabel>
                                <FormDescription className="text-xs">
                                  Can view coaching session details and attendees
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setShowPermissionsModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={savePermissionsMutation.isPending}>
                    {savePermissionsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Permissions
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}