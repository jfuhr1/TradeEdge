import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { Separator } from "@/components/ui/separator";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ArrowLeft, User, UserRoundCog, CheckCircle2, Settings, Shield, GanttChart, Ban, CreditCard } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";
import { User as UserType, AdminPermission } from "@shared/schema";

// Edit Profile Tab
const editUserSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  tier: z.string(),
  phone: z.string().optional(),
  profilePicture: z.string().optional(),
}).omit({ password: true }); // Remove password from edit form

type EditUserFormValues = z.infer<typeof editUserSchema>;

// Change Tier Tab
const changeTierSchema = z.object({
  tier: z.enum(["free", "paid", "premium", "mentorship", "employee"]),
  reason: z.enum(["upgrade", "downgrade", "admin_action", "payment_issue", "customer_request"]),
  notifyUser: z.boolean().default(true),
  notes: z.string().optional(),
});

type ChangeTierFormValues = z.infer<typeof changeTierSchema>;

// Edit Permissions Tab
const adminRoles = [
  "super_admin",
  "content_admin",
  "alerts_admin",
  "coaching_admin",
  "analytics_admin",
  "customer_support",
] as const;

const editPermissionsSchema = z.object({
  isAdmin: z.boolean().default(false),
  adminRoles: z.array(z.string()).default([]),
  permissions: z.object({
    canManageUsers: z.boolean().default(false),
    canManageAdmins: z.boolean().default(false),
    canCreateAlerts: z.boolean().default(false),
    canEditAlerts: z.boolean().default(false),
    canDeleteAlerts: z.boolean().default(false),
    canCreateEducation: z.boolean().default(false),
    canEditEducation: z.boolean().default(false),
    canDeleteEducation: z.boolean().default(false),
    canCreateArticles: z.boolean().default(false),
    canEditArticles: z.boolean().default(false),
    canDeleteArticles: z.boolean().default(false),
    canManageCoaching: z.boolean().default(false),
    canManageGroupSessions: z.boolean().default(false),
    canScheduleSessions: z.boolean().default(false),
    canViewSessionDetails: z.boolean().default(false),
    canViewAnalytics: z.boolean().default(false),
  }).default({
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
  }),
});

type EditPermissionsFormValues = z.infer<typeof editPermissionsSchema>;

// Account Status Tab
const accountStatusSchema = z.object({
  status: z.enum(["active", "suspended", "disabled"]),
  reason: z.string().min(5).max(500).optional(),
  notifyUser: z.boolean().default(true),
});

type AccountStatusFormValues = z.infer<typeof accountStatusSchema>;

export default function ManageUser() {
  const [match, routeParams] = useRoute<{ id: string }>("/admin/users/manage/:id");
  const id = routeParams?.id || new URLSearchParams(window.location.search).get("id");
  const { hasPermission } = useAdminPermissions();
  const [activeTab, setActiveTab] = useState("profile");
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [initialLoadingPermissions, setInitialLoadingPermissions] = useState(true);
  const [tierUpdateSuccess, setTierUpdateSuccess] = useState(false);

  // Fetch user data
  const { data: user, isLoading: isLoadingUser } = useQuery<UserType>({
    queryKey: [`/api/admin/users/${id}`],
    enabled: !!id,
  });

  // Fetch user permissions
  const { data: permissions, isLoading: isLoadingPermissions } = useQuery<AdminPermission>({
    queryKey: [`/api/admin/permissions/${id}`],
    enabled: !!id,
  });

  const isLoading = isLoadingUser || isLoadingPermissions;

  // Profile form
  const profileForm = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      username: "",
      email: "",
      firstName: "",
      lastName: "",
      tier: "free",
      phone: "",
      profilePicture: "",
    },
  });

  // Tier form
  const tierForm = useForm<ChangeTierFormValues>({
    resolver: zodResolver(changeTierSchema),
    defaultValues: {
      tier: "free",
      reason: "upgrade",
      notifyUser: true,
      notes: "",
    },
  });

  // Permissions form
  const permissionsForm = useForm<EditPermissionsFormValues>({
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

  // Account status form
  const accountStatusForm = useForm<AccountStatusFormValues>({
    resolver: zodResolver(accountStatusSchema),
    defaultValues: {
      status: "active",
      reason: "",
      notifyUser: true,
    },
  });

  // Update profile form when user data is loaded
  useEffect(() => {
    if (user) {
      profileForm.reset({
        username: user.username,
        email: user.email,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        tier: user.tier,
        phone: user.phone || "",
        profilePicture: user.profilePicture || "",
      });
      
      tierForm.setValue("tier", user.tier as any);
    }
  }, [user, profileForm, tierForm]);

  // Update permissions form when data is loaded
  useEffect(() => {
    if (user && permissions && initialLoadingPermissions) {
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
      
      permissionsForm.reset({
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
      setInitialLoadingPermissions(false);
    }
  }, [user, permissions, permissionsForm, initialLoadingPermissions]);

  // Mutation to update user profile
  const updateUserMutation = useMutation({
    mutationFn: async (data: EditUserFormValues) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "User profile has been updated successfully",
      });
      // Invalidate user query to fetch updated data
      queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user profile",
        variant: "destructive",
      });
    },
  });

  // Mutation to reset password
  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/users/${id}/reset-password`, {});
      return await res.json();
    },
    onSuccess: () => {
      setIsPasswordReset(true);
      toast({
        title: "Password Reset",
        description: "User password has been reset successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    },
  });

  // Mutation to update membership tier
  const updateTierMutation = useMutation({
    mutationFn: async (data: ChangeTierFormValues) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${id}/change-tier`, data);
      return await res.json();
    },
    onSuccess: () => {
      setTierUpdateSuccess(true);
      toast({
        title: "Tier Updated",
        description: "User's membership tier has been updated successfully",
      });
      // Invalidate queries to fetch updated data
      queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update membership tier",
        variant: "destructive",
      });
    },
  });

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

  // Mutation to update account status
  const updateAccountStatusMutation = useMutation({
    mutationFn: async (data: AccountStatusFormValues) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${id}/status`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Account Status Updated",
        description: "User account status has been updated successfully",
      });
      // Invalidate queries to fetch updated data
      queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update account status",
        variant: "destructive",
      });
    },
  });

  // Form submission handlers
  const onProfileSubmit = (data: EditUserFormValues) => {
    updateUserMutation.mutate(data);
  };

  const onTierSubmit = (data: ChangeTierFormValues) => {
    updateTierMutation.mutate(data);
  };

  const onPermissionsSubmit = (data: EditPermissionsFormValues) => {
    updatePermissionsMutation.mutate(data);
  };

  const onAccountStatusSubmit = (data: AccountStatusFormValues) => {
    updateAccountStatusMutation.mutate(data);
  };

  const handleResetPassword = () => {
    if (window.confirm("Are you sure you want to reset this user's password? They will receive an email with reset instructions.")) {
      resetPasswordMutation.mutate();
    }
  };

  // Handle permission templates
  const applyPermissionTemplate = (template: string) => {
    switch(template) {
      case "super_admin":
        permissionsForm.setValue("permissions", {
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
        permissionsForm.setValue("permissions", {
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
        permissionsForm.setValue("permissions", {
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
        permissionsForm.setValue("permissions", {
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
        permissionsForm.setValue("permissions", {
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
        permissionsForm.setValue("permissions", {
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

  // Watch for admin status change
  const watchIsAdmin = permissionsForm.watch("isAdmin");
  useEffect(() => {
    // If admin status is turned off, reset permissions
    if (!watchIsAdmin) {
      permissionsForm.setValue("adminRoles", []);
    }
  }, [watchIsAdmin, permissionsForm]);

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

  // Check permission to edit users
  if (!hasPermission("canManageUsers")) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center h-64">
            <h2 className="text-xl font-semibold mb-2">Permission Denied</h2>
            <p className="text-muted-foreground mb-4">
              You don't have permission to edit user profiles.
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
              <h1 className="text-3xl font-bold">Manage User</h1>
            </div>
            <p className="text-muted-foreground">
              {user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName} (${user.username})`
                : user.username
              }
            </p>
          </div>
        </div>

        <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className={`grid w-full ${user.tier === 'employee' || (user.isAdmin && user.tier !== 'free') ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <TabsTrigger value="profile" className="flex items-center">
              <User className="w-4 h-4 mr-2" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="tier" className="flex items-center">
              <CreditCard className="w-4 h-4 mr-2" />
              <span>Membership</span>
            </TabsTrigger>
            {(user.tier === 'employee' || (user.isAdmin && user.tier !== 'free')) && (
              <TabsTrigger value="permissions" className="flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                <span>Permissions</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="account" className="flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              <span>Account</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Form {...profileForm}>
                      <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                        <FormField
                          control={profileForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormDescription>
                                The username must be unique across the platform.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={profileForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input {...field} type="email" />
                              </FormControl>
                              <FormDescription>
                                The user will receive notifications at this email address.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={profileForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={profileForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={profileForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormDescription>
                                  Used for SMS alerts if enabled.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={profileForm.control}
                          name="profilePicture"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Profile Picture URL</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormDescription>
                                Enter a URL for the user's profile picture.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-between space-x-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={handleResetPassword}
                            disabled={resetPasswordMutation.isPending || isPasswordReset}
                          >
                            {resetPasswordMutation.isPending ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : null}
                            {isPasswordReset ? "Password Reset Sent" : "Reset Password"}
                          </Button>
                          <Button type="submit" disabled={updateUserMutation.isPending}>
                            {updateUserMutation.isPending ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : null}
                            Save Profile
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>User Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col items-center mb-4">
                      <div className="h-24 w-24 overflow-hidden rounded-full bg-muted flex items-center justify-center text-3xl font-semibold">
                        {user.profilePicture ? (
                          <img 
                            src={user.profilePicture}
                            alt={user.username}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <span>
                            {user.firstName?.charAt(0) || user.username.charAt(0)}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-medium mt-2">{user.username}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground">Member Since</h3>
                      <p>{new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground">Current Tier</h3>
                      <p className="capitalize">{user.tier}</p>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground">Admin Status</h3>
                      <p>{user.isAdmin ? 'Admin' : 'Regular User'}</p>
                      {user.isAdmin && user.adminRoles && Array.isArray(user.adminRoles) && user.adminRoles.length > 0 && (
                        <div className="text-sm text-muted-foreground mt-1">
                          <p>Roles:</p>
                          <ul className="list-disc pl-5 mt-1">
                            {user.adminRoles.map((role: string, index: number) => (
                              <li key={index} className="capitalize">{String(role).replace('_', ' ')}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Membership Tier Tab */}
          <TabsContent value="tier">
            {tierUpdateSuccess ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                  <CardTitle className="text-center text-2xl">Tier Updated Successfully</CardTitle>
                  <CardDescription className="text-center">
                    {user.username}'s membership has been updated to the {tierForm.watch("tier")} tier.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="mb-4">
                    {tierForm.getValues("notifyUser") 
                      ? "The user has been notified of this change."
                      : "The user has not been notified of this change."}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <Button onClick={() => setTierUpdateSuccess(false)}>
                    Make Another Change
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Select Membership Tier</CardTitle>
                      <CardDescription>
                        Choose the appropriate membership level for this user
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...tierForm}>
                        <form onSubmit={tierForm.handleSubmit(onTierSubmit)} className="space-y-6">
                          <FormField
                            control={tierForm.control}
                            name="tier"
                            render={({ field }) => (
                              <FormItem className="space-y-3">
                                <FormLabel>Membership Tier</FormLabel>
                                <FormControl>
                                  <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="space-y-3"
                                  >
                                    <FormItem className="flex items-center space-x-3 space-y-0 border p-4 rounded-md">
                                      <FormControl>
                                        <RadioGroupItem value="free" />
                                      </FormControl>
                                      <FormLabel className="font-normal cursor-pointer flex-1">
                                        <div className="flex justify-between items-center">
                                          <span className="font-semibold">Free</span>
                                          <span className="text-muted-foreground text-sm">$0</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">Basic access with limited features</p>
                                      </FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0 border p-4 rounded-md">
                                      <FormControl>
                                        <RadioGroupItem value="paid" />
                                      </FormControl>
                                      <FormLabel className="font-normal cursor-pointer flex-1">
                                        <div className="flex justify-between items-center">
                                          <span className="font-semibold">Paid</span>
                                          <span className="text-muted-foreground text-sm">$29.99/month</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">Standard access with most features</p>
                                      </FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0 border p-4 rounded-md">
                                      <FormControl>
                                        <RadioGroupItem value="premium" />
                                      </FormControl>
                                      <FormLabel className="font-normal cursor-pointer flex-1">
                                        <div className="flex justify-between items-center">
                                          <span className="font-semibold">Premium</span>
                                          <span className="text-muted-foreground text-sm">$999/year</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">Full access with premium features and group coaching</p>
                                      </FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0 border p-4 rounded-md">
                                      <FormControl>
                                        <RadioGroupItem value="mentorship" />
                                      </FormControl>
                                      <FormLabel className="font-normal cursor-pointer flex-1">
                                        <div className="flex justify-between items-center">
                                          <span className="font-semibold">Mentorship</span>
                                          <span className="text-muted-foreground text-sm">$5,000 one-time</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">All features plus one-on-one coaching and direct support</p>
                                      </FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0 border p-4 rounded-md bg-amber-50">
                                      <FormControl>
                                        <RadioGroupItem value="employee" />
                                      </FormControl>
                                      <FormLabel className="font-normal cursor-pointer flex-1">
                                        <div className="flex justify-between items-center">
                                          <span className="font-semibold">Employee</span>
                                          <span className="text-muted-foreground text-sm">Internal</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">Full platform access with optional admin capabilities</p>
                                      </FormLabel>
                                    </FormItem>
                                  </RadioGroup>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Separator />

                          <FormField
                            control={tierForm.control}
                            name="reason"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Reason for Change</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a reason" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="upgrade">Upgrade</SelectItem>
                                    <SelectItem value="downgrade">Downgrade</SelectItem>
                                    <SelectItem value="admin_action">Administrative Action</SelectItem>
                                    <SelectItem value="payment_issue">Payment Issue</SelectItem>
                                    <SelectItem value="customer_request">Customer Request</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={tierForm.control}
                            name="notifyUser"
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
                                    Notify User
                                  </FormLabel>
                                  <FormDescription>
                                    Send an email notification about this change
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={tierForm.control}
                            name="notes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Notes</FormLabel>
                                <FormControl>
                                  <textarea
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Add any notes or comments about this change"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Button 
                            type="submit" 
                            className="w-full"
                            disabled={updateTierMutation.isPending}
                          >
                            {updateTierMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Membership Tier
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Tier Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-medium mb-2">Current Tier</h3>
                          <div className="bg-muted p-3 rounded-md">
                            <span className="font-semibold capitalize">{user.tier}</span>
                          </div>
                        </div>

                        <div>
                          <h3 className="font-medium mb-2">Payment Information</h3>
                          <div className="text-sm space-y-2">
                            <div className="flex justify-between">
                              <span>Last billing date:</span>
                              <span>{user.lastBillingDate ? new Date(user.lastBillingDate).toLocaleDateString() : 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Last billing amount:</span>
                              <span>${user.lastBillingAmount || '0.00'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Next billing date:</span>
                              <span>{user.nextBillingDate ? new Date(user.nextBillingDate).toLocaleDateString() : 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Next billing amount:</span>
                              <span>${user.nextBillingAmount || '0.00'}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="font-medium mb-2">Membership History</h3>
                          <div className="text-sm space-y-2 max-h-40 overflow-y-auto">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Initial</span>
                              <span>{new Date(user.createdAt).toLocaleDateString()}: Joined as {user.initialTier || 'free'}</span>
                            </div>
                            {user.tierChanges && user.tierChanges.map((change, index) => (
                              <div key={index} className="flex items-center gap-2 text-xs">
                                <span className={`${change.type === 'upgrade' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'} px-2 py-0.5 rounded-full`}>
                                  {change.type === 'upgrade' ? 'Upgrade' : 'Downgrade'}
                                </span>
                                <span>{new Date(change.date).toLocaleDateString()}: {change.from} → {change.to}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h3 className="font-medium mb-2">Selected Tier Features</h3>
                          <div className="space-y-2">
                            {tierForm.watch("tier") === "free" && (
                              <ul className="list-disc pl-5 space-y-1">
                                <li>Basic stock alerts (delayed)</li>
                                <li>Limited educational content</li>
                                <li>Basic portfolio tracking</li>
                                <li>Community forum access</li>
                              </ul>
                            )}
                            {tierForm.watch("tier") === "paid" && (
                              <ul className="list-disc pl-5 space-y-1">
                                <li>Real-time stock alerts</li>
                                <li>Full educational library</li>
                                <li>Advanced portfolio tracking</li>
                                <li>Weekly market updates</li>
                                <li>Email and SMS notifications</li>
                              </ul>
                            )}
                            {tierForm.watch("tier") === "premium" && (
                              <ul className="list-disc pl-5 space-y-1">
                                <li>All Paid tier features</li>
                                <li>Priority alert notifications</li>
                                <li>Monthly group coaching sessions</li>
                                <li>Advanced technical analysis</li>
                                <li>Customized alert preferences</li>
                                <li>Extended historical data</li>
                              </ul>
                            )}
                            {tierForm.watch("tier") === "mentorship" && (
                              <ul className="list-disc pl-5 space-y-1">
                                <li>All Premium tier features</li>
                                <li>1-on-1 coaching sessions</li>
                                <li>Personalized trading strategy</li>
                                <li>Direct messaging with analysts</li>
                                <li>VIP support channel</li>
                                <li>Early access to new features</li>
                              </ul>
                            )}
                            {tierForm.watch("tier") === "employee" && (
                              <ul className="list-disc pl-5 space-y-1">
                                <li>All platform features</li>
                                <li>Internal admin tools access</li>
                                <li>Optional admin permissions</li>
                                <li>System configuration access</li>
                                <li>Support role capabilities</li>
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions">
            {(user.tier === 'employee' || (user.isAdmin && user.tier !== 'free')) ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Manage Permissions</CardTitle>
                      <CardDescription>
                        Set administrative access and specific permissions for this user
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...permissionsForm}>
                        <form onSubmit={permissionsForm.handleSubmit(onPermissionsSubmit)} className="space-y-8">
                          {/* Admin Status */}
                          <FormField
                            control={permissionsForm.control}
                            name="isAdmin"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    disabled={!hasPermission("canManageAdmins")}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>
                                    Admin Status
                                  </FormLabel>
                                  <FormDescription>
                                    Grant this user administrative privileges
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />

                        {/* Admin Roles */}
                        {permissionsForm.watch("isAdmin") && (
                          <FormField
                            control={permissionsForm.control}
                            name="adminRoles"
                            render={() => (
                              <FormItem>
                                <div className="mb-4">
                                  <FormLabel className="text-base">Admin Roles</FormLabel>
                                  <FormDescription>
                                    Select the administrative roles for this user
                                  </FormDescription>
                                </div>
                                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                                  {adminRoles.map((role) => (
                                    <FormField
                                      key={role}
                                      control={permissionsForm.control}
                                      name="adminRoles"
                                      render={({ field }) => {
                                        return (
                                          <FormItem
                                            key={role}
                                            className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 shadow-sm"
                                          >
                                            <FormControl>
                                              <Checkbox
                                                checked={field.value?.includes(role)}
                                                onCheckedChange={(checked) => {
                                                  return checked
                                                    ? field.onChange([...field.value, role])
                                                    : field.onChange(
                                                        field.value?.filter(
                                                          (value) => value !== role
                                                        )
                                                      )
                                                }}
                                                disabled={role === "super_admin" && !hasPermission("canManageAdmins")}
                                              />
                                            </FormControl>
                                            <FormLabel className="capitalize font-normal">
                                              {role.replace("_", " ")}
                                            </FormLabel>
                                          </FormItem>
                                        )
                                      }}
                                    />
                                  ))}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {/* Permission Templates */}
                        <div className="border rounded-md p-4 shadow-sm">
                          <div className="mb-4">
                            <h3 className="text-base font-medium">Permission Templates</h3>
                            <p className="text-sm text-muted-foreground">Quickly apply common permission sets</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => applyPermissionTemplate("super_admin")}
                              disabled={!hasPermission("canManageAdmins")}
                            >
                              Super Admin
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => applyPermissionTemplate("content_admin")}
                            >
                              Content Admin
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => applyPermissionTemplate("alerts_admin")}
                            >
                              Alerts Admin
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => applyPermissionTemplate("coaching_admin")}
                            >
                              Coaching Admin
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => applyPermissionTemplate("viewer")}
                            >
                              Viewer
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => applyPermissionTemplate("clear")}
                            >
                              Clear All
                            </Button>
                          </div>
                        </div>

                        {/* Individual Permissions */}
                        <div className="border rounded-md p-4 shadow-sm">
                          <div className="mb-4">
                            <h3 className="text-base font-medium">Individual Permissions</h3>
                            <p className="text-sm text-muted-foreground">Configure specific access permissions</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* User Management */}
                            <div className="border rounded-md p-3">
                              <h4 className="font-medium mb-2">User Management</h4>
                              <div className="space-y-2">
                                <FormField
                                  control={permissionsForm.control}
                                  name="permissions.canManageUsers"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        Manage Users
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={permissionsForm.control}
                                  name="permissions.canManageAdmins"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                          disabled={!hasPermission("canManageAdmins")}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        Manage Admins
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>

                            {/* Alert Management */}
                            <div className="border rounded-md p-3">
                              <h4 className="font-medium mb-2">Alert Management</h4>
                              <div className="space-y-2">
                                <FormField
                                  control={permissionsForm.control}
                                  name="permissions.canCreateAlerts"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        Create Alerts
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={permissionsForm.control}
                                  name="permissions.canEditAlerts"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        Edit Alerts
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={permissionsForm.control}
                                  name="permissions.canDeleteAlerts"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        Delete Alerts
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>

                            {/* Education Management */}
                            <div className="border rounded-md p-3">
                              <h4 className="font-medium mb-2">Education Management</h4>
                              <div className="space-y-2">
                                <FormField
                                  control={permissionsForm.control}
                                  name="permissions.canCreateEducation"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        Create Education
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={permissionsForm.control}
                                  name="permissions.canEditEducation"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        Edit Education
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={permissionsForm.control}
                                  name="permissions.canDeleteEducation"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        Delete Education
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>

                            {/* Articles Management */}
                            <div className="border rounded-md p-3">
                              <h4 className="font-medium mb-2">Articles Management</h4>
                              <div className="space-y-2">
                                <FormField
                                  control={permissionsForm.control}
                                  name="permissions.canCreateArticles"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        Create Articles
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={permissionsForm.control}
                                  name="permissions.canEditArticles"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        Edit Articles
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={permissionsForm.control}
                                  name="permissions.canDeleteArticles"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        Delete Articles
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>

                            {/* Coaching Management */}
                            <div className="border rounded-md p-3">
                              <h4 className="font-medium mb-2">Coaching Management</h4>
                              <div className="space-y-2">
                                <FormField
                                  control={permissionsForm.control}
                                  name="permissions.canManageCoaching"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        Manage Coaching
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={permissionsForm.control}
                                  name="permissions.canManageGroupSessions"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        Manage Group Sessions
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={permissionsForm.control}
                                  name="permissions.canScheduleSessions"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        Schedule Sessions
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>

                            {/* Analytics & Visibility */}
                            <div className="border rounded-md p-3">
                              <h4 className="font-medium mb-2">Analytics & Visibility</h4>
                              <div className="space-y-2">
                                <FormField
                                  control={permissionsForm.control}
                                  name="permissions.canViewSessionDetails"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        View Session Details
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={permissionsForm.control}
                                  name="permissions.canViewAnalytics"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        View Analytics
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <Button 
                          type="submit" 
                          disabled={updatePermissionsMutation.isPending}
                        >
                          {updatePermissionsMutation.isPending && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          Save Permissions
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Permissions Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Current Status</h3>
                      <div className="bg-muted p-3 rounded-md">
                        <span className={`font-semibold ${user.isAdmin ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {user.isAdmin ? 'Admin User' : 'Regular User'}
                        </span>
                      </div>
                    </div>

                    <Separator />

                    {user.isAdmin && user.adminRoles && Array.isArray(user.adminRoles) && user.adminRoles.length > 0 && (
                      <>
                        <div>
                          <h3 className="font-medium mb-2">Admin Roles</h3>
                          <div className="space-y-2">
                            <ul className="list-disc pl-5">
                              {user.adminRoles.map((role: string, index: number) => (
                                <li key={index} className="capitalize">
                                  {String(role).replace('_', ' ')}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        <Separator />
                      </>
                    )}

                    <div>
                      <h3 className="font-medium mb-2">Role Information</h3>
                      <div className="text-sm text-muted-foreground">
                        <p className="mb-2"><strong>Super Admin:</strong> Complete access to all features and can manage other admins.</p>
                        <p className="mb-2"><strong>Content Admin:</strong> Can create, edit, and delete educational content and articles.</p>
                        <p className="mb-2"><strong>Alerts Admin:</strong> Can create, edit, and delete stock alerts.</p>
                        <p className="mb-2"><strong>Coaching Admin:</strong> Can manage coaching sessions and group events.</p>
                        <p><strong>Analytics Admin:</strong> Can access all analytics and reporting features.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <Shield className="h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Permissions Restricted</h2>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  Administrative permissions are only available for Employee tier users or for Admin users with Premium or Mentorship tiers.
                </p>
                <p className="text-sm text-muted-foreground">
                  To manage permissions, please upgrade this user's tier first.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Account Status Tab */}
          <TabsContent value="account">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Status Management</CardTitle>
                    <CardDescription>
                      Manage user account status and access to the platform
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...accountStatusForm}>
                      <form onSubmit={accountStatusForm.handleSubmit(onAccountStatusSubmit)} className="space-y-6">
                        <FormField
                          control={accountStatusForm.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel>Account Status</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  className="space-y-3"
                                >
                                  <FormItem className="flex items-center space-x-3 space-y-0 border p-4 rounded-md">
                                    <FormControl>
                                      <RadioGroupItem value="active" />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer flex-1">
                                      <div className="flex justify-between items-center">
                                        <span className="font-semibold text-green-600">Active</span>
                                      </div>
                                      <p className="text-sm text-muted-foreground">User has full access to the platform</p>
                                    </FormLabel>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-3 space-y-0 border p-4 rounded-md">
                                    <FormControl>
                                      <RadioGroupItem value="suspended" />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer flex-1">
                                      <div className="flex justify-between items-center">
                                        <span className="font-semibold text-yellow-600">Suspended</span>
                                      </div>
                                      <p className="text-sm text-muted-foreground">Temporary suspension, user cannot login but data is preserved</p>
                                    </FormLabel>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-3 space-y-0 border p-4 rounded-md">
                                    <FormControl>
                                      <RadioGroupItem value="disabled" />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer flex-1">
                                      <div className="flex justify-between items-center">
                                        <span className="font-semibold text-red-600">Disabled</span>
                                      </div>
                                      <p className="text-sm text-muted-foreground">Account is disabled, user cannot login, major action</p>
                                    </FormLabel>
                                  </FormItem>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={accountStatusForm.control}
                          name="reason"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Reason for Change</FormLabel>
                              <FormControl>
                                <textarea
                                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  placeholder="Provide a detailed reason for this account status change"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                This information will be used for administrative purposes
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={accountStatusForm.control}
                          name="notifyUser"
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
                                  Notify User
                                </FormLabel>
                                <FormDescription>
                                  Send an email notification about this change
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end">
                          <Button 
                            type="submit" 
                            disabled={updateAccountStatusMutation.isPending}
                            variant={accountStatusForm.watch("status") === "disabled" ? "destructive" : "default"}
                          >
                            {updateAccountStatusMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Account Status
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Current Status</h3>
                      <div className="bg-muted p-3 rounded-md">
                        <span className="font-semibold text-green-600">Active</span>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="font-medium mb-2">Account Created</h3>
                      <p>{new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="font-medium mb-2">Status Information</h3>
                      <div className="text-sm text-muted-foreground space-y-2">
                        <p><strong>Active:</strong> User has full access to their account and the platform.</p>
                        <p><strong>Suspended:</strong> Temporary restriction - useful for billing issues or temporary bans. The account remains intact but login is prevented.</p>
                        <p><strong>Disabled:</strong> Major action that prevents login. Usually reserved for policy violations or user request for account deletion.</p>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground">Important Notes</h3>
                      <ul className="list-disc pl-5 text-sm mt-2 text-muted-foreground">
                        <li>Changes to account status are logged for audit purposes</li>
                        <li>Super admins cannot have their accounts disabled by other admins</li>
                        <li>Always provide a clear reason when changing account status</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}