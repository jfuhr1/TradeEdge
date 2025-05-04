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
import { Badge } from "@/components/ui/badge";
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
  isActive: z.boolean().default(true),
  isSuspended: z.boolean().default(false),
});

type AccountStatusFormValues = z.infer<typeof accountStatusSchema>;

export default function ManageUser() {
  const [match, params] = useRoute<{ id: string }>("/admin/users/manage-combined/:id");
  const id = match ? params.id : new URLSearchParams(window.location.search).get("id") || "";
  
  const [profileUpdateSuccess, setProfileUpdateSuccess] = useState(false);
  const [tierUpdateSuccess, setTierUpdateSuccess] = useState(false);
  const [permissionsUpdateSuccess, setPermissionsUpdateSuccess] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  
  const { hasPermission } = useAdminPermissions();

  // Fetch user data
  const { data: user, isLoading, refetch } = useQuery<UserType>({
    queryKey: [`/api/admin/users/${id}`],
    enabled: !!id,
  });

  // Fetch user permissions if they are an employee/admin
  const { data: permissions } = useQuery<AdminPermission>({
    queryKey: [`/api/admin/permissions/${id}`],
    enabled: !!id && !!user?.isAdmin,
  });

  // Forms initialization
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

  const tierForm = useForm<ChangeTierFormValues>({
    resolver: zodResolver(changeTierSchema),
    defaultValues: {
      tier: "free",
      reason: "admin_action",
      notifyUser: true,
      notes: "",
    },
  });

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
      },
    },
  });

  const accountForm = useForm<AccountStatusFormValues>({
    resolver: zodResolver(accountStatusSchema),
    defaultValues: {
      isActive: true,
      isSuspended: false,
    },
  });

  // Populate forms when user data is available
  useEffect(() => {
    if (user) {
      // Profile form
      profileForm.reset({
        username: user.username,
        email: user.email,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        tier: user.tier,
        phone: user.phone || "",
        profilePicture: user.profilePicture || "",
      });

      // Tier form
      tierForm.setValue("tier", user.tier as any);

      // Permissions form
      permissionsForm.setValue("isAdmin", user.isAdmin || false);
      permissionsForm.setValue("adminRoles", user.adminRoles as string[] || []);

      // If permissions data is available
      if (permissions) {
        permissionsForm.setValue("permissions", {
          canManageUsers: permissions.canManageUsers,
          canManageAdmins: permissions.canManageAdmins,
          canCreateAlerts: permissions.canCreateAlerts,
          canEditAlerts: permissions.canEditAlerts,
          canDeleteAlerts: permissions.canDeleteAlerts,
          canCreateEducation: permissions.canCreateEducation,
          canEditEducation: permissions.canEditEducation,
          canDeleteEducation: permissions.canDeleteEducation,
          canCreateArticles: permissions.canCreateArticles || false,
          canEditArticles: permissions.canEditArticles || false,
          canDeleteArticles: permissions.canDeleteArticles || false,
          canManageCoaching: permissions.canManageCoaching,
          canManageGroupSessions: permissions.canManageGroupSessions,
          canScheduleSessions: permissions.canScheduleSessions,
          canViewSessionDetails: permissions.canViewSessionDetails,
          canViewAnalytics: permissions.canViewAnalytics,
        });
      }
    }
  }, [user, permissions, profileForm, tierForm, permissionsForm]);

  // Mutation for updating profile
  const profileUpdateMutation = useMutation({
    mutationFn: async (data: EditUserFormValues) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      setProfileUpdateSuccess(true);
      toast({
        title: "Profile Updated",
        description: "User profile has been updated successfully",
      });
      refetch();
      setTimeout(() => setProfileUpdateSuccess(false), 3000);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // Mutation for resetting password
  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/users/${id}/reset-password`, {});
      return await res.json();
    },
    onSuccess: (data) => {
      setIsPasswordReset(true);
      toast({
        title: "Password Reset",
        description: `New password: ${data.newPassword}`,
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

  // Mutation to update user tier
  const tierUpdateMutation = useMutation({
    mutationFn: async (data: ChangeTierFormValues) => {
      try {
        const res = await apiRequest("PATCH", `/api/admin/users/${id}/change-tier`, data);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to update membership tier");
        }
        return await res.json();
      } catch (error: any) {
        console.error("Tier update error:", error);
        throw error;
      }
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
      console.error("Mutation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update membership tier",
        variant: "destructive",
      });
    },
  });

  // Mutation to update user permissions
  const permissionsUpdateMutation = useMutation({
    mutationFn: async (data: EditPermissionsFormValues) => {
      // First update admin status and roles on user
      const userUpdateRes = await apiRequest("PATCH", `/api/admin/users/${id}`, {
        isAdmin: data.isAdmin,
        adminRoles: data.adminRoles,
      });

      if (!userUpdateRes.ok) {
        const errorData = await userUpdateRes.json();
        throw new Error(errorData.message || "Failed to update admin status");
      }

      // Then update specific permissions
      const permissionsRes = await apiRequest("PUT", `/api/admin/permissions/${id}`, {
        ...data.permissions,
      });

      if (!permissionsRes.ok) {
        const errorData = await permissionsRes.json();
        throw new Error(errorData.message || "Failed to update permissions");
      }

      return await permissionsRes.json();
    },
    onSuccess: () => {
      setPermissionsUpdateSuccess(true);
      toast({
        title: "Permissions Updated",
        description: "User permissions have been updated successfully",
      });
      // Invalidate queries to fetch updated data
      queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/permissions/${id}`] });
      setTimeout(() => setPermissionsUpdateSuccess(false), 3000);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update permissions",
        variant: "destructive",
      });
    },
  });

  // Form submission handlers
  const onProfileSubmit = (data: EditUserFormValues) => {
    profileUpdateMutation.mutate(data);
  };

  const handleResetPassword = () => {
    resetPasswordMutation.mutate();
  };

  const onTierSubmit = (data: ChangeTierFormValues) => {
    tierUpdateMutation.mutate(data);
  };

  const onPermissionsSubmit = (data: EditPermissionsFormValues) => {
    permissionsUpdateMutation.mutate(data);
  };

  // Handle applying permission templates
  const handlePermissionTemplateChange = (template: string) => {
    switch (template) {
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
      handlePermissionTemplateChange("clear");
    }
  }, [watchIsAdmin]);

  // Tier information for displaying features
  const tierInfo = {
    free: {
      title: "Free Tier",
      description: "Basic access with limited features",
      features: [
        "Access to free stock alerts",
        "View public educational content",
        "Basic portfolio tracking",
        "Market news and updates",
      ],
    },
    paid: {
      title: "Paid Tier",
      description: "Standard access with most features",
      features: [
        "All free tier features",
        "Full access to stock alerts",
        "Basic educational content",
        "Email notifications",
        "Basic portfolio analytics",
      ],
    },
    premium: {
      title: "Premium Tier",
      description: "Full access with premium features",
      features: [
        "All paid tier features",
        "Priority stock alerts",
        "Advanced educational content",
        "Group coaching sessions",
        "Advanced portfolio analytics",
        "Custom alert notifications",
      ],
    },
    mentorship: {
      title: "Mentorship Tier",
      description: "All features plus one-on-one coaching",
      features: [
        "All premium tier features",
        "One-on-one coaching sessions",
        "Personalized investment strategy",
        "Direct support from experts",
        "Custom portfolio reviews",
        "VIP community access",
      ],
    },
    employee: {
      title: "Employee Tier",
      description: "Internal staff access with admin capabilities",
      features: [
        "All platform features",
        "Admin panel access",
        "Content management",
        "User management",
        "Analytics dashboard",
        "System configuration",
      ],
    },
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "free":
        return "bg-gray-200 hover:bg-gray-300 text-gray-800";
      case "paid":
        return "bg-blue-100 hover:bg-blue-200 text-blue-800";
      case "premium":
        return "bg-purple-100 hover:bg-purple-200 text-purple-800";
      case "mentorship":
        return "bg-amber-100 hover:bg-amber-200 text-amber-800";
      case "employee":
        return "bg-green-100 hover:bg-green-200 text-green-800";
      default:
        return "bg-gray-100 hover:bg-gray-200 text-gray-800";
    }
  };

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
            {user && (
              <p className="text-muted-foreground">
                {user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName} (${user.username})`
                  : user.username}
              </p>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !user ? (
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
        ) : (
          <div className="space-y-6">
            {/* User Profile Overview Card - Always visible at the top */}
            <Card className="bg-card/50 border-blue-100">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-semibold">
                      {user.firstName?.charAt(0) || user.username.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">{user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}</h2>
                      <p className="text-muted-foreground">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getTierColor(user.tier)}>{user.tier}</Badge>
                        {user.isAdmin && <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Admin</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={handleResetPassword} disabled={resetPasswordMutation.isPending || isPasswordReset}>
                      {resetPasswordMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : isPasswordReset ? (
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                      ) : null}
                      Reset Password
                    </Button>
                    {user.tier === "employee" && (
                      <Button asChild variant="secondary" size="sm">
                        <Link href={`/admin/users/edit-permissions?id=${user.id}`}>
                          <Shield className="h-4 w-4 mr-1" />
                          Edit Permissions
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main content with tabs */}
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="profile">
                  <User className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline mr-1">User</span> Profile
                </TabsTrigger>
                <TabsTrigger value="membership">
                  <GanttChart className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Membership</span> & Billing
                </TabsTrigger>
                <TabsTrigger value="account">
                  <Settings className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Account</span> Settings
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Left column - Edit form */}
                  <div className="md:col-span-2">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Profile Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Form {...profileForm}>
                          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={profileForm.control}
                                name="username"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Username</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
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
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
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
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={profileForm.control}
                                name="phone"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Phone Number</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={profileForm.control}
                                name="profilePicture"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Profile Picture URL</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="pt-2 flex justify-end">
                              <Button 
                                type="submit" 
                                disabled={!profileForm.formState.isDirty || profileUpdateMutation.isPending}
                              >
                                {profileUpdateMutation.isPending ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                  </>
                                ) : profileUpdateSuccess ? (
                                  <>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Saved
                                  </>
                                ) : (
                                  "Save Changes"
                                )}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right column - Info card */}
                  <div>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Account Info</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">User ID:</span>
                          <span className="font-medium">{user.id}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Joined:</span>
                          <span className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Current Tier:</span>
                          <span className="font-medium capitalize">{user.tier}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Admin:</span>
                          <span className="font-medium">{user.isAdmin ? 'Yes' : 'No'}</span>
                        </div>
                        
                        {user.isAdmin && user.adminRoles && Array.isArray(user.adminRoles) && user.adminRoles.length > 0 && (
                          <>
                            <Separator />
                            <div>
                              <span className="text-muted-foreground">Roles:</span>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {user.adminRoles.map((role: string, index: number) => (
                                  <Badge key={index} variant="outline" className="capitalize">
                                    {String(role).replace('_', ' ')}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>

                    {/* Activity Summary */}
                    <Card className="mt-4">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Activity Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Portfolio Items:</span>
                          <span className="font-medium">0 stocks</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Education Progress:</span>
                          <span className="font-medium">0 lessons completed</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Coaching Sessions:</span>
                          <span className="font-medium">0 sessions booked</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {user.tier === "employee" && (
                  <div className="mt-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Admin Permissions Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {permissions && (
                            <>
                              <div className="border rounded-md p-3">
                                <h3 className="font-medium text-sm mb-2">User Management</h3>
                                <div className="space-y-1 text-sm">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${permissions.canManageUsers ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                    <span>Manage Users</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${permissions.canManageAdmins ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                    <span>Manage Admins</span>
                                  </div>
                                </div>
                              </div>

                              <div className="border rounded-md p-3">
                                <h3 className="font-medium text-sm mb-2">Stock Alerts</h3>
                                <div className="space-y-1 text-sm">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${permissions.canCreateAlerts ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                    <span>Create Alerts</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${permissions.canEditAlerts ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                    <span>Edit Alerts</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${permissions.canDeleteAlerts ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                    <span>Delete Alerts</span>
                                  </div>
                                </div>
                              </div>

                              <div className="border rounded-md p-3">
                                <h3 className="font-medium text-sm mb-2">Educational Content</h3>
                                <div className="space-y-1 text-sm">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${permissions.canCreateEducation ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                    <span>Create Courses</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${permissions.canEditEducation ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                    <span>Edit Courses</span>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              {/* Membership Tab */}
              <TabsContent value="membership">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Change membership tier */}
                  <div className="md:col-span-2">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Change Membership Tier</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {tierUpdateSuccess ? (
                          <div className="text-center py-6">
                            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                              <CheckCircle2 className="h-6 w-6 text-green-600" />
                            </div>
                            <h3 className="text-lg font-medium mb-2">Tier Updated Successfully</h3>
                            <p className="text-muted-foreground mb-4">
                              {user.username}'s membership has been updated to the {tierForm.watch("tier")} tier.
                            </p>
                            <Button 
                              onClick={() => {
                                setTierUpdateSuccess(false);
                                refetch();
                              }} 
                              className="w-full max-w-xs"
                            >
                              Done
                            </Button>
                          </div>
                        ) : (
                          <Form {...tierForm}>
                            <form onSubmit={tierForm.handleSubmit(onTierSubmit)} className="space-y-4">
                              <div className="grid grid-cols-1 gap-4">
                                <FormField
                                  control={tierForm.control}
                                  name="tier"
                                  render={({ field }) => (
                                    <FormItem className="space-y-3">
                                      <FormLabel>Select New Tier</FormLabel>
                                      <FormControl>
                                        <RadioGroup
                                          onValueChange={field.onChange}
                                          defaultValue={field.value}
                                          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                                        >
                                          <FormItem className="flex items-center space-x-3 space-y-0 border p-3 rounded-md">
                                            <FormControl>
                                              <RadioGroupItem value="free" />
                                            </FormControl>
                                            <FormLabel className="font-normal cursor-pointer flex-1">
                                              <div className="flex justify-between items-center">
                                                <span className="font-semibold">Free</span>
                                                <span className="text-muted-foreground text-xs">$0</span>
                                              </div>
                                            </FormLabel>
                                          </FormItem>
                                          <FormItem className="flex items-center space-x-3 space-y-0 border p-3 rounded-md">
                                            <FormControl>
                                              <RadioGroupItem value="paid" />
                                            </FormControl>
                                            <FormLabel className="font-normal cursor-pointer flex-1">
                                              <div className="flex justify-between items-center">
                                                <span className="font-semibold">Paid</span>
                                                <span className="text-muted-foreground text-xs">$29.99/m</span>
                                              </div>
                                            </FormLabel>
                                          </FormItem>
                                          <FormItem className="flex items-center space-x-3 space-y-0 border p-3 rounded-md">
                                            <FormControl>
                                              <RadioGroupItem value="premium" />
                                            </FormControl>
                                            <FormLabel className="font-normal cursor-pointer flex-1">
                                              <div className="flex justify-between items-center">
                                                <span className="font-semibold">Premium</span>
                                                <span className="text-muted-foreground text-xs">$999/yr</span>
                                              </div>
                                            </FormLabel>
                                          </FormItem>
                                          <FormItem className="flex items-center space-x-3 space-y-0 border p-3 rounded-md">
                                            <FormControl>
                                              <RadioGroupItem value="mentorship" />
                                            </FormControl>
                                            <FormLabel className="font-normal cursor-pointer flex-1">
                                              <div className="flex justify-between items-center">
                                                <span className="font-semibold">Mentorship</span>
                                                <span className="text-muted-foreground text-xs">$5,000</span>
                                              </div>
                                            </FormLabel>
                                          </FormItem>
                                          <FormItem className="flex items-center space-x-3 space-y-0 border p-3 rounded-md border-green-200 bg-green-50 sm:col-span-2">
                                            <FormControl>
                                              <RadioGroupItem value="employee" />
                                            </FormControl>
                                            <FormLabel className="font-normal cursor-pointer flex-1">
                                              <div className="flex justify-between items-center">
                                                <span className="font-semibold">Employee</span>
                                                <span className="text-muted-foreground text-xs">Internal</span>
                                              </div>
                                            </FormLabel>
                                          </FormItem>
                                        </RadioGroup>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                              <SelectValue placeholder="Select reason" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            <SelectItem value="upgrade">Upgrade</SelectItem>
                                            <SelectItem value="downgrade">Downgrade</SelectItem>
                                            <SelectItem value="admin_action">Admin Action</SelectItem>
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
                                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-8">
                                        <FormControl>
                                          <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                          />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                          <FormLabel>Notify User</FormLabel>
                                          <FormDescription className="text-xs">
                                            Send email notification
                                          </FormDescription>
                                        </div>
                                      </FormItem>
                                    )}
                                  />
                                </div>

                                <FormField
                                  control={tierForm.control}
                                  name="notes"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Notes</FormLabel>
                                      <FormControl>
                                        <textarea
                                          {...field}
                                          className="flex min-h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                          placeholder="Optional notes about this tier change"
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <Button 
                                  type="submit" 
                                  disabled={tierUpdateMutation.isPending || !hasPermission("canManageUsers")}
                                >
                                  {tierUpdateMutation.isPending ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Updating...
                                    </>
                                  ) : (
                                    "Update Membership"
                                  )}
                                </Button>
                              </div>
                            </form>
                          </Form>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Membership History and Billing */}
                  <div>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Membership History</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0 pt-0">
                        <div className="px-4 pb-4">
                          {user.tierChanges && Array.isArray(user.tierChanges) && user.tierChanges.length > 0 ? (
                            <div className="divide-y">
                              {user.tierChanges.map((change: any, index: number) => (
                                <div key={index} className="py-2">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <span className="text-sm font-medium capitalize">{change.from}</span>
                                      <span className="mx-2 text-muted-foreground">→</span>
                                      <span className="text-sm font-medium capitalize">{change.to}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{new Date(change.date).toLocaleDateString()}</span>
                                  </div>
                                  {change.reason && (
                                    <p className="text-xs text-muted-foreground mt-1 capitalize">
                                      {change.reason.replace('_', ' ')}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground py-2">No tier changes recorded</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="mt-4">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Billing Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Last Payment:</span>
                          <div className="text-sm text-right">
                            {user.lastBillingDate ? (
                              <>
                                <div className="font-medium">${typeof user.lastBillingAmount === 'number' ? user.lastBillingAmount.toFixed(2) : '0.00'}</div>
                                <div className="text-xs text-muted-foreground">{new Date(user.lastBillingDate).toLocaleDateString()}</div>
                              </>
                            ) : (
                              <span>None</span>
                            )}
                          </div>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Next Payment:</span>
                          <div className="text-sm text-right">
                            {user.nextBillingDate ? (
                              <>
                                <div className="font-medium">${typeof user.nextBillingAmount === 'number' ? user.nextBillingAmount.toFixed(2) : '0.00'}</div>
                                <div className="text-xs text-muted-foreground">{new Date(user.nextBillingDate).toLocaleDateString()}</div>
                              </>
                            ) : (
                              <span>None scheduled</span>
                            )}
                          </div>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Total Lifetime Spend:</span>
                          <span className="text-sm font-semibold">
                            ${typeof user.totalLifetimeSpend === 'number' ? user.totalLifetimeSpend.toFixed(2) : '0.00'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="mt-4">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Tier Benefits</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="p-4">
                          <h3 className="font-semibold text-sm mb-2 capitalize">
                            {tierInfo[tierForm.watch("tier") as keyof typeof tierInfo].title}
                          </h3>
                          <ul className="list-disc pl-5 space-y-1 text-xs">
                            {tierInfo[tierForm.watch("tier") as keyof typeof tierInfo].features.slice(0, 4).map((feature, index) => (
                              <li key={index}>{feature}</li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="mt-4">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Payment History</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {user.paymentHistory && Array.isArray(user.paymentHistory) && user.paymentHistory.length > 0 ? (
                          <div className="space-y-2 text-sm">
                            {user.paymentHistory.slice(0, 4).map((payment, index) => (
                              <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                                <div>
                                  <p className="font-medium">{payment.description || 'Subscription Payment'}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : 'N/A'}
                                  </p>
                                </div>
                                <Badge variant={(payment.paymentStatus === 'succeeded') ? 'success' : 
                                              (payment.paymentStatus === 'pending') ? 'outline' : 'destructive'}>
                                  ${payment.amount || '0.00'}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-muted-foreground">
                            <p>No payment history available</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* Account Tab */}
              <TabsContent value="account">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Account Status</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 rounded-md border">
                            <div>
                              <h3 className="font-medium">Account Active</h3>
                              <p className="text-xs text-muted-foreground">
                                User can access their account and all features
                              </p>
                            </div>
                            <div>
                              <Switch checked={true} disabled />
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 rounded-md border">
                            <div>
                              <h3 className="font-medium">Temporarily Suspend</h3>
                              <p className="text-xs text-muted-foreground">
                                Prevent the user from accessing the platform
                              </p>
                            </div>
                            <div>
                              <Button variant="outline" size="sm">
                                <Ban className="h-4 w-4 mr-1" />
                                Suspend
                              </Button>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 rounded-md border bg-red-50">
                            <div>
                              <h3 className="font-medium text-red-600">Delete Account</h3>
                              <p className="text-xs text-red-600">
                                Permanently delete this user account and all data
                              </p>
                            </div>
                            <div>
                              <Button variant="destructive" size="sm">
                                Delete Account
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Account activity */}
                    <Card className="mt-4">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg">Account Activity</CardTitle>
                          <Button variant="ghost" size="sm">View All</Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="px-4 pb-4">
                          <div className="text-center py-6 text-muted-foreground">
                            <p>Activity tracking will be available soon</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Account Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Initial Tier:</span>
                          <span className="font-medium capitalize">{user.initialTier || user.tier}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Account Created:</span>
                          <span className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                        {user.lastTierChangeDate && (
                          <>
                            <Separator />
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Last Tier Change:</span>
                              <span className="font-medium">{new Date(user.lastTierChangeDate).toLocaleDateString()}</span>
                            </div>
                          </>
                        )}
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Last Login:</span>
                          <span className="font-medium">Coming soon</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Device:</span>
                          <span className="font-medium">Coming soon</span>
                        </div>
                      </CardContent>
                    </Card>

                    {user.tier === "employee" && user.isAdmin && (
                      <Card className="mt-4">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">Admin Actions</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <Button variant="outline" className="w-full justify-start" asChild>
                              <Link href={`/admin/users/edit-permissions?id=${user.id}`}>
                                <Shield className="h-4 w-4 mr-2" />
                                Edit Permissions
                              </Link>
                            </Button>
                            
                            <Button variant="outline" className="w-full justify-start">
                              <UserRoundCog className="h-4 w-4 mr-2" />
                              View Login History
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}