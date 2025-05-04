import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { User, AdminPermission } from "@shared/schema";
import { ArrowLeft, Loader2, Save, Shield } from "lucide-react";
import { useRoute, useLocation, Link } from "wouter";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";

// Schema for the edit permissions form
const editPermissionsSchema = z.object({
  isAdmin: z.boolean().default(false),
  adminRoles: z.array(z.string()).default([]),
  permissions: z.object({
    // User management
    canManageUsers: z.boolean().default(false),
    canManageAdmins: z.boolean().default(false),
    
    // Alert permissions
    canCreateAlerts: z.boolean().default(false),
    canEditAlerts: z.boolean().default(false),
    canDeleteAlerts: z.boolean().default(false),
    
    // Content permissions
    canCreateEducation: z.boolean().default(false),
    canEditEducation: z.boolean().default(false),
    canDeleteEducation: z.boolean().default(false),
    
    // Article permissions
    canCreateArticles: z.boolean().default(false),
    canEditArticles: z.boolean().default(false),
    canDeleteArticles: z.boolean().default(false),
    
    // Coaching permissions
    canManageCoaching: z.boolean().default(false),
    canManageGroupSessions: z.boolean().default(false),
    canScheduleSessions: z.boolean().default(false),
    canViewSessionDetails: z.boolean().default(false),
    
    // Analytics permissions
    canViewAnalytics: z.boolean().default(false),
  })
});

type EditPermissionsFormValues = z.infer<typeof editPermissionsSchema>;

export default function EditUserPermissions() {
  const [match, routeParams] = useRoute("/admin/users/edit-permissions");
  const queryParams = useQueryParams();
  // Check both route params and query params for the ID
  const id = routeParams?.id || queryParams.get('id');
  const { toast } = useToast();
  const { hasPermission } = useAdminPermissions();
  const [initialLoading, setInitialLoading] = useState(true);

  // Fetch user data
  const { data: user, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: [`/api/admin/users/${id}`],
    enabled: !!id,
  });

  // Fetch user permissions
  const { data: permissions, isLoading: isLoadingPermissions } = useQuery<AdminPermission>({
    queryKey: [`/api/admin/permissions/${id}`],
    enabled: !!id,
  });

  const form = useForm<EditPermissionsFormValues>({
    resolver: zodResolver(editPermissionsSchema),
    defaultValues: {
      isAdmin: false,
      adminRoles: [],
      permissions: {
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
        canManageGroupSessions: false,
        canScheduleSessions: false,
        canViewSessionDetails: false,
        canViewAnalytics: false,
      }
    }
  });

  const isLoading = isLoadingUser || isLoadingPermissions;

  // Update form when data is loaded
  useEffect(() => {
    if (user && permissions && initialLoading) {
      // Ensure adminRoles is always a string array
      let adminRolesArray: string[] = [];
      if (user.adminRoles) {
        if (Array.isArray(user.adminRoles)) {
          adminRolesArray = user.adminRoles.map(role => String(role));
        } else if (typeof user.adminRoles === 'string') {
          // Handle case where it might be a single string
          adminRolesArray = [user.adminRoles];
        }
      }
      
      form.reset({
        isAdmin: user.isAdmin === true, // Convert to boolean to avoid null
        adminRoles: adminRolesArray,
        permissions: {
          canManageUsers: permissions.canManageUsers === true,
          canManageAdmins: permissions.canManageAdmins === true,
          canCreateAlerts: permissions.canCreateAlerts === true,
          canEditAlerts: permissions.canEditAlerts === true,
          canDeleteAlerts: permissions.canDeleteAlerts === true,
          canCreateEducation: permissions.canCreateEducation === true,
          canEditEducation: permissions.canEditEducation === true,
          canDeleteEducation: permissions.canDeleteEducation === true,
          canCreateArticles: permissions.canCreateArticles === true,
          canEditArticles: permissions.canEditArticles === true,
          canDeleteArticles: permissions.canDeleteArticles === true,
          canManageCoaching: permissions.canManageCoaching === true,
          canManageGroupSessions: permissions.canManageGroupSessions === true,
          canScheduleSessions: permissions.canScheduleSessions === true,
          canViewSessionDetails: permissions.canViewSessionDetails === true,
          canViewAnalytics: permissions.canViewAnalytics === true,
        }
      });
      setInitialLoading(false);
    }
  }, [user, permissions, form, initialLoading]);

  // Mutation to update user permissions
  const updatePermissionsMutation = useMutation({
    mutationFn: async (data: EditPermissionsFormValues) => {
      // Update user admin status
      await apiRequest("PATCH", `/api/admin/users/${id}`, {
        isAdmin: data.isAdmin,
        adminRoles: data.isAdmin ? data.adminRoles : []
      });
      
      // Update permissions
      const res = await apiRequest("PATCH", `/api/admin/permissions/${id}`, data.permissions);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Permissions Updated",
        description: "User permissions have been updated successfully",
      });
      // Invalidate queries to fetch updated data
      queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/permissions/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update permissions",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditPermissionsFormValues) => {
    updatePermissionsMutation.mutate(data);
  };

  // Handle profile role change
  const watchIsAdmin = form.watch("isAdmin");
  useEffect(() => {
    // If admin status is turned off, reset permissions
    if (!watchIsAdmin) {
      form.setValue("adminRoles", []);
    }
  }, [watchIsAdmin, form]);

  // Handle permission templates
  const applyPermissionTemplate = (template: string) => {
    switch(template) {
      case "super_admin":
        form.setValue("permissions", {
          canManageUsers: true,
          canManageAdmins: true,
          canCreateAlerts: true,
          canEditAlerts: true,
          canDeleteAlerts: true,
          canCreateEducation: true,
          canEditEducation: true,
          canDeleteEducation: true,
          canCreateArticles: true,
          canEditArticles: true,
          canDeleteArticles: true,
          canManageCoaching: true,
          canManageGroupSessions: true,
          canScheduleSessions: true,
          canViewSessionDetails: true,
          canViewAnalytics: true,
        });
        break;
      case "content_admin":
        form.setValue("permissions", {
          canManageUsers: false,
          canManageAdmins: false,
          canCreateAlerts: false,
          canEditAlerts: false,
          canDeleteAlerts: false,
          canCreateEducation: true,
          canEditEducation: true,
          canDeleteEducation: true,
          canCreateArticles: true,
          canEditArticles: true,
          canDeleteArticles: true,
          canManageCoaching: false,
          canManageGroupSessions: false,
          canScheduleSessions: false,
          canViewSessionDetails: false,
          canViewAnalytics: true,
        });
        break;
      case "alerts_admin":
        form.setValue("permissions", {
          canManageUsers: false,
          canManageAdmins: false,
          canCreateAlerts: true,
          canEditAlerts: true,
          canDeleteAlerts: true,
          canCreateEducation: false,
          canEditEducation: false,
          canDeleteEducation: false,
          canCreateArticles: false,
          canEditArticles: false,
          canDeleteArticles: false,
          canManageCoaching: false,
          canManageGroupSessions: false,
          canScheduleSessions: false,
          canViewSessionDetails: false,
          canViewAnalytics: true,
        });
        break;
      case "coaching_admin":
        form.setValue("permissions", {
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
          canManageCoaching: true,
          canManageGroupSessions: true,
          canScheduleSessions: true,
          canViewSessionDetails: true,
          canViewAnalytics: true,
        });
        break;
      case "viewer":
        form.setValue("permissions", {
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
          canManageGroupSessions: false,
          canScheduleSessions: false,
          canViewSessionDetails: true,
          canViewAnalytics: true,
        });
        break;
      case "clear":
        form.setValue("permissions", {
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
          canManageGroupSessions: false,
          canScheduleSessions: false,
          canViewSessionDetails: false,
          canViewAnalytics: false,
        });
        break;
    }
  };

  // Determine if the current user can manage admins
  const canManageAdminPermissions = hasPermission("canManageAdmins");

  // Check if trying to edit a super admin (only super admins can edit other super admins)
  const isSuperAdmin = user?.adminRoles && Array.isArray(user.adminRoles) && user.adminRoles.includes("super_admin");
  const canEditThisUser = canManageAdminPermissions || !isSuperAdmin;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center h-64">
            <h2 className="text-xl font-semibold mb-2">User Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The user you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button asChild>
              <Link href="/admin/users">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Users
              </Link>
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Check permission to manage users/admins
  if (!canManageAdminPermissions && !hasPermission("canManageUsers")) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center h-64">
            <h2 className="text-xl font-semibold mb-2">Permission Denied</h2>
            <p className="text-muted-foreground mb-4">
              You don't have permission to edit user permissions.
            </p>
            <Button asChild>
              <Link href="/admin/users">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Users
              </Link>
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!canEditThisUser) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center h-64">
            <h2 className="text-xl font-semibold mb-2">Permission Denied</h2>
            <p className="text-muted-foreground mb-4">
              Only super admins can edit permissions for other super admins.
            </p>
            <Button asChild>
              <Link href="/admin/users">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Users
              </Link>
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:items-center md:space-y-0 mb-6">
          <div>
            <div className="flex items-center mb-1">
              <Button asChild variant="ghost" size="sm" className="mr-2">
                <Link href="/admin/users">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Link>
              </Button>
              <h1 className="text-3xl font-bold">Edit Permissions</h1>
            </div>
            <p className="text-muted-foreground">
              Manage permissions for {user.username}
            </p>
          </div>
          <div className="flex space-x-2">
            <Select onValueChange={applyPermissionTemplate}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Apply Template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="content_admin">Content Admin</SelectItem>
                <SelectItem value="alerts_admin">Alerts Admin</SelectItem>
                <SelectItem value="coaching_admin">Coaching Admin</SelectItem>
                <SelectItem value="viewer">Viewer Only</SelectItem>
                <SelectItem value="clear">Clear All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Admin Status</CardTitle>
                <CardDescription>
                  Set the user's admin status and role
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="isAdmin"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Administrator</FormLabel>
                          <FormDescription>
                            Grant admin access to this user
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {watchIsAdmin && (
                    <div className="space-y-3">
                      <FormLabel className="text-base">Admin Roles</FormLabel>
                      <FormDescription>
                        Select one or more roles for this admin user
                      </FormDescription>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                        {canManageAdminPermissions && (
                          <FormField
                            control={form.control}
                            name="adminRoles"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes("super_admin")}
                                    onCheckedChange={(checked) => {
                                      const updatedRoles = checked 
                                        ? [...field.value, "super_admin"] 
                                        : field.value.filter(role => role !== "super_admin");
                                      field.onChange(updatedRoles);
                                    }}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel className="font-medium">
                                    Super Admin
                                  </FormLabel>
                                  <FormDescription>
                                    Full access to all system features
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />
                        )}
                        <FormField
                          control={form.control}
                          name="adminRoles"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes("content_admin")}
                                  onCheckedChange={(checked) => {
                                    const updatedRoles = checked 
                                      ? [...field.value, "content_admin"] 
                                      : field.value.filter(role => role !== "content_admin");
                                    field.onChange(updatedRoles);
                                  }}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="font-medium">
                                  Content Admin
                                </FormLabel>
                                <FormDescription>
                                  Manage educational content and articles
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="adminRoles"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes("alerts_admin")}
                                  onCheckedChange={(checked) => {
                                    const updatedRoles = checked 
                                      ? [...field.value, "alerts_admin"] 
                                      : field.value.filter(role => role !== "alerts_admin");
                                    field.onChange(updatedRoles);
                                  }}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="font-medium">
                                  Alerts Admin
                                </FormLabel>
                                <FormDescription>
                                  Manage stock alerts and notifications
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="adminRoles"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes("education_admin")}
                                  onCheckedChange={(checked) => {
                                    const updatedRoles = checked 
                                      ? [...field.value, "education_admin"] 
                                      : field.value.filter(role => role !== "education_admin");
                                    field.onChange(updatedRoles);
                                  }}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="font-medium">
                                  Education Admin
                                </FormLabel>
                                <FormDescription>
                                  Manage educational courses and lessons
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="adminRoles"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes("coaching_admin")}
                                  onCheckedChange={(checked) => {
                                    const updatedRoles = checked 
                                      ? [...field.value, "coaching_admin"] 
                                      : field.value.filter(role => role !== "coaching_admin");
                                    field.onChange(updatedRoles);
                                  }}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="font-medium">
                                  Coaching Admin
                                </FormLabel>
                                <FormDescription>
                                  Manage coaching sessions and scheduling
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    Permissions for managing user accounts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="permissions.canManageUsers"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Manage Users
                          </FormLabel>
                          <FormDescription>
                            Can view, edit, and update regular user accounts
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="permissions.canManageAdmins"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!canManageAdminPermissions}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Manage Admins
                          </FormLabel>
                          <FormDescription>
                            Can create and manage admin accounts. Only super admins can grant this permission.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Stock Alerts</CardTitle>
                  <CardDescription>
                    Permissions for managing stock alerts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="permissions.canCreateAlerts"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Create Alerts
                          </FormLabel>
                          <FormDescription>
                            Can create new stock alerts
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="permissions.canEditAlerts"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Edit Alerts
                          </FormLabel>
                          <FormDescription>
                            Can modify existing stock alerts
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="permissions.canDeleteAlerts"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Delete Alerts
                          </FormLabel>
                          <FormDescription>
                            Can remove stock alerts from the system
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Education Content</CardTitle>
                  <CardDescription>
                    Permissions for managing education materials
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="permissions.canCreateEducation"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Create Education Content
                          </FormLabel>
                          <FormDescription>
                            Can create new courses, videos, and other educational materials
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="permissions.canEditEducation"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Edit Education Content
                          </FormLabel>
                          <FormDescription>
                            Can modify existing educational materials
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="permissions.canDeleteEducation"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Delete Education Content
                          </FormLabel>
                          <FormDescription>
                            Can remove educational materials from the system
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Articles</CardTitle>
                  <CardDescription>
                    Permissions for managing articles and news content
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="permissions.canCreateArticles"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Create Articles
                          </FormLabel>
                          <FormDescription>
                            Can create new articles and news content
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="permissions.canEditArticles"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Edit Articles
                          </FormLabel>
                          <FormDescription>
                            Can modify existing articles and news content
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="permissions.canDeleteArticles"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Delete Articles
                          </FormLabel>
                          <FormDescription>
                            Can remove articles and news content from the system
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Coaching</CardTitle>
                  <CardDescription>
                    Permissions for managing coaching sessions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="permissions.canManageCoaching"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Manage Coaching
                          </FormLabel>
                          <FormDescription>
                            Can manage all aspects of the coaching program
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="permissions.canManageGroupSessions"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Manage Group Sessions
                          </FormLabel>
                          <FormDescription>
                            Can create and manage group coaching sessions
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="permissions.canScheduleSessions"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Schedule Sessions
                          </FormLabel>
                          <FormDescription>
                            Can schedule and manage calendar availability
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="permissions.canViewSessionDetails"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            View Session Details
                          </FormLabel>
                          <FormDescription>
                            Can view details and attendees for coaching sessions
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Analytics</CardTitle>
                  <CardDescription>
                    Permissions for accessing analytics and reports
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="permissions.canViewAnalytics"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            View Analytics
                          </FormLabel>
                          <FormDescription>
                            Can access analytics, reports, and performance metrics
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button 
                type="submit" 
                className="w-full md:w-auto"
                disabled={updatePermissionsMutation.isPending}
              >
                {updatePermissionsMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Shield className="h-4 w-4 mr-2" />
                )}
                Save Permissions
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}