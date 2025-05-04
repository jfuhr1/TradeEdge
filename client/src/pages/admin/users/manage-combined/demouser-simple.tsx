import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
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

// Copy from the regular manage-combined component
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

export default function DemoUserSimplePage() {
  const [_, setLocation] = useLocation();
  const actualUserId = 1; // Hard-coded to 1 for demouser
  
  const [profileUpdateSuccess, setProfileUpdateSuccess] = useState(false);
  const [tierUpdateSuccess, setTierUpdateSuccess] = useState(false);
  const [permissionsUpdateSuccess, setPermissionsUpdateSuccess] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  
  const { hasPermission } = useAdminPermissions();

  // Fetch user data
  const { data: user, isLoading, refetch } = useQuery<UserType>({
    queryKey: [`/api/admin/users/${actualUserId}`],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/admin/users/${actualUserId}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch user data: ${res.statusText}`);
        }
        return await res.json();
      } catch (error) {
        console.error("Error fetching user data:", error);
        throw error;
      }
    },
    enabled: !!actualUserId,
  });

  // Fetch admin permissions
  const { data: adminPermissions } = useQuery<AdminPermission>({
    queryKey: [`/api/admin/permissions/${actualUserId}`],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/admin/permissions/${actualUserId}`);
        if (res.status === 404) {
          return null;
        }
        if (!res.ok) {
          throw new Error(`Failed to fetch admin permissions: ${res.statusText}`);
        }
        return await res.json();
      } catch (error) {
        console.error("Error fetching admin permissions:", error);
        throw error;
      }
    },
    enabled: !!actualUserId,
  });

  const editProfile = useForm<EditUserFormValues>({
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

  const changeTier = useForm<ChangeTierFormValues>({
    resolver: zodResolver(changeTierSchema),
    defaultValues: {
      tier: "free",
      reason: "admin_action",
      notifyUser: true,
      notes: "",
    },
  });

  const editPermissions = useForm<EditPermissionsFormValues>({
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

  // Fill forms with user data when it loads
  useEffect(() => {
    if (user) {
      editProfile.reset({
        username: user.username || "",
        email: user.email || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        tier: user.tier || "free",
        phone: user.phone || "",
        profilePicture: user.profilePicture || "",
      });

      changeTier.reset({
        tier: user.tier as any || "free",
        reason: "admin_action",
        notifyUser: true,
        notes: "",
      });
    }
  }, [user, editProfile, changeTier]);

  // Fill permission form when admin permissions load
  useEffect(() => {
    if (adminPermissions) {
      const adminRoles = user?.adminRoles as string[] || [];
      
      editPermissions.reset({
        isAdmin: adminRoles.length > 0,
        adminRoles: adminRoles,
        permissions: {
          canManageUsers: adminPermissions.canManageUsers || false,
          canManageAdmins: adminPermissions.canManageAdmins || false,
          canCreateAlerts: adminPermissions.canCreateAlerts || false,
          canEditAlerts: adminPermissions.canEditAlerts || false,
          canDeleteAlerts: adminPermissions.canDeleteAlerts || false,
          canCreateEducation: adminPermissions.canCreateEducation || false,
          canEditEducation: adminPermissions.canEditEducation || false,
          canDeleteEducation: adminPermissions.canDeleteEducation || false,
          canCreateArticles: adminPermissions.canCreateArticles || false,
          canEditArticles: adminPermissions.canEditArticles || false,
          canDeleteArticles: adminPermissions.canDeleteArticles || false,
          canManageCoaching: adminPermissions.canManageCoaching || false,
          canManageGroupSessions: adminPermissions.canManageGroupSessions || false,
          canScheduleSessions: adminPermissions.canScheduleSessions || false,
          canViewSessionDetails: adminPermissions.canViewSessionDetails || false,
          canViewAnalytics: adminPermissions.canViewAnalytics || false,
        },
      });
    }
  }, [adminPermissions, editPermissions, user]);

  // Update profile mutation
  const updateProfile = useMutation({
    mutationFn: async (data: EditUserFormValues) => {
      const res = await apiRequest("PUT", `/api/admin/users/${actualUserId}`, data);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to update user: ${errorText}`);
      }
      return await res.json();
    },
    onSuccess: () => {
      setProfileUpdateSuccess(true);
      setTimeout(() => setProfileUpdateSuccess(false), 3000);
      queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${actualUserId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Profile Updated",
        description: "User profile has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // Change tier mutation
  const updateTier = useMutation({
    mutationFn: async (data: ChangeTierFormValues) => {
      const res = await apiRequest("POST", `/api/admin/users/${actualUserId}/change-tier`, data);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to change tier: ${errorText}`);
      }
      return await res.json();
    },
    onSuccess: () => {
      setTierUpdateSuccess(true);
      setTimeout(() => setTierUpdateSuccess(false), 3000);
      queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${actualUserId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Tier Updated",
        description: "User tier has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update tier",
        variant: "destructive",
      });
    },
  });

  // Update permissions mutation
  const updatePermissions = useMutation({
    mutationFn: async (data: EditPermissionsFormValues) => {
      // First update the admin roles
      const rolesRes = await apiRequest("PUT", `/api/admin/users/${actualUserId}/roles`, {
        adminRoles: data.isAdmin ? data.adminRoles : [],
      });
      
      if (!rolesRes.ok) {
        const errorText = await rolesRes.text();
        throw new Error(`Failed to update roles: ${errorText}`);
      }
      
      // Then update the permissions
      const permissionsRes = await apiRequest("PUT", `/api/admin/permissions/${actualUserId}`, data.permissions);
      
      if (!permissionsRes.ok) {
        const errorText = await permissionsRes.text();
        throw new Error(`Failed to update permissions: ${errorText}`);
      }
      
      return {
        roles: await rolesRes.json(),
        permissions: await permissionsRes.json(),
      };
    },
    onSuccess: () => {
      setPermissionsUpdateSuccess(true);
      setTimeout(() => setPermissionsUpdateSuccess(false), 3000);
      queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${actualUserId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/permissions/${actualUserId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Permissions Updated",
        description: "User permissions have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update permissions",
        variant: "destructive",
      });
    },
  });

  // Reset password mutation
  const resetPassword = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/users/${actualUserId}/reset-password`, {});
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to reset password: ${errorText}`);
      }
      return await res.json();
    },
    onSuccess: (data) => {
      setIsPasswordReset(true);
      setTimeout(() => setIsPasswordReset(false), 5000);
      toast({
        title: "Password Reset",
        description: `Password has been reset to: ${data.newPassword}`,
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

  const handleGoBack = () => {
    setLocation('/admin/users');
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button 
              variant="outline" 
              onClick={handleGoBack} 
              className="mr-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <h1 className="text-2xl font-bold">Manage Demo User</h1>
          </div>
          {user && (
            <div className="flex items-center">
              <Badge className="mr-2">{user.tier}</Badge>
              <Badge variant={user.isActive ? "success" : "destructive"}>
                {user.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          )}
        </div>
        
        {isLoading && (
          <div className="flex items-center justify-center min-h-[40vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        
        {user && (
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="profile" className="flex items-center">
                <User className="mr-2 h-4 w-4" /> Profile
              </TabsTrigger>
              <TabsTrigger value="tier" className="flex items-center">
                <CreditCard className="mr-2 h-4 w-4" /> Membership
              </TabsTrigger>
              <TabsTrigger value="permissions" className="flex items-center">
                <Shield className="mr-2 h-4 w-4" /> Permissions
              </TabsTrigger>
              <TabsTrigger value="account" className="flex items-center">
                <Settings className="mr-2 h-4 w-4" /> Account
              </TabsTrigger>
            </TabsList>
            
            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>User Profile</CardTitle>
                  <CardDescription>
                    Update user's personal information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...editProfile}>
                    <form onSubmit={editProfile.handleSubmit(data => updateProfile.mutate(data))} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={editProfile.control}
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
                          control={editProfile.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
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
                          control={editProfile.control}
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
                          control={editProfile.control}
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
                          control={editProfile.control}
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
                          control={editProfile.control}
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
                      <div className="flex justify-end space-x-2">
                        <Button type="submit" disabled={updateProfile.isPending}>
                          {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save Changes
                        </Button>
                        {profileUpdateSuccess && (
                          <div className="flex items-center text-green-500">
                            <CheckCircle2 className="mr-1 h-4 w-4" /> Saved
                          </div>
                        )}
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Tier Tab */}
            <TabsContent value="tier" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Membership Information</CardTitle>
                  <CardDescription>
                    Update user's membership tier and payment information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Current Membership</h3>
                      <div className="bg-muted p-4 rounded-md space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Current Tier:</span>
                          <Badge variant="outline">{user.tier}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Join Date:</span>
                          <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Last Tier Change:</span>
                          <span>{user.lastTierChangeDate ? new Date(user.lastTierChangeDate).toLocaleDateString() : "None"}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-2">Payment Information</h3>
                      <div className="bg-muted p-4 rounded-md space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Total Spend:</span>
                          <span>${user.totalSpent?.toFixed(2) || "0.00"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Last Payment:</span>
                          <span>{user.lastPaymentDate ? new Date(user.lastPaymentDate).toLocaleDateString() : "None"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Next Payment:</span>
                          <span>{user.nextPaymentDate ? new Date(user.nextPaymentDate).toLocaleDateString() : "None"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="my-6" />
                  
                  <Form {...changeTier}>
                    <form onSubmit={changeTier.handleSubmit(data => updateTier.mutate(data))} className="space-y-4">
                      <h3 className="text-lg font-medium mb-2">Change Membership Tier</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={changeTier.control}
                          name="tier"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>New Tier</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a tier" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="free">Free</SelectItem>
                                  <SelectItem value="paid">Paid</SelectItem>
                                  <SelectItem value="premium">Premium</SelectItem>
                                  <SelectItem value="mentorship">Mentorship</SelectItem>
                                  <SelectItem value="employee">Employee</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={changeTier.control}
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
                      </div>
                      <FormField
                        control={changeTier.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={changeTier.control}
                        name="notifyUser"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Notify User</FormLabel>
                              <FormDescription>
                                Send an email notification to the user about this change
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button 
                          type="submit" 
                          disabled={updateTier.isPending || (changeTier.watch("tier") === user.tier)}
                        >
                          {updateTier.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Update Membership
                        </Button>
                        {tierUpdateSuccess && (
                          <div className="flex items-center text-green-500">
                            <CheckCircle2 className="mr-1 h-4 w-4" /> Saved
                          </div>
                        )}
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Permissions Tab */}
            <TabsContent value="permissions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Admin Permissions</CardTitle>
                  <CardDescription>
                    Manage user's admin status and permissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...editPermissions}>
                    <form onSubmit={editPermissions.handleSubmit(data => updatePermissions.mutate(data))} className="space-y-6">
                      <FormField
                        control={editPermissions.control}
                        name="isAdmin"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Admin Status</FormLabel>
                              <FormDescription>
                                Set whether this user has admin access
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
                      
                      {editPermissions.watch("isAdmin") && (
                        <>
                          <div className="space-y-4">
                            <h3 className="text-lg font-medium">Admin Roles</h3>
                            <FormField
                              control={editPermissions.control}
                              name="adminRoles"
                              render={() => (
                                <FormItem>
                                  <div className="grid grid-cols-2 gap-4">
                                    {adminRoles.map((role) => (
                                      <FormField
                                        key={role}
                                        control={editPermissions.control}
                                        name="adminRoles"
                                        render={({ field }) => {
                                          return (
                                            <FormItem
                                              key={role}
                                              className="flex flex-row items-start space-x-3 space-y-0"
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
                                                />
                                              </FormControl>
                                              <FormLabel className="font-normal">
                                                {role.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                                              </FormLabel>
                                            </FormItem>
                                          )
                                        }}
                                      />
                                    ))}
                                  </div>
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <Separator />
                          
                          <div className="space-y-4">
                            <h3 className="text-lg font-medium">Specific Permissions</h3>
                            <div className="grid grid-cols-2 gap-4">
                              {Object.keys(editPermissions.watch("permissions")).map((permission) => (
                                <FormField
                                  key={permission}
                                  control={editPermissions.control}
                                  name={`permissions.${permission}` as any}
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        {permission.replace(/([A-Z])/g, ' $1')
                                          .replace(/^./, str => str.toUpperCase())
                                          .replace(/Can/g, '')}
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                      
                      <div className="flex justify-end space-x-2">
                        <Button 
                          type="submit" 
                          disabled={updatePermissions.isPending}
                        >
                          {updatePermissions.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save Permissions
                        </Button>
                        {permissionsUpdateSuccess && (
                          <div className="flex items-center text-green-500">
                            <CheckCircle2 className="mr-1 h-4 w-4" /> Saved
                          </div>
                        )}
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Account Tab */}
            <TabsContent value="account" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Account Management</CardTitle>
                  <CardDescription>
                    Manage user's account status and security
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Account Status</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-md border p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Account Created</h4>
                            <p className="text-sm text-gray-500">
                              {new Date(user.createdAt).toLocaleDateString()} at {new Date(user.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-md border p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Last Login</h4>
                            <p className="text-sm text-gray-500">
                              {user.lastLoginDate 
                                ? `${new Date(user.lastLoginDate).toLocaleDateString()} at ${new Date(user.lastLoginDate).toLocaleTimeString()}`
                                : "Never logged in"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Account Actions</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <h4 className="font-medium">Reset Password</h4>
                          <p className="text-sm text-gray-500">Generate a new random password for this user</p>
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={() => resetPassword.mutate()}
                          disabled={resetPassword.isPending}
                        >
                          {resetPassword.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Reset
                        </Button>
                      </div>
                      
                      {isPasswordReset && (
                        <div className="rounded-lg bg-green-50 p-4 border border-green-200">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <CheckCircle2 className="h-5 w-5 text-green-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-green-800">Password has been reset</h3>
                              <div className="mt-2 text-sm text-green-700">
                                <p>The new password is displayed in the notification. Make sure to share it with the user.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <h4 className="font-medium">Disable MFA</h4>
                          <p className="text-sm text-gray-500">Remove multi-factor authentication from this account</p>
                        </div>
                        <Button variant="outline" disabled={!user.mfaEnabled}>
                          {user.mfaEnabled ? "Disable" : "Not Enabled"}
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between rounded-lg border p-4 border-destructive">
                        <div>
                          <h4 className="font-medium text-destructive">Delete Account</h4>
                          <p className="text-sm text-gray-500">Permanently remove this account and all associated data</p>
                        </div>
                        <Button variant="destructive">
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AdminLayout>
  );
}